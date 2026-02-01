import logging
import numpy as np
from typing import Dict, List, Any
from src.ml_models import MatchClassifier

logger = logging.getLogger(__name__)

class CostOptimizer:
    """
    Optimizes decision thresholds based on Business Cost.
    Expected Cost = P(FalsePositive) * OpsCost + P(FalseNegative) * RegulatoryRisk
    """
    def __init__(self, config: Dict):
        # Heuristic costs (could be in config)
        self.ops_cost_per_review = 25.0  # Cost to manually review a False Positive
        self.reg_risk_per_miss = 500.0   # Penalty/Risk for missing a true match (False Negative)
        
        # Default threshold
        self.optimal_threshold = 0.90

    def optimize_threshold(self, classifier: MatchClassifier, validation_data: List[Dict]):
        """
        Dynamically adjusts threshold to minimize total expected cost.
        (Simplified simulation for this demo)
        """
        # In a real system, we'd sweep thresholds [0.5 ... 0.99] against a validation set
        # and calculate Total Cost.
        
        # For simulation, we'll just set a cost-aware threshold.
        # If RegRisk is high, we lower threshold to catch more matches (reduce FN), 
        # BUT we must balance matches being correct. 
        # Actually, False Negative in Reconciliation means "Unmatched Item" (Exception).
        # A False Positive Match means "Incorrectly Matched".
        
        # FP Cost = Incorrect Match (HUGE Risk actually, data corruption). Let's swap costs.
        # FP (Wrong Match) = $1000 (Account Balance Wrong)
        # FN (Missed Match) = $25 (Just an exception to review).
        
        # Refined Logic:
        # We want to be very confident to avoid FP.
        # Expected Loss = (1 - Prob) * FP_Cost
        # We auto-match if Expected Loss < Ops_Review_Benefit? 
        
        # Let's say we set dynamic threshold such that (1-P)*1000 < 10 (Acceptable risk)
        # 1-P < 0.01 => P > 0.99.
        
        # Let's define:
        self.fp_penalty = 1000.0
        self.fn_penalty = 20.0 # Just operational toil
        
        # Logic: We auto-reconcile if P(Match) is high enough that Risk < CostOfReview
        # Risk = (1 - p) * FP_Penalty
        # CostOfReview = 20
        # (1-p)*1000 < 20 => 1-p < 0.02 => p > 0.98
        
        self.optimal_threshold = 1.0 - (self.fn_penalty / self.fp_penalty)
        logger.info(f"CostOptimizer: Recalculated Optimal Auto-Match Threshold: {self.optimal_threshold:.4f}")
        return self.optimal_threshold

class DriftMonitor:
    """
    Monitors data distribution for drift (PSI/KS).
    """
    def __init__(self):
        self.baseline_amounts = []
        self.current_window = []
        self.window_size = 50
    
    def update(self, amount: float):
        self.current_window.append(amount)
        if len(self.current_window) >= self.window_size:
            drift = self._check_drift()
            if drift:
                logger.warning(f"DriftMonitor: ALERT! Significant shift in Transaction Amounts detected.")
            
            # Rolling window
            self.baseline_amounts.extend(self.current_window) # Update baseline slowly?
            # Ideally baseline is static "Training Data", but let's just keep last N
            if len(self.baseline_amounts) > 1000:
                self.baseline_amounts = self.baseline_amounts[-1000:]
            self.current_window = []

    def _check_drift(self) -> bool:
        if not self.baseline_amounts:
            return False
            
        # Simple Mean Shift check (Proxy for PSI)
        base_mean = np.mean(self.baseline_amounts)
        curr_mean = np.mean(self.current_window)
        
        # If mean shifts by > 20%
        if base_mean > 0 and abs(curr_mean - base_mean) / base_mean > 0.20:
            return True
        return False

class ActiveLearner:
    """
    Simulates Feedback Loop.
    Captures 'Ops Reviews' and prepares them for retraining.
    """
    def __init__(self):
        self.feedback_buffer = []

    def submit_feedback(self, event_pair: Dict, human_decision: str):
        """
        Human reviews a 'Review Required' item and marks it MATCH or NO_MATCH.
        """
        label = 1 if human_decision == 'MATCH' else 0
        self.feedback_buffer.append((event_pair, label))
        
        if len(self.feedback_buffer) >= 10:
            logger.info("ActiveLearner: Feedback threshold reached. Triggering Model Retraining via MLOps Pipeline...")
            self.feedback_buffer = [] # Flush
