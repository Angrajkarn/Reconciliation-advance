import logging
from typing import Generator, List, Tuple, Dict
from src.ingestion import DataLoader

logger = logging.getLogger(__name__)

class IdempotencyCheck:
    """
    Level 4: Idempotency & Re-run Safety.
    Prevents double-processing of the same transaction event.
    """
    def __init__(self):
        self._seen_ids = set()

    def is_new(self, txn_id: str) -> bool:
        if txn_id in self._seen_ids:
            return False
        self._seen_ids.add(txn_id)
        return True

class EventStreamSimulator:
    """
    Simulates a real-time event stream from static files.
    """
    def __init__(self, config, data_loader: DataLoader):
        self.config = config
        self.loader = data_loader
        
    def stream_events(self, file_a: str, file_b: str) -> Generator[Dict, None, None]:
        """
        Yields individual events from both sources, interleaved.
        """
        logger.info("Initializing Real-Time Event Stream...")
        
        df_a = self.loader.load_file(file_a, "SOURCE_A")
        df_b = self.loader.load_file(file_b, "SOURCE_B")
        
        # Convert to list of dicts
        events_a = df_a.to_dict('records')
        events_b = df_b.to_dict('records')
        
        # Interleave simulation: Simple round-robin for now, or randomize
        # To simulate out of order, we could shuffle, but let's just zip for now
        # Creating a single timeline
        
        all_events = events_a + events_b
        # Sort by value_date to simulate rough time order (but not exact arrival)
        # Assuming value_date is somewhat correlated to arrival
        all_events.sort(key=lambda x: x['value_date'])
        
        # Optional: Add random jitter to simulate out-of-order arrival
        # import random
        # random.shuffle(all_events) # Too chaotic? Maybe local shuffle.
        
        logger.info(f"Streaming {len(all_events)} events...")
        
        for event in all_events:
            yield event 

class BatchProcessor:
    """
    Orchestrates the processing of micro-batches.
    """
    def __init__(self, engine, audit):
        self.engine = engine
        self.audit = audit
        self.idempotency = IdempotencyCheck()
        self.all_matches = []
        self.all_exceptions = []

    def process_stream(self, stream_generator):
        batch_count = 0
        
        for df_a, df_b in stream_generator:
            batch_count += 1
            
            # Idempotency Filter (Simulation)
            # In a real stream, we'd check every ID. 
            # Here we assume the batch slicer is sequential, but let's filter just to demonstrate logic.
            df_a = df_a[df_a['txn_ref_id'].apply(self.idempotency.is_new)]
            df_b = df_b[df_b['txn_ref_id'].apply(self.idempotency.is_new)]
            
            if df_a.empty and df_b.empty:
                continue

            # Run Engine on Micro-Batch
            matches, exceptions = self.engine.run(df_a, df_b)
            
            self.all_matches.append(matches)
            self.all_exceptions.append(exceptions)
            
            self.audit.log_event("STREAM", "BATCH_COMPLETE", "PROCESSED", f"Batch {batch_count} processed")
            
        # Consolidate results for final report
        final_matches = pd.concat(self.all_matches, ignore_index=True) if self.all_matches else pd.DataFrame()
        final_exceptions = pd.concat(self.all_exceptions, ignore_index=True) if self.all_exceptions else pd.DataFrame()
        
        return final_matches, final_exceptions
