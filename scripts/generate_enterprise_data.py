import pandas as pd
import numpy as np
import uuid
import random
from datetime import datetime, timedelta

# ==========================================
# 1. CONSTANTS & CONFIG
# ==========================================
SYSTEMS = {
    "SOURCE_A": {"late_prob": 0.15, "error_rate": 0.01}, # Legacy system
    "SOURCE_B": {"late_prob": 0.05, "error_rate": 0.005}, # Modern API
    "SWIFT_MT": {"late_prob": 0.30, "error_rate": 0.05}, # International
    "FX_DESK":  {"late_prob": 0.10, "error_rate": 0.08}  # Volatile
}

COUNTERPARTIES = ["AMAZON_EU", "TESLA_CORP", "ALPHABET_INC", "JP_MORGAN_INTERNAL", "EXT_VENDOR_73"]

# ==========================================
# 2. CORE GENERATORS
# ==========================================
def generate_amount():
    """ Log-normal distribution: 80% < 10k, long tail. """
    return round(np.random.lognormal(mean=7, sigma=1.2), 2)

def settlement_date(txn_date, system):
    """ T+0 to T+3 lag based on system profile. """
    base_probs = [70, 20, 8, 2] # 0, 1, 2, 3 days
    
    # Adjust for system latency
    if SYSTEMS[system]["late_prob"] > 0.2:
         base_probs = [50, 30, 15, 5]
         
    delay = random.choices([0, 1, 2, 3], weights=base_probs)[0]
    return txn_date + timedelta(days=delay)

def generate_reference(counterparty):
    """ Realistic reference patterns. """
    templates = [
        f"INV_{random.randint(10000,99999)}",
        f"PAYMENT {counterparty}",
        f"REF-{uuid.uuid4().hex[:8].upper()}",
        f"FX SETT {random.randint(100,999)} SPOT"
    ]
    return random.choice(templates)

def ops_decision_logic(confidence, amount, sla_remaining, known_counterparty):
    """
    Simulates human operations logic.
    High amount + low confidence -> Review.
    SLA breach risk -> Escalate.
    """
    if confidence > 0.9 and amount < 50000:
        return "AUTO_RECONCILED"
    if sla_remaining < 60: # minutes
        return "ESCALATED"
    if known_counterparty and confidence > 0.8:
        return "AUTO_RECONCILED"
    return "OPS_REVIEW"

def calculate_cost(decision, override, sla_breach):
    cost = 0
    if override: cost += 500         # Man-hour cost
    if sla_breach: cost += 2000      # Regulatory fine risk
    if decision == "FALSE_AUTO": cost += 10000 # Bad match liability
    return cost

