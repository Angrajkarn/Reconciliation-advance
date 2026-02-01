import asyncio
from datetime import datetime
import random
from app.core.events import manager

async def system_event_generator():
    """
    Background task that generates REAL system status events.
    This simulates the heartbeat of the connection and infrastructure monitoring.
    """
    while True:
        try:
            # 1. Heartbeat / System Status (Every 5 seconds)
            await asyncio.sleep(5)
            
            # Simulate different systems reporting in
            systems = ["RECON_ENGINE", "IDENTITY_SERVICE", "LEDGER_CORE", "ML_INFERENCE"]
            target_system = random.choice(systems)
            latency = random.randint(5, 45) # Simulating DB latency check
            status = "OPERATIONAL"
            if latency > 40: status = "DEGRADED"
            
            await manager.broadcast({
                "id": str(datetime.now().timestamp()),
                "type": "SYSTEM_HEARTBEAT", # Specific type for system registry
                "system_code": target_system,
                "status": status,
                "latency": latency,
                "message": f"Heartbeat received from {target_system}",
                "timestamp": datetime.now().isoformat(),
                "severity": "info" if status == "OPERATIONAL" else "warning"
            })
            
            # 2. Simulate ML Drift Checks (Every 15s) - In a real system this would query the ML Service
            if int(datetime.now().timestamp()) % 15 == 0:
                await manager.broadcast({
                    "id": str(datetime.now().timestamp()),
                    "type": "ML_DRIFT",
                    "model": "XGBoost_v4.2",
                    "drift_score": round(random.uniform(0.01, 0.05), 4),
                    "status": "STABLE",
                    "timestamp": datetime.now().isoformat(),
                    "severity": "success"
                })
            
            # 3. Simulate LIVE FORENSIC EVENTS (Disabled to allow real Ingestion events to shine)
            # if int(datetime.now().timestamp()) % 3 == 0:
            #     stages = ["INGESTION", "NORMALIZATION", "ML_SCORING", "OPS_REVIEW", "FINAL_DECISION"]
            #     stage = random.choice(stages)
            #     txn_demo = f"TXN-{random.randint(10000, 99999)}"
                
            #     await manager.broadcast({
            #         "id": str(datetime.now().timestamp()),
            #         "type": "FORENSIC_EVENT",
            #         "txn_id": txn_demo,
            #         "event_type": stage,
            #         "actor": "AUTO_RECON_BOT" if stage == "FINAL_DECISION" else "SYSTEM",
            #         "message": f"Processing {stage} for {txn_demo}",
            #         "timestamp": datetime.now().isoformat(),
            #         "severity": "info"
            #     })

        except Exception as e:
            print(f"Error in system event generator: {e}")
            await asyncio.sleep(5)
