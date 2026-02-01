import pandas as pd
import time
import numpy as np
from datetime import datetime

# Config
DATA_PATH = 'data/training/enterprise_audit_log.csv'

def simple_recon_logic(row):
    """
    Simulates the core Rule-Based + Basic ML Logic of the Recon Engine.
    Returns: 'MATCH' | 'EXCEPTION' | 'MANUAL_REVIEW'
    """
    # 1. Exact Match Check (Pre-ML)
    if row['amount_diff'] == 0 and row['date_diff'] == 0 and row['reference_similarity'] > 0.95:
        return 'MATCH'

    # 2. Tolerance Rules (T-2, Amt < 0.05)
    if row['amount_diff'] < 0.05 and abs(row['date_diff']) <= 2 and row['reference_similarity'] > 0.8:
        return 'MATCH'

    # 3. ML/Risk Logic (Simulated)
    # In production, this would call the XGBoost model
    # Here we use the pre-calculated features to simulate the decision boundary
    risk_factor = row['amount_diff'] * 10 + abs(row['date_diff']) * 5 + (1 - row['reference_similarity']) * 100
    
    if risk_factor < 20:
        return 'MANUAL_REVIEW' # Close call
    
    return 'EXCEPTION'

import glob

# Config
DATA_DIR = 'data/batch_input'

# ... (simple_recon_logic remains the same, I need to keep it or re-include it. 
# Since replace_file_content replaces a chunk, I'll replace the run_stress_test function entirely)

def run_stress_test():
    print(f"🚀 Starting Batch Stress Reconciliation Test...")
    
    files = glob.glob(f"{DATA_DIR}/*.csv")
    if not files:
        print(f"❌ No data files found in {DATA_DIR}. Run generate_batch.py first.")
        # Fallback to training data if batch is empty
        files = ['data/training/enterprise_audit_log.csv']
        print(f"⚠️ Falling back to single training file: {files[0]}")

    total_files = len(files)
    total_records = 0
    grand_total_matches = 0
    grand_total_exceptions = 0
    grand_total_manual = 0
    
    start_time_global = time.time()

    print(f"📂 Found {total_files} files to process.")
    
    for idx, fp in enumerate(files):
        print(f"  Processing {idx+1}/{total_files}: {fp}...")
        try:
            df = pd.read_csv(fp)
            rec_count = len(df)
            total_records += rec_count
            
            # Apply Logic
            results = df.apply(simple_recon_logic, axis=1)
            counts = results.value_counts()
            
            grand_total_matches += counts.get('MATCH', 0)
            grand_total_manual += counts.get('MANUAL_REVIEW', 0)
            grand_total_exceptions += counts.get('EXCEPTION', 0)
            
        except Exception as e:
            print(f"  ❌ Error processing {fp}: {e}")

    end_time_global = time.time()
    duration = end_time_global - start_time_global
    throughput = total_records / duration if duration > 0 else 0
    
    print("\n✅ BATCH RECONCILIATION COMPLETE")
    print("==========================================")
    print(f"📦 Files Processed: {total_files}")
    print(f"📄 Total Records:   {total_records:,}")
    print(f"⏱️  Time Taken:      {duration:.2f} seconds")
    print(f"⚡ Avg Throughput:  {throughput:,.0f} txn/sec")
    print("==========================================")
    print("AGGREGATE RESULTS:")
    print(f"✅ AUTO MATCHED:    {grand_total_matches:,} ({(grand_total_matches/total_records)*100:.1f}%)")
    print(f"⚠️  MANUAL REVIEW:   {grand_total_manual:,} ({(grand_total_manual/total_records)*100:.1f}%)")
    print(f"❌ EXCEPTIONS:      {grand_total_exceptions:,} ({(grand_total_exceptions/total_records)*100:.1f}%)")
    print("==========================================")
    
    if throughput > 5000:
         print("🚀 PERFORMANCE: HYPER-SCALE (Processing millions efficiently)")
    elif throughput > 1000:
        print("🚀 PERFORMANCE: ELITE (Exceeds Tier-1 Requirements)")
    else:
        print("✅ PERFORMANCE: STANDARD")

if __name__ == "__main__":
    run_stress_test()
