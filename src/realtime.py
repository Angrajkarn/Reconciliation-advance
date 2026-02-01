import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from rapidfuzz import fuzz
from src.exceptions import ExceptionCode, Severity
from src.features import FeatureEngineer
from src.ml_models import MatchClassifier, AnomalyDetector
from src.governance import CostOptimizer, DriftMonitor, ActiveLearner
from src.explainer import XAIExplainer
from src.security import SecurityGuard, LineageTracker
from src.resilience import CircuitBreaker, SLAWatchdog

logger = logging.getLogger(__name__)

class HybridDecisionEngine:
    """
    Level 9: Enterprise Decision Engine.
    Combines Rules + ML + Cost Optimization + Explainability + Resilience.
    """
    def __init__(self, config: Dict, audit, classifier: MatchClassifier, anomaly_detector: AnomalyDetector):
        self.config = config
        self.audit = audit
        self.classifier = classifier
        self.anomaly_detector = anomaly_detector
        self.feature_engineer = FeatureEngineer()
        
        # Governance
        self.cost_optimizer = CostOptimizer(config)
        self.drift_monitor = DriftMonitor()
        self.active_learner = ActiveLearner()
        
        # Resilience
        self.circuit_breaker = CircuitBreaker(failure_threshold=3)
        
        # Dynamic Threshold calculation
        self.AUTO_MATCH_PROB = self.cost_optimizer.optimize_threshold(classifier, [])
        self.REVIEW_PROB = 0.70

    def evaluate_pair(self, event_a: Dict, event_b: Dict) -> Dict:
        """
        Returns detailed decision block with XAI and Resilience.
        """
        self.drift_monitor.update(event_a['amount'])
        
        # 1. Feature Extraction
        features = self.feature_engineer.compute_features(event_a, event_b)
        
        # 2. ML Probability (Protected by Circuit Breaker)
        # If CB is OPEN or call fails, returns None
        ml_prob = self.circuit_breaker.call(self.classifier.predict_probability, features)
        
        # Fallback Logic
        is_fallback = False
        if ml_prob is None:
            is_fallback = True
            ml_prob = 0.0 # Default to low confidence
            logger.warning("HybridEngine: ML Circuit Broken/Failed. Using Rules-Only Fallback.")
        
        # 3. Decision Logic
        status = 'EXCEPTION'
        reason = 'Low Confidence'
        
        # --- Rule: Exact Amount & High Id Match (Safety Net) ---
        # ALWAYS RUNS (Resilient)
        if features[5] == 1.0 and features[2] >= 95:
             status = 'AUTO_RECONCILED'
             reason = 'Hard Rule: Exact Amount + ID > 95%'
             if is_fallback:
                 reason += " (Fallback Mode)"
             ml_prob = max(ml_prob, 0.99)
             
        elif not is_fallback and ml_prob >= self.AUTO_MATCH_PROB:
            status = 'AUTO_RECONCILED'
            reason = f'ML Confidence > {self.AUTO_MATCH_PROB:.2f} (Cost Optimized)'
            
        elif not is_fallback and ml_prob >= self.REVIEW_PROB:
            status = 'OPS_REVIEW'
            reason = f'ML Confidence > {self.REVIEW_PROB}'
            self.active_learner.submit_feedback({'a': event_a, 'b': event_b}, 'PENDING')
        
        elif is_fallback:
            reason = "ML Unavailable - Rules Failed"
            
        else:
            status = 'EXCEPTION'
            
        # 4. Explainability
        # Check if ml_prob is valid roughly (it might be None if CB failed and logic slipped, but handled above)
        score_val = ml_prob if ml_prob is not None else 0.0
        xai_details = XAIExplainer.explain_multimodal_decision({'score': score_val}, features)
        if is_fallback:
            xai_details['mode'] = 'FALLBACK_RULES_ONLY'
            
        return {
            'status': status,
            'match_type': 'HYBRID_ML',
            'score': ml_prob,
            'reason': reason,
            'features': str(features),
            'xai': xai_details
        }

