import pandas as pd
import os
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)

class ReportGenerator:
    """
    Generates reconciliation outputs:
    1. Summary Report
    2. Detailed Reconciliation Report
    3. Exception Report
    """
    
    def __init__(self, output_dir: str):
        self.output_dir = output_dir
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

    def save_reports(self, run_id: str, matches: pd.DataFrame, exceptions: pd.DataFrame):
        """
        Saves DataFrames to CSV/Excel.
        """
        timestamp = pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")
        
        # 1. Matches Report
        matches_file = os.path.join(self.output_dir, f"recon_matches_{run_id}_{timestamp}.csv")
        matches.to_csv(matches_file, index=False)
        logger.info(f"Saved Matches Report to {matches_file}")
        
        # 2. Exceptions Report
        exceptions_file = os.path.join(self.output_dir, f"recon_exceptions_{run_id}_{timestamp}.csv")
        exceptions.to_csv(exceptions_file, index=False)
        logger.info(f"Saved Exceptions Report to {exceptions_file}")
        
        # 3. Summary Report (Aggregated stats)
        summary = {
            'Run ID': [run_id],
            'Total Matches': [len(matches)],
            'Total Exceptions': [len(exceptions)],
            'Exact Matches': [len(matches[matches['match_type'] == 'EXACT']) if not matches.empty else 0],
            'Tolerance Matches': [len(matches[matches['match_type'] == 'TOLERANCE']) if not matches.empty else 0],
            'High Severity Breaks': [len(exceptions[exceptions['severity'] == 'HIGH']) if not exceptions.empty else 0]
        }
        summary_df = pd.DataFrame(summary)
        summary_file = os.path.join(self.output_dir, f"recon_summary_{run_id}_{timestamp}.csv")
        summary_df.to_csv(summary_file, index=False)
        logger.info(f"Saved Summary Report to {summary_file}")
