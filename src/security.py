import logging
import uuid
import re
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SecurityGuard:
    """
    Enforces Zero Trust Security.
    1. Authenticates events (Simulated)
    2. Masks PII in logs/outputs.
    """
    def __init__(self):
        # Regex to visually identify things looking like account numbers (usually >8 digits)
        # We will mask them.
        self.pii_pattern = re.compile(r'\b\d{8,16}\b') 
    
    def authenticate_event(self, event: Dict) -> bool:
        """
        Simulates Service-to-Service Auth.
        In real life, checks JWT or mTLS cert.
        """
        # Simulate: If 'source_system' is missing, auth fails.
        if 'source_system' not in event:
            logger.warning("SecurityGuard: Event rejected. Missing Source System Identity.")
            return False
            
        # Simulate check
        # logger.debug(f"SecurityGuard: Authenticated event from {event.get('source_system')}")
        return True

    def mask_pii(self, data: Any) -> Any:
        """
        recursively masks PII in dictionaries or strings.
        """
        if isinstance(data, str):
            return self.pii_pattern.sub('***PII***', data)
        elif isinstance(data, dict):
            return {k: self.mask_pii(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self.mask_pii(i) for i in data]
        return data

class LineageTracker:
    """
    Tracks the lifecycle of a transaction event.
    Source -> Ingest -> ML -> Decision
    """
    def __init__(self):
        pass
        
    def assign_trace_id(self, event: Dict) -> Dict:
        """
        Injects a Trace ID if one doesn't exist.
        """
        if 'trace_id' not in event:
            event['trace_id'] = str(uuid.uuid4())
        return event

    def log_lineage(self, event: Dict, stage: str, details: str):
        """
        Logs a lineage milestone.
        """
        trace_id = event.get('trace_id', 'UNKNOWN')
        # In a real system, this goes to a Lineage DB (Atlas/Spline).
        # logger.info(f"LINEAGE [Trace={trace_id}]: Stage={stage} Details={details}")
        pass
