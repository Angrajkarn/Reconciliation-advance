import yaml
import argparse
import uuid
import logging
import sys
import os
import pandas as pd

# Ensure src is in path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from src.ingestion import DataLoader
from src.engine import ReconciliationEngine
from src.audit import AuditLogger
from src.reporting import ReportGenerator

# Setup Console Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(camera)s[%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def load_config(config_path: str):
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def main():
    parser = argparse.ArgumentParser(description="Enterprise Reconciliation Platform")
    parser.add_argument('--config', default='config/settings.yaml', help='Path to config file')
    args = parser.parse_args()

    # 1. Initialize Run
    run_id = str(uuid.uuid4())
    config = load_config(args.config)
    
    audit = AuditLogger(config['paths']['logs_dir'])
    audit.log_event(run_id, "SYSTEM", "STARTUP", "Reconciliation run started")
    
    try:
        data_loader = DataLoader(config)
        engine = ReconciliationEngine(config)
        reporter = ReportGenerator(config['paths']['output_dir'])
        
        # 2. Ingest & Stream (Level 4: Event Simulation)
        audit.log_event(run_id, "INGESTION", "START", "Initializing Event Stream")
        
        # Assuming fixed filenames for this demo, or could scan dir
        input_dir = os.path.abspath(config['paths']['input_dir'])
        file_a = os.path.join(input_dir, "core_banking_ledger.csv")
        file_b = os.path.join(input_dir, "payment_gateway.csv")
        
        from src.realtime import RealTimeEngine
        from src.simulation import EventStreamSimulator
        from src.ml_models import MatchClassifier, AnomalyDetector
        from src.features import FeatureEngineer
        
        # --- ML Training Phase (Simulated) ---
        # In a real system, we load a pre-trained model. Here we train on the fly using a "Training Set".
        # We'll use the first 20 records of the input files as "Known History" for training.
        audit.log_event(run_id, "ML_TRAINING", "START", "Training Supervised Models")
        
        # Load data for training
        df_train_a = data_loader.load_file(file_a, "SOURCE_A").head(50)
        df_train_b = data_loader.load_file(file_b, "SOURCE_B").head(50)
        
        # Create synthetic positive/negative pairs for training
        # Positives: Exact matches (assuming row i matches row i for this synthetic data, or just exact amounts)
        # Negatives: Random pairs
        train_features = []
        train_labels = []
        fe = FeatureEngineer()
        
        # Positives (Naive assumption for this demo data that it is aligned, or use exact logic)
        # Actually, let's just find exact matches to use as positives
        exact_pairs = []
        for _, ra in df_train_a.iterrows():
            # Find matching b by id
            matches = df_train_b[df_train_b['txn_ref_id'] == ra['txn_ref_id']]
            for _, rb in matches.iterrows():
                exact_pairs.append((ra.to_dict(), rb.to_dict()))
                
        # Generate Features for Positives
        for a, b in exact_pairs:
            train_features.append(fe.compute_features(a, b))
            train_labels.append(1) # Match
            
        # Generate Negatives (Mismatch)
        # Mix simple mismatches
        import random
        for _ in range(len(exact_pairs)):
            a = df_train_a.sample(1).iloc[0].to_dict()
            b = df_train_b.sample(1).iloc[0].to_dict()
            if a['txn_ref_id'] != b['txn_ref_id']:
                train_features.append(fe.compute_features(a, b))
                train_labels.append(0) # No Match
        
        # Train Classifier
        classifier = MatchClassifier()
        if train_features:
            classifier.train(pd.DataFrame(train_features), train_labels)
            
        # Train Anomaly Detector (Unsupervised on valid matches)
        # We use the 'positives' features for this
        anomaly_detector = AnomalyDetector()
        if train_features:
             # Convert list of lists to DF
             # We need features expected by AnomalyDetector (currently just 'log_amount' in previous impl, 
             # but let's check ml_models.py AnomalyDetector logic.
             # It expects a DataFrame with 'amount' column to extract features.
             # So we pass the raw DataFrame of matches.
             # We can construct a DF from the matching pairs.
             matched_df = pd.DataFrame([p[0] for p in exact_pairs])
             anomaly_detector.train(matched_df)

        audit.log_event(run_id, "ML_TRAINING", "COMPLETE", "Models Trained Successfully")

        # --- Real-Time Execution ---
        
        stream_sim = EventStreamSimulator(config, data_loader)
        rt_engine = RealTimeEngine(config, audit, classifier, anomaly_detector)
        
        # 3. Process Stream (Event by Event)
        audit.log_event(run_id, "ENGINE", "START", "Starting Real-Time Event Stream")
        
        event_count = 0
        for event in stream_sim.stream_events(file_a, file_b):
            event_count += 1
            if event_count % 50 == 0:
                logger.info(f"Processed {event_count} events...")
            
            rt_engine.process_event(event)

        audit.log_event(run_id, "ENGINE", "COMPLETE", f"Stream Finished. Total Events: {event_count}")
        
        # 4. Generate Reports (Snapshot of Final State)
        matches_df = pd.DataFrame(rt_engine.matches)
        
        # Get pending items as exceptions
        exceptions_list = rt_engine.get_pending_as_exceptions()
        exceptions_df = pd.DataFrame(exceptions_list)
        
        audit.log_event(run_id, "REPORTING", "START", "Generating outputs")
        reporter.save_reports(run_id, matches_df, exceptions_df)
        
        # 5. Finish
        audit.log_event(run_id, "SYSTEM", "SHUTDOWN", "Run completed successfully")
        logger.info(f"Run {run_id} completed successfully.")
        
    except Exception as e:
        logger.error(f"Run failed: {e}")
        audit.log_event(run_id, "SYSTEM", "ERROR", str(e))
        sys.exit(1)

if __name__ == "__main__":
    main()
