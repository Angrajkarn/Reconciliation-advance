import logging
import uuid
from typing import Dict, Optional, Tuple
from datetime import datetime
from src.audit import AuditLogger

logger = logging.getLogger(__name__)

class ApprovalWorkflow:
    """
    Enforces Maker-Checker Protocol.
    High-Risk items require distinct Maker and Checker.
    """
    def __init__(self, audit_logger):
        self.audit = audit_logger

    def submit_for_approval(self, event_id: str, action: str, maker_id: str) -> Dict:
        """
        Maker submits an action.
        """
        ticket_id = str(uuid.uuid4())
        logger.info(f"Workflow: Ticket {ticket_id} created by Maker {maker_id} for {event_id}. Status: PENDING_APPROVAL")
        return {
            'ticket_id': ticket_id,
            'event_id': event_id,
            'action': action,
            'maker_id': maker_id,
            'status': 'PENDING_APPROVAL',
            'created_at': datetime.now()
        }

    def approve_ticket(self, ticket: Dict, checker_id: str) -> Dict:
        """
        Checker approves the ticket. Enforces segregation of duties.
        """
        if ticket['maker_id'] == checker_id:
            msg = f"Security Violation: Maker {ticket['maker_id']} cannot approve their own ticket {ticket['ticket_id']}."
            logger.error(msg)
            self.audit.log_event("GOVERNANCE", "BLOCK", "SELF_APPROVAL_ATTEMPT", msg)
            raise ValueError("Self-Approval Forbidden")
        
        ticket['status'] = 'APPROVED'
        ticket['checker_id'] = checker_id
        ticket['approved_at'] = datetime.now()
        
        logger.info(f"Workflow: Ticket {ticket['ticket_id']} APPROVED by {checker_id}.")
        return ticket

class ReviewConsole:
    """
    Simulates Ops Console for Exceptions.
    Allows decision overrides and feedback.
    """
    def __init__(self, active_learner, audit_logger):
        self.active_learner = active_learner
        self.audit = audit_logger
        self.workflow = ApprovalWorkflow(audit_logger)

    def override_decision(self, event: Dict, original_decision: str, new_decision: str, 
                          reason_code: str, user_id: str, role: str) -> Dict:
        """
        Human overrides a machine decision.
        """
        logger.info(f"ReviewConsole: User {user_id} ({role}) overriding {original_decision} -> {new_decision}")
        
        # 1. Enforce Maker-Checker if High Risk or drastic change
        # (For simulation, assume all overrides need check if Role is JUNIOR)
        if role == 'JUNIOR_OPS':
            ticket = self.workflow.submit_for_approval(event['txn_ref_id'], new_decision, user_id)
            return {'status': 'PENDING_APPROVAL', 'ticket': ticket}
        
        # 2. Log Immutable Audit Record
        self.audit.log_event("GOVERNANCE", "OVERRIDE", new_decision, 
                             f"Decision Override by {user_id}",
                             metadata={
                                 'original': original_decision,
                                 'reason': reason_code,
                                 'user': user_id,
                                 'role': role
                             })

        # 3. Active Learning Feedback
        # If human says it's a MATCH (when ML said Exception), feed positive label
        label = 1 if new_decision in ['AUTO_RECONCILED', 'MANUAL_MATCH'] else 0
        self.active_learner.submit_feedback({'event': event}, str(label))
        
        return {'status': 'COMPLETED', 'final_decision': new_decision}
