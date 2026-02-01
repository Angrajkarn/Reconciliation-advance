import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

def generate_data(num_records=100):
    """
    Generates two datasets (Core Ledger & Payment Gateway) with controlled discrepancies.
    """
    np.random.seed(42)
    
    # Base Data
    base_ids = [f"TXN-{10000+i}" for i in range(num_records)]
    dates = [datetime(2023, 10, 1) + timedelta(days=random.randint(0, 5)) for _ in range(num_records)]
    amounts = np.round(np.random.uniform(10.0, 5000.0, size=num_records), 2)
    currencies = ['USD'] * num_records
    
    # Create Source A (Core Banking) - The "Truth"
    df_a = pd.DataFrame({
        'txn_ref_id': base_ids,
        'value_date': dates,
        'amount': amounts,
        'currency': currencies
    })
    
    # Create Source B (Gateway) - Derived from A with noise
    
    # 1. Exact Matches (First 60%)
    limit_exact = int(num_records * 0.6)
    df_b_exact = df_a.iloc[:limit_exact].copy()
    
    # 2. Tolerance Matches (Next 20%)
    # Add small amount noise (+- 0.01 to 0.04)
    # Add date noise (+- 1 day)
    limit_tol = int(num_records * 0.8)
    df_b_tol = df_a.iloc[limit_exact:limit_tol].copy()
    
    # Mutate amounts slightly (Round to ensure it doesn't accidentally hit exact)
    df_b_tol['amount'] = df_b_tol['amount'].apply(lambda x: x + random.choice([0.01, 0.02, -0.01, -0.02]))
    # Mutate dates
    df_b_tol['value_date'] = df_b_tol['value_date'].apply(lambda x: x + timedelta(days=1))
    
    # 3. Exceptions (Last 20%)
    df_b_exceptions = df_a.iloc[limit_tol:].copy()
    
    # 3a. Fuzzy ID Match (Level 1)
    # Take first 5 of exceptions and make them "Typos" of the original ID
    # e.g. TXN-12345 -> TXN12345 (Missing dash)
    fuzzy_idx = df_b_exceptions.index[:5]
    df_b_exceptions.loc[fuzzy_idx, 'txn_ref_id'] = df_b_exceptions.loc[fuzzy_idx, 'txn_ref_id'].str.replace('-', '')
    
    # 3b. High Value Outlier (Level 2 Risk + Level 3 Anomaly)
    # Make one record HUGE
    high_val_idx = df_b_exceptions.index[5:7]
    df_b_exceptions.loc[high_val_idx, 'amount'] = 1000000.00 # 1 Million
    
    # 3c. Amount Mismatch (> Tolerance)
    idx_amt = df_b_exceptions.index[7:10]
    df_b_exceptions.loc[idx_amt, 'amount'] = df_b_exceptions.loc[idx_amt, 'amount'] + 100.0
    
    # Assemble B
    df_b = pd.concat([df_b_exact, df_b_tol, df_b_exceptions])
    
    # Introduce "Missing in B"
    # Drop last 5 records from B matched set
    ids_to_drop = df_b_exceptions.iloc[-5:]['txn_ref_id'].values
    df_b = df_b[~df_b['txn_ref_id'].isin(ids_to_drop)]
    
    # Introduce "Missing in A" (Extra in B)
    # Create completely new records
    extra_b = pd.DataFrame({
        'txn_ref_id': [f"TXN-EXTRA-{i}" for i in range(5)],
        'value_date': [datetime(2023, 10, 5) for _ in range(5)],
        'amount': [500.0] * 5,
        'currency': ['USD'] * 5
    })
    df_b = pd.concat([df_b, extra_b])
    
    # Save Files
    output_dir = "data/input"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    df_a.to_csv(os.path.join(output_dir, "core_banking_ledger.csv"), index=False)
    df_b.to_csv(os.path.join(output_dir, "payment_gateway.csv"), index=False)
    
    print(f"Generated data in {output_dir}")
    print(f"Total A: {len(df_a)}")
    print(f"Total B: {len(df_b)}")

if __name__ == "__main__":
    generate_data()
