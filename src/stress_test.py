import logging
import copy
import pandas as pd
from typing import Dict, List, Any
from src.realtime import RealTimeEngine

logger = logging.getLogger(__name__)

class ScenarioRunner:
    """
    Defines and executes stress scenarios.
    Modifies configuration or data to simulate extreme conditions.
    """
    def __init__(self, config: Dict):
        self.base_config = config

    def get_scenarios(self) -> Dict[str, Dict]:
        """
        Returns a dict of Scenario Name -> Modified Config/Rules.
        """
        scenarios = {}
        
        # Scenario 1: High Volatility (Tolerances Tightened, Amounts Perturbed)
        # We simulate this by returning a config override
        s1_config = copy.deepcopy(self.base_config)
        # Tighten tolerances (e.g. from 0.05 to 0.01)
        s1_config['reconciliation']['tolerances']['amount_threshold'] = 0.01 
        scenarios['HIGH_VOLATILITY_TIGHT_TOLERANCE'] = s1_config
        
        # Scenario 2: Ops Overload (Review Threshold Higher)
        # Force ML to be more confident to Auto-Match, creating more exceptions? 
        # Or Lower threshold to reduce queue? 
        # Typically under stress, we might auto-match MORE to reduce queue (Higher Risk)
        # OR we might be stricter. Let's simulate logic change.
        # This requires the Engine to accept config override dynamically.
        s2_config = copy.deepcopy(self.base_config)
        # We can't easily change the hardcoded class variables in HybridEngine without passing config.
        # Ensure HybridEngine uses config for thresholds.
        
        return scenarios

    def apply_data_stress(self, event: Dict, scenario_name: str) -> Dict:
        """
        Modifies input event data based on scenario.
        E.g., "Data Corruption" scenario.
        """
        stressed_event = copy.deepcopy(event)
        
        if scenario_name == 'DATA_NOISE':
            # Add random noise to amount
            if 'amount' in stressed_event:
                stressed_event['amount'] *= 1.0001 # Small drift
                
        return stressed_event

class CounterfactualEngine:
    """
    Runs A/B tests: Baseline vs Stress.
    Measures Decision Stability.
    """
    def __init__(self, real_time_engine_cls, base_config, audit_mock, models):
        self.rt_cls = real_time_engine_cls
        self.base_config = base_config
        self.audit_mock = audit_mock # We don't want to pollute real audit logs
        self.models = models # (classifier, anomaly)
        
    def run_simulation(self, events: List[Dict], scenarios: Dict[str, Dict]) -> pd.DataFrame:
        """
        Runs the stream through Baseline and all Scenarios.
        Returns a DataFrame comparing outcomes.
        """
        results = []
        
        # 1. Run Baseline
        logger.info("Running Baseline Simulation...")
        baseline_engine = self.rt_cls(self.base_config, self.audit_mock, *self.models)
        baseline_decisions = {} # Map EventID -> Status
        
        for event in events:
            baseline_engine.process_event(event)

        # Collect Baseline Outcomes
        # We need to look at matches.
        for m in baseline_engine.matches:
            baseline_decisions[m['txn_ref_id']] = m['status']
        # Unmatched?
        # For simplicity, we only track what got Matched in Baseline.
        
        # 2. Run Scenarios
        for s_name, s_config in scenarios.items():
            logger.info(f"Running Scenario: {s_name}...")
            
            # Re-init engine with stress config
            stress_engine = self.rt_cls(s_config, self.audit_mock, *self.models)
            
            for event in events:
                # Apply data stress if needed (Logic could be added here)
                stress_engine.process_event(event)
                
            # Compare
            for m in stress_engine.matches:
                txn_id = m['txn_ref_id']
                stress_status = m['status']
                base_status = baseline_decisions.get(txn_id, 'UNMATCHED')
                
                stability = 'STABLE' if base_status == stress_status else 'FLIPPED'
                
                results.append({
                    'Scenario': s_name,
                    'TransactionID': txn_id,
                    'Baseline_Decision': base_status,
                    'Stress_Decision': stress_status,
                    'Stability': stability,
                    'Score_Impact': m['score'] # We assume we want to see new score
                })
                
        return pd.DataFrame(results)
