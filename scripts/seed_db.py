from app.db.session import SessionLocal
from app.models.user import User, Role
from app.models.transaction import Transaction
from app.core.security import get_password_hash
import random

def seed_db():
    session = SessionLocal()
    try:
        # ... (User/Role logic remains) ...
        # 1. Create Roles
        admin_role = Role(name="ADMIN", description="System Administrator", permissions='["ALL"]')
        ops_role = Role(name="OPS_ANALYST", description="Operations Analyst", permissions='["READ", "EXECUTE"]')
        
        # Check if exists
        if session.query(Role).filter_by(name="ADMIN").first():
            print("⚠️ DB already seeded.")
            return
        session.add_all([admin_role, ops_role])
        session.commit()

        # 2. Create Admin User
        admin_user = User(
            email="admin@jpm.com",
            hashed_password=get_password_hash("SuperSecurePassword123!"),
            full_name="System Administrator",
            is_active=True,
            is_superuser=True,
            roles=[admin_role]
        )
        session.add(admin_user)
        session.commit()
        session.add(admin_user)
        session.commit()
        print("✅ Database Seeded Successfully: admin@jpm.com")

        # 3. Seed Transactions
        if session.query(Transaction).count() == 0:
            print("Seeding Transactions...")
            txns = []
            sources = ['SWIFT_MT103', 'INTERNAL_LEDGER']
            statuses = ['AUTO_RECONCILED', 'EXCEPTION', 'OPS_REVIEW']
            currencies = ['USD', 'EUR', 'GBP']
            
            for i in range(500):
                status = random.choice(statuses)
                risk = random.randint(0, 20) if status == 'AUTO_RECONCILED' else random.randint(50, 100)
                conf = random.uniform(90, 100) if status == 'AUTO_RECONCILED' else random.uniform(50, 80)
                
                txns.append(Transaction(
                    source=random.choice(sources),
                    amount=round(random.uniform(1000, 500000), 2),
                    currency=random.choice(currencies),
                    status=status,
                    risk_score=risk,
                    match_confidence=round(conf, 1),
                    counterparty=f"CLIENT_{random.randint(100, 999)}"
                ))
            
            session.add_all(txns)
            session.commit()
            print(f"✅ Created 500 Real Transactions.")
            
    except Exception as e:
        session.rollback()
        print(f"❌ Seeding Failed: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_db()
