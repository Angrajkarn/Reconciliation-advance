from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models.transaction import Transaction
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Schema for Response (to be safe)
class TransactionSchema(BaseModel):
    id: str
    source: str
    amount: float
    currency: str
    status: str
    match_confidence: float
    risk_score: int
    counterparty: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[TransactionSchema])
def get_transactions(
    status: Optional[str] = Query(None),
    min_risk: Optional[int] = Query(None),
    source: Optional[str] = Query(None),
    min_amount: Optional[float] = Query(None),
    sla_risk: bool = Query(False),
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Fetch transactions with real-time filtering.
    """
    query = select(Transaction)
    
    if status:
        query = query.where(Transaction.status == status)
    if min_risk is not None:
        query = query.where(Transaction.risk_score >= min_risk)
    if source:
        query = query.where(Transaction.source == source)
    if min_amount is not None:
        query = query.where(Transaction.amount >= min_amount)
        
    if sla_risk:
        # User wants items close to breach or breached.
        # Assuming SLA is 4 hours. Risk means < 1 hour remaining => Created > 3 hours ago.
        # So created_at < now - 3 hours.
        from datetime import datetime, timedelta
        cutoff = datetime.now() - timedelta(hours=3)
        query = query.where(Transaction.created_at < cutoff)

    # Sort by risk (highest first) by default
    query = query.order_by(desc(Transaction.risk_score)).limit(limit)
    
    result = db.execute(query)
    return result.scalars().all()

class StatusUpdate(BaseModel):
    status: str
    reason_code: Optional[str] = None
    justification: Optional[str] = None

@router.patch("/{transaction_id}/status")
def update_transaction_status(
    transaction_id: str,
    update_data: StatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Approve or Reject a transaction (Governance Action).
    """
    from app.models.user import AuditLog
    
    # 1. Fetch Txn
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # 2. Update Status
    old_status = txn.status
    txn.status = update_data.status
    
    # 3. Create Audit Log
    audit = AuditLog(
        event_type=f"MANUAL_{update_data.status}",
        actor_id="admin@jpm.com", # Hardcoded for now (Auth disabled)
        resource=transaction_id,
        outcome="SUCCESS",
        risk_score=0
    )
    
    db.add(audit)
    db.commit()
    db.refresh(txn)

    # 4. Trigger Shadow Mode Comparison (Async ideally, blocking for now)
    try:
        from app.core.shadow import ShadowRunner
        shadow = ShadowRunner(db)
        # Map manual status to action space
        actual_action = "AUTO" if update_data.status == "AUTO_RECONCILED" else "REVIEW" 
        if update_data.status == "REJECTED": actual_action = "REVIEW" # Reject counts as manual review outcome
        
        shadow.run_comparison(txn, actual_action)
    except Exception as e:
        print(f"Shadow Runner failed: {e}")
    
    return txn

class MatchCandidate(BaseModel):
    id: str
    source: str
    amount: float
    currency: str
    score: float

class TransactionDetailResponse(BaseModel):
    transaction: TransactionSchema
    candidate: Optional[MatchCandidate]
    delta: float = 0.0
    explainability: List[str] = []

@router.get("/{transaction_id}/details", response_model=TransactionDetailResponse)
def get_transaction_details(transaction_id: str, db: Session = Depends(get_db)):
    """
    Fetch comprehensive details for a transaction, including:
    - The transaction itself (Side A)
    - The best match candidate found in the system (Side B), if any
    - Explainability factors for the risk score
    """
    # 1. Fetch Requesting Transaction
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    response = TransactionDetailResponse(transaction=txn, candidate=None)
    
    # 2. Find Best Candidate (Real-time logic)
    # Strategy: Find opposite source, same currency, closest amount
    opposite_source = "SWIFT" if txn.source == "INTERNAL" else "INTERNAL" # Simplified
    
    # Tolerance window: +/- 5% amount, T +/- 1 day (omitted for speed)
    candidates = db.query(Transaction).filter(
        Transaction.source != txn.source, # Simplification for demo
        Transaction.currency == txn.currency
    ).all()
    
    best_candidate = None
    best_score = 0
    
    for cand in candidates:
        # Simple Similarity Score
        amt_diff = abs(cand.amount - txn.amount)
        amt_score = max(0, 100 - (amt_diff * 10)) # Penalize 10 points per dollar diff
        
        # Name fuzzy match (mocked heavily)
        name_score = 50 # Base
        if txn.counterparty and cand.counterparty and txn.counterparty in cand.counterparty:
            name_score = 100
            
        final_score = (amt_score * 0.7) + (name_score * 0.3)
        
        if final_score > best_score and final_score > 50: # Threshold
            best_candidate = cand
            best_score = final_score
            
    # 3. Construct Response
    if best_candidate:
        response.candidate = MatchCandidate(
            id=best_candidate.id,
            source=best_candidate.source,
            amount=best_candidate.amount,
            currency=best_candidate.currency,
            score=best_score
        )
        response.delta = round(txn.amount - best_candidate.amount, 2)
        
        # Explainability
        reasons = []
        if response.delta == 0:
            reasons.append("Perfect Amount Match")
        else:
            reasons.append(f"Amount Mismatch ({response.delta} {txn.currency})")
            
        if best_score > 90:
            reasons.append("Strong Counterparty Match")
        else:
            reasons.append("Weak Counterparty Match")
            
        response.explainability = reasons
    else:
        # No candidate found
        response.explainability = ["No matching record found in opposite ledger"]
        
    return response


