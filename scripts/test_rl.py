from app.core.rl_optimizer import DecisionOptimizer
from app.models.policy import RLPolicy
from app.models.transaction import Transaction
from datetime import datetime
import uuid

def test_rl():
    print("Testing RL Engine...")
    
    # 1. Mock Policy
    policy = RLPolicy(
        id=str(uuid.uuid4()),
        version="vTest",
        reward_config={},
        constraints={}
    )
    
    # 2. Initialize Optimizer
    optimizer = DecisionOptimizer(policy)
    
    # 3. Mock Transaction
    txn = Transaction(
        id="TXN-TEST-1",
        amount=500.0,
        risk_score=20, # Low Risk
        timestamp=datetime.utcnow()
    )
    
    # 4. Predict
    result = optimizer.predict(txn)
    print(f"Scenario 1 (Low Risk): {result}")
    
    txn_high_risk = Transaction(
        id="TXN-MOCK-2",
        amount=1000000.0,
        risk_score=95, # High Risk
        timestamp=datetime.utcnow()
    )
    
    result_high = optimizer.predict(txn_high_risk)
    print(f"Scenario 2 (High Risk): {result_high}")

if __name__ == "__main__":
    test_rl()
