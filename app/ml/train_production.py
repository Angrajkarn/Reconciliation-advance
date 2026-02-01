import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report

# Constants
DATA_PATH = 'data/training/synthetic_bank_transactions.csv'
ARTIFACT_DIR = 'app/ml/models'
os.makedirs(ARTIFACT_DIR, exist_ok=True)

def train_production_model():
    print("🚀 Starting Production-Style Training (Gradient Boosting)...")
    
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Missing data: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    print(f"📊 Loaded {len(df)} records.")

    # Features (enterprise-relevant)
    X = df[
        [
            "amount",
            "reference_similarity",
            "anomaly_score",
            "sla_remaining",
            "settlement_delay"
        ]
    ]

    # Target (what ops finally decided)
    y = df["final_decision"]

    # Stratified Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Model: Gradient Boosting (Enterprise-Safe)
    print("🧠 Training GradientBoostingClassifier...")
    model = GradientBoostingClassifier(
        n_estimators=150,
        learning_rate=0.08,
        max_depth=4,
        random_state=42
    )

    model.fit(X_train, y_train)

    # Evaluation
    y_pred = model.predict(X_test)

    print("📊 MODEL PERFORMANCE REPORT")
    print("==================================================")
    print(classification_report(y_test, y_pred))
    print("==================================================")

    # Save Artifact
    model_path = os.path.join(ARTIFACT_DIR, 'gradient_boosting_v1.pkl')
    joblib.dump(model, model_path)
    print(f"✅ Model saved to {model_path}")
    
    # Save Feature Names for Inference
    joblib.dump(list(X.columns), os.path.join(ARTIFACT_DIR, 'model_features.pkl'))

if __name__ == "__main__":
    train_production_model()
