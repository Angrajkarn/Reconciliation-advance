from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from app.db.session import get_db
from app.models.user import AuditLog
from typing import Dict, Any

router = APIRouter()

@router.get("/rl-comparison")
def get_rl_shadow_report(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Analyzes SHADOW_EVAL events to compare RL Model vs Human/System performance.
    """
    # 1. Fetch Shadow Logs
    query = select(AuditLog).where(AuditLog.event_type == "SHADOW_EVAL").order_by(AuditLog.timestamp.desc())
    logs = db.execute(query).scalars().all()
    
    total = len(logs)
    if total == 0:
        return {"status": "No Data", "agreement_rate": 0}
        
    matches = sum(1 for log in logs if log.outcome == "MATCH")
    deviations = sum(1 for log in logs if log.outcome == "DEVIATION")
    
    # 2. Analyze Deviations
    # We stored details in 'resource' field: "{txn_id} | RL:{rl_action} vs ACT:{actual_action}"
    deviation_breakdown = {
        "false_positive": 0, # RL=AUTO, Human=REVIEW
        "false_negative": 0  # RL=REVIEW, Human=AUTO
    }
    
    for log in logs:
        if log.outcome == "DEVIATION" and log.resource:
            try:
                parts = log.resource.split("|")
                if len(parts) > 1:
                    details = parts[1].strip() # RL:AUTO vs ACT:REVIEW
                    if "RL:AUTO" in details and "ACT:REVIEW" in details:
                        deviation_breakdown["false_positive"] += 1
                    elif "RL:REVIEW" in details and "ACT:AUTO" in details:
                        deviation_breakdown["false_negative"] += 1
            except:
                pass

    return {
        "summary": {
            "total_evaluations": total,
            "matches": matches,
            "deviations": deviations,
            "agreement_rate": float(f"{(matches/total)*100:.2f}")
        },
        "deviation_analysis": deviation_breakdown,
        "recent_logs": [
            {
                "time": log.timestamp,
                "txn_id": log.resource.split("|")[0].strip() if log.resource else "N/A",
                "outcome": log.outcome,
                "confidence": log.risk_score # re-purposed field for confidence
            }
            for log in logs[:10]
        ]
    }
