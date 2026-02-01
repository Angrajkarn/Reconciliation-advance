import logging
import json
from datetime import datetime
import os

class AuditLogger:
    """
    Immutable audit logger ensuring all system actions are traceable.
    Output: Structured JSON log file.
    """
    def __init__(self, log_dir: str = "data/logs"):
        self.log_dir = log_dir
        if not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
            
        self.log_file = os.path.join(log_dir, "audit_trace.jsonl")
        
        # Configure a specific logger for audit that doesn't propagate to console events
        self.logger = logging.getLogger("AUDIT")
        self.logger.setLevel(logging.INFO)
        
        handler = logging.FileHandler(self.log_file)
        formatter = logging.Formatter('%(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def log_event(self, run_id: str, component: str, action: str, message: str, metadata: dict = None):
        """
        Logs a structured event.
        """
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "run_id": run_id,
            "component": component,
            "action": action,
            "message": message,
            "metadata": metadata or {}
        }
        
        self.logger.info(json.dumps(event))
