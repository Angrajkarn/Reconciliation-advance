import logging
import time
from datetime import datetime, timedelta
from typing import Callable, Any

logger = logging.getLogger(__name__)

class CircuitBreaker:
    """
    Protects the system from ML Service failures.
    If ML fails N times, switch to Fallback (Rule-Only).
    """
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        
        self.failure_count = 0
        self.last_failure_time = 0
        self.is_open = False # Open = Circuit Broken (Fallback Mode)

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Executes func() with circuit breaker logic.
        """
        if self.is_open:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                logger.info("CircuitBreaker: Half-Open. Attempting recovery...")
                self.is_open = False
                self.failure_count = 0
            else:
                # Fast fail / Fallback
                return None

        try:
            result = func(*args, **kwargs)
            # Success resets
            self.failure_count = 0
            return result
        except Exception as e:
            self.failure_count += 1
            self.last_failure_time = time.time()
            logger.error(f"CircuitBreaker warning: Call failed ({self.failure_count}/{self.failure_threshold}). Error: {e}")
            
            if self.failure_count >= self.failure_threshold:
                self.is_open = True
                logger.error("CircuitBreaker: OPEN. Switching to Fallback Mode.")
            
            return None # Return None to signal fallback

class SLAWatchdog:
    """
    Monitors SLA Deadlines (Settlement Cutoffs).
    """
    def __init__(self, cutoff_hour: int = 17): # 5 PM cutoff
        self.cutoff_hour = cutoff_hour
    
    def check_priority(self, event_time: datetime) -> str:
        """
        Determines priority based on time remaining to cutoff.
        """
        # Assume event_time is "now" processing time for this simulation
        # For simulation, just check if we are 'close' to a logical cutoff.
        
        # In this mock, let's assume valid CUTOFF is 17:00 (5 PM)
        # We need to check simulated time? Or just system time?
        # Let's use system time for 'processing' SLA.
        
        now = datetime.now()
        deadline = now.replace(hour=self.cutoff_hour, minute=0, second=0, microsecond=0)
        
        if now > deadline:
            return "LATE" # Missed SLA
            
        params = deadline - now
        hours_remaining = params.total_seconds() / 3600
        
        if hours_remaining < 2:
            return "CRITICAL"
        elif hours_remaining < 4:
            return "HIGH"
        else:
            return "NORMAL"
