import numpy as np
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
import random
import os

fake = Faker()

N = 12000  # generate more than 10k

SOURCE_SYSTEMS = ["SOURCE_A", "SOURCE_B", "SOURCE_C"]
DECISIONS = ["AUTO_RECONCILED", "OPS_REVIEW", "EXCEPTION"]

def generate_amount():
    return round(np.random.lognormal(mean=7, sigma=1.1), 2)

def generate_reference_similarity():
    return round(np.random.beta(5, 2), 2)

def generate_anomaly_score(amount):
    base = np.random.rand()
    if amount > 500000:
        base += 0.3
    return round(min(base, 1), 2)

def decision_logic(confidence, anomaly, sla):
    if confidence > 0.9 and anomaly < 0.3:
        return "AUTO_RECONCILED"
    if sla < 60 or anomaly > 0.7:
        return "EXCEPTION"
    return "OPS_REVIEW"

def generate_data():
    print(f"🏭 Generating {N} Tier-1 Bank Transactions...")
    data = []

    for i in range(N):
        amount = generate_amount()
        confidence = generate_reference_similarity()
        anomaly = generate_anomaly_score(amount)

        sla_remaining = random.randint(10, 480)  # minutes
        decision = decision_logic(confidence, anomaly, sla_remaining)

        override = 1 if random.random() < 0.08 else 0

        cost = 0
        if override:
            cost += 500
        if decision == "EXCEPTION":
            cost += 2000
        if decision == "AUTO_RECONCILED" and confidence < 0.6:
            cost += 10000  # false auto penalty

        txn_date = fake.date_time_this_year()
        settlement_delay = random.choice([0, 0, 1, 2, 3])

        data.append({
            "txn_id": f"TXN_{100000+i}",
            "source_system": random.choice(SOURCE_SYSTEMS),
            "amount": amount,
            "currency": "USD",
            "txn_date": txn_date,
            "settlement_delay": settlement_delay,
            "reference_similarity": confidence,
            "match_probability": confidence,
            "anomaly_score": anomaly,
            "sla_remaining": sla_remaining,
            "final_decision": decision,
            "override_flag": override,
            "decision_cost": cost
        })

    df = pd.DataFrame(data)
    
    # Ensure directory exists
    os.makedirs('data/training', exist_ok=True)
    output_path = "data/training/synthetic_bank_transactions.csv"
    
    df.to_csv(output_path, index=False)
    print("✅ Generated", len(df), "enterprise-grade banking records at", output_path)

if __name__ == "__main__":
    generate_data()
