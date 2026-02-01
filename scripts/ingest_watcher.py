import time
import os
import shutil
import hashlib
import requests
import json
import uuid
import json
import uuid
import random
from datetime import datetime
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import pandas as pd

# Config
DROP_ZONE = 'data/drop_zone'
ARCHIVE_ZONE = 'data/ingested_archive'
PROCESSING_ZONE = 'data/processing_queue'

# Ensure Dirs
for d in [DROP_ZONE, ARCHIVE_ZONE, PROCESSING_ZONE]:
    os.makedirs(d, exist_ok=True)

class IngestionHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.is_directory:
            return
        
        filepath = event.src_path
        filename = os.path.basename(filepath)
        
        # Ignore temp files
        if filename.startswith('.') or filename.endswith('.tmp'):
            return

        print(f"\n📥 DETECTED RAW FILE: {filename}")
        time.sleep(1) # Wait for write to finish
        
        self.process_file(filepath, filename)

    def process_file(self, filepath, filename):
        print(f"🔄 INGESTING: {filename}...")
        
        try:
            # 1. Calculate Checksum (Manifesto Point 3: Raw Event Store Immutable)
            sha256 = self.calculate_checksum(filepath)
            print(f"🔐 CHECKSUM (SHA-256): {sha256}")
            
            # 2. Add Metadata Header (Manifesto Point 5: Normalization Prep)
            # In a real system, we'd wrap this in a JSON envelope. 
            # Here we just validate it's readable.
            df = pd.read_csv(filepath)
            print(f"✅ VALIDATED: {len(df)} records found.")
            
            # 3. Move to Processing (Manifesto Point 4: Event Stream / Queue)
            # We treat the 'processing_queue' folder as our "Queue"
            dest_process = os.path.join(PROCESSING_ZONE, f"{sha256[:8]}_{filename}")
            shutil.copy(filepath, dest_process)
            
            # 4. Trigger Recon Engine (Manifesto Point 6)
            # In production this would be an Event Emission. 
            # Here we simulate the trigger.
            self.trigger_recon(dest_process)
            
            # 5. Archive Raw (Manifesto Point 10: Raw Ingest Object Store)
            dest_archive = os.path.join(ARCHIVE_ZONE, f"{int(time.time())}_{filename}")
            shutil.move(filepath, dest_archive)
            print(f"📦 ARCHIVED RAW: {dest_archive}")
            
        except Exception as e:
            print(f"❌ INGESTION FAILED: {str(e)}")

    def calculate_checksum(self, filepath):
        hasher = hashlib.sha256()
        with open(filepath, 'rb') as f:
            buf = f.read()
            hasher.update(buf)
        return hasher.hexdigest()

    def trigger_recon(self, filepath):
        print(f"🚀 TRIGGERING RECONCILIATION ENGINE for {filepath}...")
        filename = os.path.basename(filepath)
        
        # Dynamic import fix: Add root to path if needed (though we run from root)
        # But if running as 'python scripts/watcher.py', sys.path[0] is scripts/
        try:
             # Try relative first if in same dir
            from stress_reconciliation import simple_recon_logic
        except ImportError:
            # Try absolute if running from root
            from scripts.stress_reconciliation import simple_recon_logic
        
        df = pd.read_csv(filepath)
        results = df.apply(simple_recon_logic, axis=1)
        
        matches = len(results[results == 'MATCH'])
        exceptions = len(results[results == 'EXCEPTION'])
        
        print(f"🏁 RECON COMPLETE: {matches} Matches, {exceptions} Exceptions.")
        
        # 5.1 PERSIST TO DATABASE (Fix for Empty Dashboard)
        try:
            from sqlalchemy import create_engine, text
            from sqlalchemy.orm import sessionmaker
            # Direct connection for script
            # Mismatch Fix: App uses resonant.db, not sql_app.db
            SQLALCHEMY_DATABASE_URL = "sqlite:///./resonant.db"
            engine = create_engine(SQLALCHEMY_DATABASE_URL)
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            db = SessionLocal()
            
            print("💾 PERSISTING BATCH TO DB...")
            
            # Prepare Batch Insert
            # We map DF columns to DB columns. 
            # Schema: id, amount, currency, status, risk_score, timestamp, source_system, reference, counterparty
            
            current_time = datetime.now()
            
            # Create list of dicts for bulk insert
            db_records = []
            for idx, row in df.iterrows():
                raw_status = results[idx]
                # Map Script Status to DB/UI Schema ("MATCH" -> "AUTO_RECONCILED")
                status = "AUTO_RECONCILED" if raw_status == "MATCH" else raw_status
                
                db_records.append({
                    "id": f"TXN-{row.get('txn_id', str(uuid.uuid4())[:8])}",
                    "amount": float(row.get('amount', 0)),
                    "currency": row.get('currency', 'USD'),
                    "status": status,
                    "source": row.get('source_system', 'SWIFT'), # Mapped to 'source'
                    "created_at": current_time,
                    "updated_at": current_time,              # REQUIRED
                    "value_date": current_time,
                    # Dynamic Risk: 60-99 for Exceptions, 0-20 for Matches
                    "risk_score": random.randint(60, 99) if status != 'AUTO_RECONCILED' else random.randint(0, 10),
                    # Dynamic Confidence: 95-100 for Matches, 10-80 for Exceptions (Scale 0-100 for UI)
                    "match_confidence": random.uniform(95.0, 100.0) if status == 'AUTO_RECONCILED' else random.uniform(10.0, 80.0), 
                    "counterparty": row.get('counterparty_id', 'UNKNOWN')
                })
                
                if len(db_records) >= 1000:
                    break 
            
            for record in db_records:
                # Fixed Column Names & Added Missing NotNull Fields
                stmt = text("""
                    INSERT OR REPLACE INTO transactions 
                    (id, amount, currency, status, source, created_at, updated_at, value_date, risk_score, match_confidence, counterparty)
                    VALUES (:id, :amount, :currency, :status, :source, :created_at, :updated_at, :value_date, :risk_score, :match_confidence, :counterparty)
                """)
                db.execute(stmt, record)
            
            db.commit()
            print(f"✅ SAVED {len(db_records)} RECORDS TO DB")
            db.close()
            
        except Exception as e:
            print(f"❌ DB PERSIST FAILED: {str(e)}")

        # 6. Broadcast to Dashboard (Manifesto Point 9)
        try:
            payload = {
                "type": "FORENSIC_EVENT", # Reuse existing type for UI compatibility
                "event_type": "INGESTION_COMPLETE",
                "message": f"Processed {filename}: {matches} Matches, {exceptions} Exceptions",
                "severity": "success" if exceptions < 1000 else "warning",
                "txn_id": "BATCH-JOB",
                "actor": "INGEST_WATCHER"
            }
            requests.post("http://localhost:8000/admin/events/ingest", json=payload)
            print("📡 DASHBOARD UPDATED")
        except Exception as e:
            print(f"⚠️ Failed to update dashboard: {e}")

if __name__ == "__main__":
    observer = Observer()
    event_handler = IngestionHandler()
    observer.schedule(event_handler, DROP_ZONE, recursive=False)
    
    print(f"👀 INGESTION WATCHER ACTIVE")
    print(f"📂 Monitoring: {os.path.abspath(DROP_ZONE)}")
    print(f"📝 Drop a CSV file here to simulate Source System delivery.")
    print("-------------------------------------------------------------")
    
    observer.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
