from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.db.session import get_db
from app.models.policy import RLPolicy
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

router = APIRouter()

# Schema
class RLPolicySchema(BaseModel):
    id: str
    version: str
    description: Optional[str]
    status: str
    reward_config: Dict[str, Any]
    constraints: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

class PolicyCreate(BaseModel):
    version: str
    description: str
    reward_config: Dict[str, Any]
    constraints: Dict[str, Any]

@router.get("/", response_model=List[RLPolicySchema])
def list_policies(
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List all governance policies.
    """
    query = select(RLPolicy)
    if status:
        query = query.where(RLPolicy.status == status)
    result = db.execute(query.order_by(RLPolicy.created_at.desc()))
    return result.scalars().all()

@router.post("/", response_model=RLPolicySchema)
def create_policy(
    policy: PolicyCreate,
    db: Session = Depends(get_db)
):
    """
    Draft a new governance policy (Status: TRAINING).
    """
    new_policy = RLPolicy(
        version=policy.version,
        description=policy.description,
        status="TRAINING",
        reward_config=policy.reward_config,
        constraints=policy.constraints,
        created_by="admin" # TODO: Real Identity
    )
    db.add(new_policy)
    db.commit()
    return new_policy

@router.patch("/{policy_id}/deploy")
def deploy_policy(
    policy_id: str,
    mode: str = "SHADOW", # SHADOW or ACTIVE
    db: Session = Depends(get_db)
):
    """
    Promote a policy to SHADOW or ACTIVE state.
    If ACTIVE, archives the currently active policy.
    """
    target = db.query(RLPolicy).filter(RLPolicy.id == policy_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    if mode == "ACTIVE":
        # 1. Archive current active
        current_active = db.query(RLPolicy).filter(RLPolicy.status == "ACTIVE").first()
        if current_active:
            current_active.status = "ARCHIVED"
        
        target.status = "ACTIVE"
        target.activated_at = datetime.utcnow()
    
    elif mode == "SHADOW":
        target.status = "SHADOW"
    
    db.commit()
    db.refresh(target)
    return {"message": f"Policy {target.version} deployed to {mode}", "policy": target}
