from sqlalchemy.orm import Session
from app.core.rl_optimizer import DecisionOptimizer
from app.models.policy import RLPolicy
from app.models.transaction import Transaction
from app.models.user import AuditLog
import logging

logger = logging.getLogger(__name__)

class ShadowRunner:
    """
    Executes RL Policy in SHADOW mode (Observation only).
    Compares RL decision vs Actual System/Human decision.
    """
    def __init__(self, db: Session):
        self.db = db
        self.policy = self._get_shadow_policy()
        self.optimizer = DecisionOptimizer(self.policy) if self.policy else None

    def _get_shadow_policy(self):
        return self.db.query(RLPolicy).filter(RLPolicy.status == "SHADOW").first()

    def run_comparison(self, txn: Transaction, actual_action: str):
        """
        txn: The transaction being processed.
        actual_action: What the system/human actually did ('AUTO', 'REVIEW', 'REJECT')
        """
        if not self.optimizer:
            return

        # 1. Get RL Prediction
        prediction = self.optimizer.predict(txn)
        rl_action = prediction["action"]
        confidence = prediction.get("confidence", 0.0)

        # 2. Compare
        match = (rl_action == actual_action)
        
        # 3. Log Shadow Event (Internal Audit)
        # We store this in AuditLog with a special event type
        shadow_log = AuditLog(
            event_type="SHADOW_EVAL",
            actor_id=f"model:{self.policy.version}",
            resource=txn.id,
            outcome="MATCH" if match else "DEVIATION",
            risk_score=int(confidence * 100),
            # Store details in resource or a new field if available. 
            # For now, packing into string to avoid schema change, or use JSON if we added it.
            # Using 'resource' field format: "{txn_id} | RL:{rl_action} vs ACT:{actual_action}"
            resource=f"{txn.id} | RL:{rl_action} vs ACT:{actual_action}"
        )
        
        self.db.add(shadow_log)
        self.db.commit()
        
        if not match:
            logger.info(f"Shadow Deviation on {txn.id}: RL wanted {rl_action}, System did {actual_action}")
