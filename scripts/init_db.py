import asyncio
import sys
import os
# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.db.session import engine, Base, SessionLocal
from app.models.user import User, Role
from app.models.system import System, SystemProfile
from app.core.security import get_password_hash

from app.models.policy import RLPolicy
from app.models.transaction import Transaction # Register Transaction Table

def init_db():
    print("Creating Tables...")
    
    # 1. Reset Tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # 5. Initialize RL Governance Policies
        # Baseline Rules (Deterministic)
        baseline = RLPolicy(
            version="v1.0.0-baseline",
            description="Legacy deterministic rule set",
            status="ACTIVE",
            created_by="system",
            reward_config={"method": "rules_only"},
            constraints={"allow_auto_reconcile": True}
        )
        
        # Shadow RL Model (Candidate)
        shadow_candidate = RLPolicy(
            version="v2.0.0-alpha",
            description="PPO Ops Optimization Model (Shadow Mode)",
            status="SHADOW",
            created_by="system",
            reward_config={
                "success_reward": 1.0,
                "manual_override_penalty": -10.0,
                "risk_breach_penalty": -100.0, 
                "ops_latency_penalty": -0.1
            },
            constraints={
                "max_auto_amount": 50000,
                "min_confidence": 0.95
            }
        )
        
        db.add_all([baseline, shadow_candidate])
        db.commit()
        print("RL Policies Initialized.")

        # 1. Create Default Roles
        admin_role = Role(name="ADMIN", description="Global Administrator")
        ops_role = Role(name="OPS_ANALYST", description="Operations Analyst")
        db.add_all([admin_role, ops_role])
        db.commit()

        # 2. Create Global Admin Identity
        hashed = get_password_hash("admin123")
        admin_user = User(
            email="admin@jpm.com",
            hashed_password=hashed,
            full_name="Karn Deo (Admin)",
            is_active=True,
            is_superuser=True,
            roles=[admin_role]
        )
        db.add(admin_user)
        db.commit()
        
        # 3. Create Enterprise Systems
        systems = [
            System(code="RECON", name="Reconciliation Platform", description="Core transaction matching engine"),
            System(code="RISK", name="Risk & Compliance Engine", description="Real-time fraud and risk scoring"),
            System(code="LEDGER", name="General Ledger Core", description="Immutable system of record"),
        ]
        db.add_all(systems)
        db.commit()
        
        # 4. Provision Admin Profiles
        # Admin gets access to ALL systems
        for sys in systems:
            profile = SystemProfile(
                identity_id=admin_user.id,
                system_id=sys.id,
                username=f"admin.{sys.code.lower()}",
                role="ADMIN",
                status="ACTIVE"
            )
            db.add(profile)
        
        db.commit()
        db.commit()
        print(f"Initialized Database with {len(systems)} Systems and Admin Identity.")
        
        # 5. Create Mock Login Event for "Active Sessions" Panel
        from app.models.user import AuditLog
        login_event = AuditLog(
            event_type="LOGIN_SUCCESS",
            actor_id="admin@jpm.com",
            resource="portal",
            outcome="SUCCESS",
            risk_score=0
        )
        db.add(login_event)
        db.commit()
        
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
