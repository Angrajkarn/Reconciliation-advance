import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

class AnomalyDetector:
    """
    Level 3: Unsupervised Machine Learning for Anomaly Detection.
    Uses Isolation Forest to detect transactions that deviate from the norm.
    """
    
    def __init__(self):
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.is_trained = False

    def train(self, df: pd.DataFrame):
        """
        Trains the model on 'normal' successful matches to learn the distribution.
        Features: Amount, Day of Year (seasonality simulation).
        """
        if df.empty:
            logger.warning("No data to train ML model.")
            return

        features = self._extract_features(df)
        if features.empty:
            return

        logger.info(f"Training Anomaly Detector on {len(features)} records...")
        self.model.fit(features)
        self.is_trained = True

    def predict_anomaly_score(self, df_exceptions: pd.DataFrame) -> List[float]:
        """
        Returns anomaly scores for exceptions.
        Lower score = More anomalous (standard IF), but we normalize to 0-1 (1=High Anomaly).
        """
        if not self.is_trained or df_exceptions.empty:
            return [0.0] * len(df_exceptions)

        features = self._extract_features(df_exceptions)
        
        # decision_function: average anomaly score. Lower is more abnormal.
        # Range is roughly -0.5 to 0.5.
        raw_scores = self.model.decision_function(features)
        
        # Normalize: We want 1.0 = Highly Anomalous (Negative raw score).
        # Linear transform: -0.5 -> 1.0, 0.5 -> 0.0
        # normalized = 0.5 - raw_score (clamped 0 to 1)
        
        normalized_scores = []
        for s in raw_scores:
            norm = min(max(0.5 - s, 0.0), 1.0) * 100 # Scale 0-100
            normalized_scores.append(round(norm, 2))
            
        return normalized_scores

    def _extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Prepares feature vector.
        """
        data = pd.DataFrame()
        
        # Feature 1: Log Amount (handle scale)
        # Handle cases where amount is missing or string
        # Assuming cleaned float data in 'amount' column (or amount_a, etc)
        
        # If 'amount' exists, use it. If not, try 'amount_a' or 'amount_b'
        if 'amount' in df.columns:
            amt = df['amount']
        elif 'amount_a' in df.columns:
            amt = df['amount_a'].fillna(0) + df['amount_b'].fillna(0) # Proxy
        else:
             # Fallback for exceptions that might only have 'amount' inferred
             # In our Engine, exceptions have 'amount_a' or 'amount_b'? 
             # Actually Engine output for matches has 'amount'. 
             # Exceptions might vary.
             # Let's standardize input before calling.
             return pd.DataFrame() # fail safe
             
        # Add small epsilon for log
        data['log_amount'] = np.log1p(amt.abs())
        
        return data[['log_amount']]

class MatchClassifier:
    """
    Level 7: Supervised Learning for Match Confidence.
    Predicts probability (0-1) that two transactions are a 'True Match'.
    """
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
        self.is_trained = False
        
    def train(self, X: pd.DataFrame, y: List[int]):
        """
        Trains the classifier.
        X: Feature DataFrame
        y: Labels (1=Match, 0=Non-Match)
        """
        if X.empty:
            logger.warning("No data to train Match Classifier.")
            return

        logger.info(f"Training Supervised Match Classifier on {len(X)} pairs...")
        self.model.fit(X, y)
        self.is_trained = True
        
    def predict_probability(self, features: List[float]) -> float:
        """
        Returns probability of class 1 (Match) for a single feature vector.
        """
        if not self.is_trained:
            # Fallback: Return 0.5 (Unsure) or heuristic? 
            # Better to return 0.0 to be safe/conservative if untrained.
            return 0.0
            
        # Reshape for single prediction
        vec = np.array(features).reshape(1, -1)
        prob = self.model.predict_proba(vec)[0][1] # Probability of Class 1
        return round(prob, 4)

