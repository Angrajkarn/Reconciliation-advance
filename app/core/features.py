from app.models.transaction import Transaction
import numpy as np
from datetime import datetime

class StateBuilder:
    """
    Converts Transaction objects into Vectorized State for RL Agent.
    State Dimension: 5
    [
      0: Normalized Amount (0-1, clipped),
      1: Risk Score (0-1),
      2: Time Remaining to SLA (Normalized 0-1),
      3: Is Weeked (0/1),
      4: Hour of Day (Normalized 0-1)
    ]
    """
    
    def __init__(self):
        self.MAX_AMOUNT = 100000.0
        self.SLA_HOURS = 24.0

    def build(self, txn: Transaction) -> np.ndarray:
        # 1. Amount
        amt = min(txn.amount, self.MAX_AMOUNT) / self.MAX_AMOUNT
        
        # 2. Risk
        risk = txn.risk_score / 100.0 if txn.risk_score else 0.0
        
        # 3. SLA (Mock: Assumes 24h SLA from creation)
        elapsed = (datetime.utcnow() - txn.timestamp).total_seconds() / 3600.0
        sla_remaining = max(0, self.SLA_HOURS - elapsed) / self.SLA_HOURS
        
        # 4. Time Context
        is_weekend = 1.0 if txn.timestamp.weekday() >= 5 else 0.0
        hour = txn.timestamp.hour / 24.0
        
        return np.array([
            amt,
            risk,
            sla_remaining,
            is_weekend,
            hour
        ], dtype=np.float32)

    @property
    def observation_space_dim(self) -> int:
        return 5