# ==========================================
# 3. MAIN GENERATOR
# ==========================================
def generate_enterprise_data(num_records=20000, stress_mode=False, output_path='data/training/enterprise_audit_log.csv'):
    print(f"🏭 Generating Enterprise Data (Stress Mode: {stress_mode}) -> {output_path}...")
    data = []
    
    start_date = datetime.now() - timedelta(days=90)
    
    for _ in range(num_records):
        # ... (rest of loop is fine, but I need to make sure indentation is correct if I changing the def line)
        # Actually I can just change the def and the save lines.
        pass # The loop content is not being replaced here, wait.

    # I need to be careful with replace_file_content on the function signature if I don't show the whole body.
    # The tool requires StartLine and EndLine.
    # Let me just replace the signature and the saving part.

    
    start_date = datetime.now() - timedelta(days=90)
    
    for _ in range(num_records):
        # 1. Basic Transaction Attributes
        sys_name = random.choice(list(SYSTEMS.keys()))
        cpty = random.choice(COUNTERPARTIES)
        
        txn_id = str(uuid.uuid4())
        amount = generate_amount()
        if stress_mode and random.random() < 0.1: amount *= 1.5 # Volatility
        
        txn_date = start_date + timedelta(minutes=random.randint(0, 90*24*60))
        settle_date = settlement_date(txn_date, sys_name)
        
        # 2. Scenario Generation (Correlation Logic)
        # Determine "True State" of the match to derive features
        scenario = np.random.choice(['MATCH', 'EXCEPTION', 'ANOMALY'], p=[0.85, 0.13, 0.02])
        
        if scenario == 'MATCH':
            amt_diff = 0.0
            date_diff = (settle_date - txn_date).days
            ref_sim = random.uniform(0.9, 1.0)
            hist_rate = random.uniform(0.8, 1.0)
            status = "COMPLETED"
        elif scenario == 'EXCEPTION':
            amt_diff = random.uniform(0.01, 100.0)
            date_diff = random.randint(2, 10)
            ref_sim = random.uniform(0.4, 0.7)
            hist_rate = random.uniform(0.2, 0.6)
            status = "EXCEPTION"
        else: # ANOMALY
            amt_diff = random.uniform(1000, 50000)
            ref_sim = 0.1
            hist_rate = 0.05
            date_diff = 30
            status = "INVESTIGATION"

        # 3. Simulate ML Confidence (for Ops Logic)
        ml_confidence = 0.95 if scenario == 'MATCH' else random.uniform(0.1, 0.6)
        
        # 4. Ops & Human Behavior
        sla_deadline = txn_date + timedelta(hours=24)
        sla_remaining_mins = (sla_deadline - (txn_date + timedelta(hours=random.randint(1, 23)))).seconds / 60
        
        ops_outcome = ops_decision_logic(ml_confidence, amount, sla_remaining_mins, cpty in ["AMAZON_EU", "JP_MORGAN_INTERNAL"])
        
        # Human Override (8% chance)
        override_flag = 0
        if ops_outcome == "OPS_REVIEW":
            # 8% chance human overrides system suggestion
            override_flag = np.random.choice([0, 1], p=[0.92, 0.08])
            if override_flag:
                final_decision = "MANUAL_MATCH" if scenario == 'MATCH' else "FORCED_MATCH"
            else:
                final_decision = ops_outcome
        else:
            final_decision = ops_outcome

        # 5. Costing
        # Did we actually breach?
        is_sla_breach = sla_remaining_mins < 0
        cost = calculate_cost(final_decision, override_flag == 1, is_sla_breach)
        
        # 6. Construct Row (JP Schema + ML Features)
        row = {
            # --- Enterprise Schema (Non-Negotiable) ---
            "txn_id": txn_id,
            "source_system": sys_name,
            "target_system": "INTERNAL_LEDGER",
            "account_id": f"ACC_{random.randint(1000,9999)}",
            "counterparty_id": cpty,
            "txn_type": "WIRE" if amount > 10000 else "ACH",
            "amount": amount,
            "currency": "USD",
            "txn_date": txn_date.isoformat(),
            "settlement_date": settle_date.isoformat(),
            "reference_text": generate_reference(cpty),
            "status": status,
            "sla_deadline": sla_deadline.isoformat(),
            "ops_outcome": ops_outcome,
            "final_decision": final_decision,
            "override_flag": override_flag,
            "decision_cost": cost,
            
            # --- ML Training Features (Needed for Model) ---
            "amount_diff": amt_diff,
            "date_diff": date_diff,
            "reference_similarity": ref_sim,
            "historical_match_rate": hist_rate,
            "system_load":  random.uniform(0.2, 0.9) + (0.3 if stress_mode else 0),
            "sla_remaining": sla_remaining_mins / 60, # hours for model
            "is_correct_match": 1 if scenario == 'MATCH' or override_flag else 0
        }
        data.append(row)

    df = pd.DataFrame(data)
    
    import os
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"✅ Enterprise Data Generated: {len(df)} records at {output_path}")
    print("Sample Cost Distribution:")
    print(df['decision_cost'].describe())

if __name__ == "__main__":
    generate_enterprise_data(100000, stress_mode=True)
