from typing import Dict, Any, List
from enum import Enum
import logging
from dataclasses import dataclass
from src.exceptions import Severity, ExceptionCode

logger = logging.getLogger(__name__)

class RiskScorer:
    """
    Level 2: Intelligent Exception Prioritization.
    Calculates a Risk Score to prioritize exceptions for Operations.
    
    Formula:
    Risk Score = (Transaction Amount * Weight) + Exception Type Weight + Historical Failure Count (Simulated)
    """
    
    def __init__(self, config: Dict):
        self.amount_weight = 0.001  # $1000 mismatch -> 1 point
        self.exception_weights = {
            ExceptionCode.MISSING_IN_SOURCE_A.value: 50, # High risk
            ExceptionCode.MISSING_IN_SOURCE_B.value: 50, # High risk
            ExceptionCode.AMOUNT_MISMATCH.value: 20,
            ExceptionCode.DUPLICATE.value: 10,
            ExceptionCode.DATE_MISMATCH.value: 5,
            ExceptionCode.UNKNOWN.value: 10
        }

    def calculate_score(self, amount: float, exception_code: str) -> float:
        """
        Returns a normalized risk score (0-100+).
        """
        # Base score from amount magnitude
        amt_score = abs(amount) * self.amount_weight
        
        # Type score
        type_score = self.exception_weights.get(exception_code, 10)
        
        total_score = amt_score + type_score
        return round(total_score, 2)

class RuleEngine:
    """
    Level 2: Enterprise Rule Engine.
    Evaluates business rules to determine Severity and Actions.
    """
    
    @staticmethod
    def evaluate_severity(risk_score: float, exception_code: str) -> Severity:
        """
        Dynamic rule evaluation.
        """
        # Rule 1: High Value Items are always HIGH severity
        if risk_score > 80:
            return Severity.HIGH
            
        # Rule 2: Missing Funds are High Severity
        if exception_code in [ExceptionCode.MISSING_IN_SOURCE_A.value, ExceptionCode.MISSING_IN_SOURCE_B.value]:
            return Severity.HIGH
            
        # Rule 3: Medium Risk
        if risk_score > 30:
            return Severity.MEDIUM
            
        return Severity.LOW

    @staticmethod
    def get_resolution_suggestion(exception_code: str) -> str:
        """
        Returns an 'Auto-Resolution' suggestion or manual instruction.
        """
        if exception_code == ExceptionCode.AMOUNT_MISMATCH.value:
            return "Investigate Gl/Sub-ledger posting."
        if exception_code == ExceptionCode.DATE_MISMATCH.value:
            return "Check Timezone settings or Cut-off times."
        if "MISSING" in exception_code:
            return "Trace Payment Gateway logs."
        return "Manual Review Required."
