import pandas as pd
import numpy as np
import uuid
import random
from datetime import datetime, timedelta

def generate_golden_dataset(num_records=15000):
    """
    Generates a high-quality synthetic dataset mimicking bank reconciliation logs.
    Follows the structure needed for the 'Elite Bank' strategy.
    """
    print(f"Generating {num_records} training records...")
    
    data = []
    
    for _ in range(num_records):
        # Base transaction properties
        txn_id = str(uuid.uuid4())
        amount = round(random.uniform(10.0, 1000000.0), 2)
        currency = random.choice(['USD', 'EUR', 'GBP', 'JPY'])
        
        # Scenario Generation
        # 70% Perfect Match, 20% Minor Mismatch (Date/Ref), 8% Major Mismatch (Exception), 2% Fraud/Anomaly
        scenario = np.random.choice(['PERFECT', 'MINOR_DIFF', 'EXCEPTION', 'ANOMALY'], p=[0.70, 0.20, 0.08, 0.02])
        
        # Feature Engineering based on scenario
        if scenario == 'PERFECT':
            amount_diff = 0.0
            date_diff = 0  # days
            ref_similarity = 1.0
            hist_match_rate = random.uniform(0.9, 1.0)
            system_load = random.uniform(0.1, 0.6)
            final_decision = 'AUTO_MATCH'
            human_override = 0
            
        elif scenario == 'MINOR_DIFF':
            amount_diff = 0.0 # Amount matches
            date_diff = random.choice([1, 2, 3]) # Date slightly off
            ref_similarity = random.uniform(0.8, 0.95)
            hist_match_rate = random.uniform(0.7, 0.9)
            system_load = random.uniform(0.4, 0.8)
            # Usually matched by rules, or ops confirmed
            final_decision = 'AUTO_MATCH' 
            human_override = 0
            
        elif scenario == 'EXCEPTION':
            # Could be amount mismatch or completely wrong ref
            amount_diff = random.uniform(0.01, 50.0)
            date_diff = random.randint(5, 30)
            ref_similarity = random.uniform(0.3, 0.6)
            hist_match_rate = random.uniform(0.2, 0.6)
            system_load = random.uniform(0.6, 0.9)
            final_decision = 'EXCEPTION'
            # 30% chance human overrode it to match (forced match)
            human_override = 1 if random.random() < 0.3 else 0
            
        elif scenario == 'ANOMALY':
            # Rare patterns
            amount_diff = random.uniform(1000.0, 50000.0)
            date_diff = random.randint(0, 365)
            ref_similarity = random.uniform(0.0, 0.2)
            hist_match_rate = random.uniform(0.0, 0.1)
            system_load = random.uniform(0.8, 1.0) # stress condition
            final_decision = 'EXCEPTION'
            human_override = 0

        # Construct Row
        row = {
            "txn_id": txn_id,
            "amount": amount,
            "currency": currency,
            "amount_diff": amount_diff,
            "date_diff": date_diff,
            "reference_similarity": ref_similarity,
            "historical_match_rate": hist_match_rate,
            "system_load": system_load,
            "sla_remaining": random.randint(4, 48), # hours
            "final_decision": final_decision,
            "human_override": human_override,
            # Target for Supervised Learning: 1 if Matched (Auto or Manual), 0 if Exception/Unmatched
            "is_correct_match": 1 if final_decision == 'AUTO_MATCH' or human_override == 1 else 0
        }
        data.append(row)

    df = pd.DataFrame(data)
    
    # Save to disk
    import os
    os.makedirs('data/training', exist_ok=True)
    output_path = 'data/training/historical_recon_logs.csv'
    df.to_csv(output_path, index=False)
    print(f"✅ Golden Dataset saved to {output_path}")
    print(df['final_decision'].value_counts())

if __name__ == "__main__":
    generate_golden_dataset()
