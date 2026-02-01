import pandas as pd
import numpy as np
import os
import joblib
from xgboost import XGBClassifier
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score

# Constants
DATA_PATH = 'data/training/enterprise_audit_log.csv'
ARTIFACT_DIR = 'app/ml/models'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def train_models():
    print("🚀 Starting Elite Bank ML Training Pipeline...")

    # 1. Load Data
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Data not found at {DATA_PATH}. Run scripts/generate_training_data.py first.")
    
    df = pd.read_csv(DATA_PATH)
    print(f"📊 Loaded {len(df)} records.")

    # 2. Features & Target
    # Defined in Strategy Step 2 ("Features")
    features = [
      "amount_diff",
      "date_diff",
      "reference_similarity",
      "historical_match_rate",
      # "frequency_score", # Not in synth data yet, omitted
      # "currency_match"   # Needs encoding, simplifying for V1
       "system_load"     # Added for realism
    ]
    target = "is_correct_match"

    X = df[features]
    y = df[target]

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # ==========================================
    # LAYER 1: SUPERVISED ML (Match Probability)
    # ==========================================
    print("\n🧠 Training Layer 1: XGBoost (Match Probability)...")
    
    # "Enterprise-safe" params (stable, not too deep)
    xgb = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        use_label_encoder=False,
        eval_metric='logloss'
    )
    
    xgb.fit(X_train, y_train)
    
    # Evaluate
    y_pred = xgb.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    print(f"✅ XGBoost Performance: Accuracy={acc:.4f}, Precision={prec:.4f}")
    
    # Save
    joblib.dump(xgb, os.path.join(ARTIFACT_DIR, 'match_probability_model.pkl'))

    # ==========================================
    # LAYER 2: ANOMALY DETECTION
    # ==========================================
    print("\n🕵️ Training Layer 2: Isolation Forest (Anomaly Detection)...")
    
    # "Detect unknown / rare patterns"
    iso = IsolationForest(
        contamination=0.02, # As per strategy
        random_state=42,
        n_estimators=100
    )
    
    iso.fit(X) # Unsupervised, can use full X or X_train
    
    # Test on a few known anomalies
    # (In synth data, anomalies have huge amount_diff)
    test_anoms = X_test[X_test['amount_diff'] > 500]
    if not test_anoms.empty:
        scores = iso.decision_function(test_anoms)
        print(f"ℹ️ Anomaly Scores for known outliers (lower is more anomalous): {scores[:5]}")
    
    # Save
    joblib.dump(iso, os.path.join(ARTIFACT_DIR, 'anomaly_detector.pkl'))
    
    print(f"\n💾 Models saved to {ARTIFACT_DIR}/")
    print("Training Pipeline Complete. Ready for Shadow Mode.")

if __name__ == "__main__":
    train_models()
