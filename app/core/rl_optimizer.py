import numpy as np
import os
from typing import List, Optional
from app.models.transaction import Transaction
from app.models.policy import RLPolicy
from app.core.features import StateBuilder

# Try importing StableBaselines3, fallback if missing (for dev environment safety)
try:
    from stable_baselines3 import PPO
    from stable_baselines3.common.env_util import make_vec_env
    from gymnasium import Env, spaces
    SB3_AVAILABLE = True
except ImportError:
    SB3_AVAILABLE = False
    print("⚠️ StableBaselines3 not found. RL Optimizer running in Mock Mode.")

class DecisionOptimizer:
    """
    Offline RL Engine for Transaction Reconciliation.
    """
    def __init__(self, policy: RLPolicy):
        self.policy_id = policy.id
        self.version = policy.version
        self.state_builder = StateBuilder()
        self.model = None
        self.model_path = f"models/{policy.version}.zip"
        
        # Action Space: 0=AUTO_RECONCILE, 1=OPS_REVIEW
        self.actions = ["AUTO", "REVIEW"]

    def predict(self, txn: Transaction) -> dict:
        """
        Returns recommended action and confidence.
        """
        # Feature Vector
        obs = self.state_builder.build(txn)
        
        if not SB3_AVAILABLE or not os.path.exists(self.model_path):
            # Fallback / Mock Behavior
            # If Risk > 80 -> REVIEW, else AUTO (Simple Heuristic)
            action_idx = 1 if txn.risk_score > 80 else 0
            return {
                "action": self.actions[action_idx],
                "confidence": 0.85 + (np.random.rand() * 0.1), # Pseudo-conf
                "source": f"MockRL-{self.version}"
            }
        
        if not self.model:
            self.load()
            
        action_idx, _ = self.model.predict(obs, deterministic=True)
        return {
            "action": self.actions[int(action_idx)],
            "confidence": 0.92, # Placeholder, PPO doesn't give innate probability easily without value func
            "source": f"PPO-{self.version}"
        }

    def train(self, training_data: List[dict]):
        """
        Train PPO on historical logs.
        training_data: List of {transaction, true_action, outcome}
        """
        if not SB3_AVAILABLE:
            print("Skipping training: SB3 missing.")
            return

        # TODO: Wrap data in CustomEnv(Env)
        # env = DummyVecEnv([lambda: ReplayEnv(training_data)])
        # self.model = PPO("MlpPolicy", env, verbose=1)
        # self.model.learn(total_timesteps=10000)
        # self.save()
        pass

    def load(self):
        if SB3_AVAILABLE and os.path.exists(self.model_path):
            self.model = PPO.load(self.model_path)
            
    def save(self):
        if self.model:
            os.makedirs("models", exist_ok=True)
            self.model.save(self.model_path)
