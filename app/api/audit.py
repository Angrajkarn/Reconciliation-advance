from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.db.session import get_db
from app.models.user import AuditLog
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class AuditLogSchema(BaseModel):
    id: str
    event_type: str
    actor_id: str
    resource: Optional[str]
    outcome: str
    risk_score: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

@router.get("", response_model=List[AuditLogSchema])
def get_audit_logs(
    limit: int = 100,
    actor_id: Optional[str] = None,
    resource: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if actor_id:
        query = query.where(AuditLog.actor_id == actor_id)
    if resource:
        query = query.where(AuditLog.resource.contains(resource))
        
    result = db.execute(query)
    return result.scalars().all()
