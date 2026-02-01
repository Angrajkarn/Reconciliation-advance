from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.transaction import Transaction
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

# Reuse Transaction Schema or specific Ticket Schema
class GovernanceTicketSchema(BaseModel):
    id: str
    source: str
    amount: float
    status: str
    risk_score: int
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.get("/tickets", response_model=List[GovernanceTicketSchema])
def get_governance_tickets(
    status: str = "PENDING", # Default to pending types
    min_risk: int = 0,
    scope: str = "ALL", # MY_QUEUE vs ALL
    db: Session = Depends(get_db)
):
    """
    Fetch items requiring governance action with real-time filtering.
    """
    # Base query for governance items
    query = select(Transaction)
    
    # status filter
    if status == "PENDING":
        query = query.where(Transaction.status.in_(['EXCEPTION', 'OPS_REVIEW']))
    else:
        # Allow specific status if needed
        query = query.where(Transaction.status == status)

    # risk filter
    if min_risk > 0:
        query = query.where(Transaction.risk_score >= min_risk)
        
    # scope filter (mock implementation for now as we don't have auth context fully wired)
    # If MY_QUEUE, maybe filter by assignee? For now, we'll just simulate it.
    
    query = query.order_by(Transaction.risk_score.desc()).limit(50)
    
    result = db.execute(query)
    return result.scalars().all()

class GovernanceAction(BaseModel):
    action: str  # APPROVE, REJECT
    comments: str

@router.post("/tickets/{ticket_id}/action")
def take_governance_action(
    ticket_id: str,
    action_data: GovernanceAction,
    db: Session = Depends(get_db)
):
    """
    Commit a governance decision (Approve/Reject).
    """
    # 1. Fetch Txn (Ticket ID is typically GOV-RefID, but frontend sends txnId often. 
    # Based on Schema: id is string. Let's assume ticket_id passes the transaction ID or we strip prefix.
    # Frontend sends `selectedItem.id` which is GOV-xxxx. `selectedItem.txnRef` is actual ID.
    # Ideally frontend should send txnRef. We will strip 'GOV-' if present.
    
    clean_id = ticket_id.replace("GOV-", "")
    if ticket_id.startswith("TXN-"):
        clean_id = ticket_id # It's already a component ID
        
    # Try fetching by full ID first
    txn = db.query(Transaction).filter(Transaction.id == ticket_id).first()
    if not txn:
        # Try clean ID
        txn = db.query(Transaction).filter(Transaction.id == clean_id).first()
        
    if not txn:
        # Try matching suffix if it's a generated ID
        # Accessing by like is risky, but for now assuming direct match
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Transaction Ticket not found")

    # 2. Apply Decision
    if action_data.action == "APPROVE":
        txn.status = "APPROVED" # Or AUTO_RECONCILED/MANUAL_MATCH
    elif action_data.action == "REJECT":
        txn.status = "REJECTED"
    elif action_data.action == "ESCALATE":
        txn.status = "COMPLIANCE_REVIEW"
        
    # 3. Audit Log
    from app.models.user import AuditLog
    audit = AuditLog(
        event_type=f"GOVERNANCE_{action_data.action}",
        actor_id="senior_risk_mgr@jpm.com",
        resource=txn.id,
        outcome="SUCCESS",
        risk_score=txn.risk_score,
        details=action_data.comments
    )
    db.add(audit)
    db.commit()
    db.refresh(txn)
    
    return {"status": "success", "new_state": txn.status}

@router.get("/tickets/{ticket_id}/history")
def get_ticket_history(ticket_id: str, db: Session = Depends(get_db)):
    """
    Fetch audit history for a specific ticket/transaction.
    """
    # Clean ID logic (same as action)
    clean_id = ticket_id.replace("GOV-", "")
    if ticket_id.startswith("TXN-"):
        clean_id = ticket_id
        
    from app.models.user import AuditLog
    
    # Fetch logs for this resource
    logs = db.query(AuditLog).filter(AuditLog.resource == clean_id).order_by(AuditLog.timestamp.desc()).all()
    
    return logs
