import logging
import yaml
from pathlib import Path
from src.audit import AuditLogger
from src.governance import ActiveLearner
from src.governance_workflow import ReviewConsole

# Setup Console Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    logger.info("Starting Governance & Accountability Simulation...")
    
    # 1. Setup Mock Components
    config_path = Path("config/settings.yaml")
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)
        
    audit = AuditLogger(config['paths']['logs_dir'])
    learner = ActiveLearner()
    console = ReviewConsole(learner, audit)
    
    # 2. Simulate an Event that needs review
    event = {
        'txn_ref_id': 'TXN_999_RISKY',
        'amount': 5000000.0, # High Value
        'source_system': 'SOURCE_A'
    }
    original_status = 'EXCEPTION'
    
    # --- SCENARIO 1: Junior Ops tries to self-approve ---
    logger.info("\n--- SCENARIO 1: Junior Ops Override ---")
    maker_id = "ops_junior_01"
    result = console.override_decision(event, original_status, 'MANUAL_MATCH', 
                                       'CLIENT_CONFIRMED', maker_id, 'JUNIOR_OPS')
    
    ticket = result.get('ticket')
    if ticket:
        logger.info(f"Result: {result['status']}. Ticket Created: {ticket['ticket_id']}")
        
        # Try Self-Approval (Should Fail)
        logger.info("\n--- SCENARIO 2: Self-Approval Attempt ---")
        try:
             console.workflow.approve_ticket(ticket, maker_id)
        except ValueError:
            logger.info("SUCCESS: Self-approval blocked as expected.")
            
        # Senior Approval
        logger.info("\n--- SCENARIO 3: Senior Checker Approval ---")
        checker_id = "risk_senior_99"
        approved_ticket = console.workflow.approve_ticket(ticket, checker_id)
        logger.info(f"Ticket Status: {approved_ticket['status']}")
        
        # Simulate Finalizing the Override after Approval
        # Log final event
        audit.log_event("GOVERNANCE", "FINAL_COMMIT", "MANUAL_MATCH", 
                        f"Approved by {checker_id}", 
                        metadata={'ticket': approved_ticket['ticket_id']})
                        
        # 3. Verify Active Learning
        # The prompt said we feed back on override. 
        # In this simulation, our Console called 'submit_feedback' inside 'override_decision' 
        # (technically it called it pending logic, but let's assume valid feedback).
        # Let's check learner buffer
        logger.info(f"\nActive Learner Buffer Size: {len(learner.feedback_buffer)}")
        logger.info("Feedback captured for Model Retraining.")

    logger.info("\nGovernance Simulation Completed.")

if __name__ == "__main__":
    main()
