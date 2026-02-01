import joblib
import os
import pandas as pd
import numpy as np

# Load models once (Singleton pattern in a real app)
ARTIFACT_DIR = 'app/ml/models'
try:
    xgb_model = joblib.load(os.path.join(ARTIFACT_DIR, 'match_probability_model.pkl'))
    iso_model = joblib.load(os.path.join(ARTIFACT_DIR, 'anomaly_detector.pkl'))
except Exception as e:
    print(f"⚠️ Models not loaded: {e}. Scoring will fallback to rules.")
    xgb_model = None
    iso_model = None

def calculate_risk_score(features: dict) -> float:
    """
    Step 3: Risk Score (Business Layer)
    Combines ML probabilities with Anomaly Detection and Business Rules.
    
    Formula:
    risk_score = (
      w1 * (1 - match_probability) +
      w2 * scaled_anomaly_score +
      w3 * sla_pressure +
      w4 * amount_weight
    )
    """
    
    # 1. Get Model Predictions
    if xgb_model and iso_model:
        # Prepare vector
        df = pd.DataFrame([features])
        input_cols = [
            "amount_diff", "date_diff", "reference_similarity", 
            "historical_match_rate", "system_load"
        ]
        X = df[input_cols]
        
        # P(match)
        match_prob = xgb_model.predict_proba(X)[0][1]
        
        # Anomaly Score (Isolation Forest returns score, lower is more anomalous)
        # We need to invert/scale it to 0-1 range where 1 is highly anomalous
        # Typical decision_function output is roughly -0.5 to 0.5
        raw_anomaly = iso_model.decision_function(X)[0]
        # Heuristic scaling: IF score < 0 is outlier. 
        # Map: -0.2 -> 1.0 (High Risk), 0.2 -> 0.0 (Low Risk)
        anomaly_factor = 1 if raw_anomaly < -0.1 else 0
        if raw_anomaly > 0: anomaly_factor = 0
            
    else:
        # Fallback
        match_prob = 0.5
        anomaly_factor = 0.5

    # 2. Apply Weights (Configurable/Versioned)
    w1, w2, w3, w4 = 40, 30, 10, 20
    
    # SLA Factor (if SLA remaining < 2 hours, higher risk of breach)
    sla_pressure = 1 if features.get('sla_remaining', 24) < 2 else 0
    
    # Amount Factor (Higher amount = higher risk, log scale)
    amt = features.get('amount', 0)
    amount_weight = 1 if amt > 100000 else (amt / 100000)

    # 3. Calculate Final Score (0-100)
    # Risk increases as Match Probability decreases
    prob_risk = (1.0 - match_prob) 
    
    risk_score = (
        w1 * prob_risk +
        w2 * anomaly_factor +
        w3 * sla_pressure +
        w4 * amount_weight
    )
    
    return min(100.0, max(0.0, risk_score))

if __name__ == "__main__":
    # Quick Test
    sample = {
        "amount_diff": 0.0,
        "date_diff": 0,
        "reference_similarity": 1.0,
        "historical_match_rate": 0.98,
        "system_load": 0.5,
        "sla_remaining": 10,
        "amount": 5000.0
    }
    print(f"Risk Score (Perfect Match): {calculate_risk_score(sample):.2f}")
    
    sample_bad = {
        "amount_diff": 500.0,
        "date_diff": 5,
        "reference_similarity": 0.2,
        "historical_match_rate": 0.1,
        "system_load": 0.9,
        "sla_remaining": 1,
        "amount": 150000.0
    }
    print(f"Risk Score (Bad scenario): {calculate_risk_score(sample_bad):.2f}")
