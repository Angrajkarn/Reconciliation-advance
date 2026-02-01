import os
import sys
# Add parent dir to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scripts.generate_enterprise_data import generate_enterprise_data

def generate_batch():
    OUTPUT_DIR = 'data/batch_input'
    NUM_FILES = 20
    RECORDS_PER_FILE = 100000 # 1 Lakh

    print(f"🚀 Starting Batch Generation: {NUM_FILES} files x {RECORDS_PER_FILE} records")
    
    for i in range(1, NUM_FILES + 1):
        filename = f"batch_data_{i:02d}.csv"
        path = os.path.join(OUTPUT_DIR, filename)
        generate_enterprise_data(
            num_records=RECORDS_PER_FILE, 
            stress_mode=True, 
            output_path=path
        )
        print(f" [{(i/NUM_FILES)*100:.0f}%] Completed {filename}")

    print("\n✅ BATCH GENERATION COMPLETE")

if __name__ == "__main__":
    generate_batch()
