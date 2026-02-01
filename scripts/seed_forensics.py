import sys
import os
import random
import uuid
import json
import hashlib
import numpy as np
from datetime import datetime, timedelta

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.models.transaction import Transaction
from app.models.ledger import ForensicLedger
# Import User model to ensure it's registered in Base.metadata for relationships
from app.models.user import User 

# Create Tables if not exist
Base.metadata.create_all(bind=engine)

def calculate_hash(data: str, prev_hash: str = "") -> str:
    raw = f"{data}{prev_hash}"
    return hashlib.sha256(raw.encode()).hexdigest()

def seed_forensics():
    db: Session = SessionLocal()
    print("Beginning Forensic Ledger Seeding...")

    # Clear old data (optional)
    try:
        db.query(ForensicLedger).delete()
        db.query(Transaction).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Warning clearing tables: {e}")
    
    # Templates
    counterparties = ["AMAZON_EU", "TESLA_CORP", "ALPHABET_INC", "JP_MORGAN_INTERNAL"]
    
    # Realistic Users for Maker-Checker
    makers = ["J. Doe (Ops)", "A. Patel (Ops)", "M. Chen (Ops)", "S. O'Connor (Ops)"]
    checkers = ["S. Smith (Gov)", "L. James (Risk)", "D. Krovac (Admin)", "E. Mtume (Gov)"]

    # Generate 50 Transactions with full history
    for i in range(50):
        txn_id = f"TXN-{random.randint(10000, 99999)}"
        cpty = random.choice(counterparties)
        amount = round(np.random.lognormal(7, 1.2), 2)
        
        # Select Actors for this specific transaction
        maker = random.choice(makers)
        checker = random.choice([c for c in checkers if c != maker]) # Segregation of Duties

        # 0. Base Transaction
        txn = Transaction(
            id=txn_id,
            source="SWIFT_MT103",
            amount=amount,
            currency="USD",
            counterparty=cpty,
            status="MATCHED",
            risk_score=random.randint(0, 30),
            match_confidence=random.uniform(0.90, 0.99)
        )
        db.add(txn)
        
        # Chain State
        prev_hash = "0" * 64
        base_time = datetime.now() - timedelta(minutes=random.randint(10, 5000))
        
        # 1. INGESTION
        payload_1 = json.dumps({"raw_msg": f"MT103 {{20:{txn_id}}} {{32A:{amount}USD}}"})
        curr_hash = calculate_hash(payload_1, prev_hash)
        
        l1 = ForensicLedger(
            txn_id=txn_id,
            event_type="INGESTION",
            stage="LAYER_1_INGEST",
            actor="GATEWAY_SWIFT",
            payload_hash=curr_hash,
            previous_hash=prev_hash,
            metadata_json=payload_1,
            timestamp=base_time
        )
        db.add(l1)
        prev_hash = curr_hash
        base_time += timedelta(milliseconds=random.randint(50, 200))

        # 2. NORMALIZATION
        payload_2 = json.dumps({"schema_v": "2.1", "std_fields": {"amt": amount, "ccy": "USD"}})
        curr_hash = calculate_hash(payload_2, prev_hash)
        
        l2 = ForensicLedger(
            txn_id=txn_id,
            event_type="NORMALIZATION",
            stage="LAYER_2_PREP",
            actor="SCHEMA_VALIDATOR",
            payload_hash=curr_hash,
            previous_hash=prev_hash,
            metadata_json=payload_2,
            timestamp=base_time
        )
        db.add(l2)
        prev_hash = curr_hash
        base_time += timedelta(milliseconds=random.randint(100, 500))

        # 3. ML SCORING
        payload_3 = json.dumps({
            "model": "XGBoost_v4.2", 
            "features": {"amt_diff": 0, "date_diff": 0},
            "score": 0.98
        })
        curr_hash = calculate_hash(payload_3, prev_hash)
        
        l3 = ForensicLedger(
            txn_id=txn_id,
            event_type="ML_SCORING",
            stage="LAYER_3_DECISION",
            actor="MODEL_INFERENCE_ENGINE",
            payload_hash=curr_hash,
            previous_hash=prev_hash,
            metadata_json=payload_3,
            timestamp=base_time
        )
        db.add(l3)
        prev_hash = curr_hash
        base_time += timedelta(minutes=random.randint(1, 5))

        # 4. OPS REVIEW (MAKER)
        payload_4 = json.dumps({"review": "VERIFIED_VALID", "role": "MAKER"})
        curr_hash = calculate_hash(payload_4, prev_hash)
        
        l4 = ForensicLedger(
            txn_id=txn_id,
            event_type="OPS_REVIEW",
            stage="LAYER_4_REVIEW",
            actor=maker, # Dynamic Maker
            payload_hash=curr_hash,
            previous_hash=prev_hash,
            metadata_json=payload_4,
            timestamp=base_time
        )
        db.add(l4)
        prev_hash = curr_hash
        base_time += timedelta(minutes=random.randint(10, 60))

        # 5. FINAL GOVERNANCE (CHECKER)
        payload_5 = json.dumps({"decision": "APPROVE", "role": "CHECKER"})
        curr_hash = calculate_hash(payload_5, prev_hash)
        
        l5 = ForensicLedger(
            txn_id=txn_id,
            event_type="FINAL_DECISION",
            stage="LAYER_5_GOVERNANCE",
            actor=checker, # Dynamic Checker
            payload_hash=curr_hash,
            previous_hash=prev_hash,
            metadata_json=payload_5,
            timestamp=base_time
        )
        db.add(l5)

    db.commit()
    print(f"✅ Seeded 50 Transactions with Forensic Ledger Chains.")

if __name__ == "__main__":
    seed_forensics()
