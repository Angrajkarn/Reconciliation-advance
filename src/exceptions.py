from enum import Enum
from dataclasses import dataclass
from typing import Optional

class Severity(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ExceptionCode(Enum):
    EXACT_MATCH = "MATCH"
    TOLERANCE_MATCH = "TOLERANCE_MATCH"
    AMOUNT_MISMATCH = "AMT_MISMATCH"
    DATE_MISMATCH = "DATE_MISMATCH"
    MISSING_IN_SOURCE_A = "MISSING_SRC_A"
    MISSING_IN_SOURCE_B = "MISSING_SRC_B"
    DUPLICATE = "DUPLICATE"
    UNKNOWN = "UNKNOWN"

@dataclass
class ReconException:
    txn_id: str
    code: ExceptionCode
    severity: Severity
    description: str
    source_system: str

class ExceptionClassifier:
    """
    Centralized logic for assigning severity and codes to breaks.
    """
    
    @staticmethod
    def classify(code: ExceptionCode, diff_amount: float = 0.0) -> Severity:
        """
        Determines severity based on exception code and business rules.
        """
        if code in [ExceptionCode.MISSING_IN_SOURCE_A, ExceptionCode.MISSING_IN_SOURCE_B]:
            # Missing funds are always high risk
            return Severity.HIGH
        
        if code == ExceptionCode.AMOUNT_MISMATCH:
            # High value breaks could be HIGH severity, small ones MEDIUM
            if abs(diff_amount) > 10000: 
                return Severity.HIGH
            return Severity.MEDIUM
            
        if code == ExceptionCode.DATE_MISMATCH:
            return Severity.LOW
            
        return Severity.LOW
