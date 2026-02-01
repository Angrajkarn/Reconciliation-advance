import logging
import pandas as pd
import yaml
from pathlib import Path
from src.audit import AuditLogger
from src.ingestion import DataLoader
from src.realtime import RealTimeEngine
from src.ml_models import MatchClassifier, AnomalyDetector
from src.features import FeatureEngineer
from src.stress_test import ScenarioRunner, CounterfactualEngine
from src.simulation import EventStreamSimulator

# Setup Logging (Console Only for Stress Test)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    run_id = "STRESS_TEST_" + pd.Timestamp.now().strftime("%Y%m%d%H%M%S")
    logger.info(f"Starting Stress Test Run: {run_id}")

    # 1. Load Config
    config_path = Path("config/settings.yaml")
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    # 2. Mock Audit (Silent)
    class MockAudit:
        def log_event(self, *args, **kwargs): pass
    audit = MockAudit()

    # 3. Load & Prepare Data (Training Reuse)
    data_loader = DataLoader(config)
    file_a = "data/input/core_banking_ledger.csv"
    file_b = "data/input/payment_gateway.csv"
    
    # Train Models (Quickly) on subset
    logger.info("Training Models for Simulation...")
    df_train_a = data_loader.load_file(file_a, "SOURCE_A").head(20)
    df_train_b = data_loader.load_file(file_b, "SOURCE_B").head(20)
    
    # Simple Training Logic (Copy from main.py simplified)
    train_features, train_labels = [], []
    fe = FeatureEngineer()
    for _, ra in df_train_a.iterrows():
        matches = df_train_b[df_train_b['txn_ref_id'] == ra['txn_ref_id']]
        for _, rb in matches.iterrows():
            train_features.append(fe.compute_features(ra.to_dict(), rb.to_dict()))
            train_labels.append(1)
            
    classifier = MatchClassifier()
    if train_features:
        classifier.train(pd.DataFrame(train_features), train_labels)
    anomaly = AnomalyDetector()

    # 4. Prepare Events for Simulation
    # We load ALL events into a list to replay them exactly
    sim = EventStreamSimulator(config, data_loader)
    events = list(sim.stream_events(file_a, file_b))
    logger.info(f"Loaded {len(events)} events for replay.")

    # 5. Define Scenarios
    runner = ScenarioRunner(config)
    scenarios = runner.get_scenarios()
    
    # 6. Run Counterfactual Analysis
    engine = CounterfactualEngine(RealTimeEngine, config, audit, (classifier, anomaly))
    results_df = engine.run_simulation(events, scenarios)
    
    # 7. Output Report
    output_file = f"data/output/stress_report_{run_id}.csv"
    results_df.to_csv(output_file, index=False)
    
    logger.info(f"Stress Test Complete. Report saved to: {output_file}")
    logger.info("\n--- Stability Summary ---")
    logger.info(results_df['Stability'].value_counts())

if __name__ == "__main__":
    main()