class RealTimeEngine:
    """
    Stateful Reconciliation Engine with Hybrid ML + Security + Resilience.
    """
    
    def __init__(self, config: Dict, audit, classifier, anomaly_detector):
        self.config = config
        self.audit = audit
        self.decision_engine = HybridDecisionEngine(config, audit, classifier, anomaly_detector)
        
        # Security & Resilience
        self.security = SecurityGuard()
        self.lineage = LineageTracker()
        self.sla_watchdog = SLAWatchdog()
        
        # State: Unmatched buckets
        self.pending_a: List[Dict] = []
        self.pending_b: List[Dict] = []
        
        # Output buffers
        self.matches = []
        self.exceptions = []

    def process_event(self, event: Dict):
        """
        Ingests a single event (transaction) and attempts to match.
        """
        # --- 1. Security Check (Zero Trust) ---
        # Mask PII in any reject logs
        if not self.security.authenticate_event(event):
            safe_event_str = str(self.security.mask_pii(event.copy()))
            self.audit.log_event("SECURITY", "BLOCK", "REJECTED", f"Unauthenticated Event: {safe_event_str}")
            return
            
        # --- 2. Lineage Tracking ---
        event = self.lineage.assign_trace_id(event)
        self.lineage.log_lineage(event, "INGESTION", "Event Received")
        
        # --- 3. SLA Monitor ---
        sla_priority = self.sla_watchdog.check_priority(datetime.now())
        if sla_priority == "CRITICAL":
            self.audit.log_event("SLA_WATCHDOG", "ESCALATE", "CRITICAL", f"SLA Deadline Near for {event.get('txn_ref_id')}")

        system = event['source_system']
        event_id = event['txn_ref_id']
        
        if 'value_date' not in event or 'amount' not in event:
            return

        target_window = self.pending_b if system == 'SOURCE_A' else self.pending_a
        my_window = self.pending_a if system == 'SOURCE_A' else self.pending_b
        
        best_decision = None
        best_match = None
        best_prob = -1.0
        
        # Search target window
        for candidate in target_window:
            decision = self.decision_engine.evaluate_pair(event, candidate)
            prob = decision['score']
            
            if prob > best_prob:
                best_prob = prob
                best_match = candidate
                best_decision = decision
        
        # Evaluate Best Match
        if best_decision and best_prob >= 0.70: # Min threshold to consider processing
            
            status = best_decision['status']
            
            if status in ['AUTO_RECONCILED', 'OPS_REVIEW']:
                # Commit Match
                target_window.remove(best_match)
                
                match_record = {
                    'txn_ref_id': event_id,
                    'match_ref_id': best_match['txn_ref_id'],
                    'source_system': system,
                    'match_system': best_match['source_system'],
                    'match_type': best_decision['match_type'],
                    'score': best_decision['score'],
                    'status': status,
                    'match_details': best_decision['reason'],
                    'amount': event['amount'],
                    'value_date': event['value_date']
                }
                
                self.matches.append(match_record)
                
                self.audit.log_event("HYBRID_ENGINE", "MATCH", status, 
                                     f"Matched {event_id} ({best_decision['reason']})",
                                     metadata={
                                         'prob': best_prob,
                                         'xai': best_decision.get('xai', {})
                                     })
                return

        # No suitable match found -> Add to pending
        my_window.append(event)

    def get_pending_as_exceptions(self) -> List[Dict]:
        """
        Returns current pending items as 'Missing' exceptions.
        """
        exs = []
        for p in self.pending_a:
            exs.append(self._make_ex(p, 'SOURCE_A', ExceptionCode.MISSING_IN_SOURCE_B))
        for p in self.pending_b:
             exs.append(self._make_ex(p, 'SOURCE_B', ExceptionCode.MISSING_IN_SOURCE_A))
        return exs

    def _make_ex(self, p, src, code):
        # Helper to format exception
        return {
                'txn_ref_id': p['txn_ref_id'],
                'amount': p['amount'],
                'source_system': src,
                'exception_code': code.value,
                'severity': 'HIGH',
                'description': 'Pending event never matched (Time-out)',
                'risk_score': 50.0 
        }
