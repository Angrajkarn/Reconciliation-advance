class RewardCalculator:
    """
    Calculates Reward based on Agent Action vs Ground Truth (Human/Rule).
    """
    def __init__(self, config: dict):
        self.success_reward = config.get("success_reward", 1.0)
        self.error_penalty = config.get("error_penalty", -1.0)
        self.critical_penalty = config.get("manual_override_penalty", -10.0)
        self.sla_penalty = config.get("sla_penalty", -0.5)

    def calculate(self, agent_action: str, true_action: str, outcome: str) -> float:
        """
        agent_action: 'AUTO', 'REVIEW'
        true_action: 'AUTO', 'REVIEW' (Historical)
        outcome: 'SUCCESS', 'REJECTED' (Final State)
        """
        
        # 1. Perfect Match
        if agent_action == true_action:
            return self.success_reward
            
        # 2. Conservative Error (Agent: REVIEW, Truth: AUTO)
        # Ops cost, but safe.
        if agent_action == 'REVIEW' and true_action == 'AUTO':
            return self.error_penalty # Moderate penalty for wasting ops time
            
        # 3. Critical Error (Agent: AUTO, Truth: REVIEW/REJECT)
        # Dangerous! Agent auto-approved something human flagged.
        if agent_action == 'AUTO' and true_action != 'AUTO':
            return self.critical_penalty
            
        return 0.0
