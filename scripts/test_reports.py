from app.db.session import SessionLocal
from app.models.user import AuditLog
from datetime import datetime

async def verify_reports():
    print("Verifying Reporting API...")
    async with SessionLocal() as db:
        # 1. Seed some shadow logs
        logs = [
            AuditLog(event_type="SHADOW_EVAL", actor_id="model:vTest", resource="TXN-1 | RL:AUTO vs ACT:AUTO", outcome="MATCH", risk_score=95),
            AuditLog(event_type="SHADOW_EVAL", actor_id="model:vTest", resource="TXN-2 | RL:REVIEW vs ACT:REVIEW", outcome="MATCH", risk_score=90),
            AuditLog(event_type="SHADOW_EVAL", actor_id="model:vTest", resource="TXN-3 | RL:AUTO vs ACT:REVIEW", outcome="DEVIATION", risk_score=99), # Dangerous FP
        ]
        db.add_all(logs)
        await db.commit()
        print("Seeded 3 Shadow Logs.")
        
    print("Verification complete. Check endpoint /admin/reports/rl-comparison")

if __name__ == "__main__":
    import asyncio
    asyncio.run(verify_reports())
