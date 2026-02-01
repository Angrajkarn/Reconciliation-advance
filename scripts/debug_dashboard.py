import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.transaction import Transaction
from app.models.user import AuditLog
from datetime import datetime, timedelta

def debug():
    db = SessionLocal()
    try:
        print("Debugging Dashboard Stats...")
        
        # 1. Users
        from app.models.user import User
        users = db.query(User).count()
        print(f"Users: {users}")

        # 2. Ops Backlog
        ops = db.query(Transaction).filter(Transaction.status == "EXCEPTION").count()
        print(f"Ops Backlog: {ops}")

        # 3. High Risk
        hr = db.query(Transaction).filter(Transaction.risk_score > 80, Transaction.status == "EXCEPTION").count()
        print(f"High Risk: {hr}")

        # 4. SLA Breaches
        cutoff = datetime.now() - timedelta(hours=4)
        sla = db.query(Transaction).filter(Transaction.created_at < cutoff, Transaction.status != "AUTO_RECONCILED").count()
        print(f"SLA Breaches: {sla}")

        # 5. Alerts Logic
        audit_alerts = db.query(AuditLog).filter(
            (AuditLog.risk_score > 5) # relaxed for testing
        ).limit(5).all()
        print(f"Found {len(audit_alerts)} audit alerts")

        txn_alerts = db.query(Transaction).filter(
            Transaction.risk_score > 80,
            Transaction.status == "EXCEPTION"
        ).order_by(Transaction.created_at.desc()).limit(5).all()
        print(f"Found {len(txn_alerts)} txn alerts")
        
        for txn in txn_alerts:
            print(f"Txn Time: {txn.created_at} Type: {type(txn.created_at)}")

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    debug()
