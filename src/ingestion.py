import pandas as pd
import logging
from typing import Dict, List
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataLoader:
    """
    Responsible for ingesting transaction files and normalizing them.
    """
    
    REQUIRED_COLUMNS = ['txn_ref_id', 'value_date', 'amount', 'currency']

    def __init__(self, config: Dict):
        self.config = config

    def load_file(self, file_path: str, source_name: str) -> pd.DataFrame:
        """
        Loads a file (CSV/Excel) and returns a standardized DataFrame.
        """
        logger.info(f"Loading data from {file_path} for {source_name}")
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Input file not found: {file_path}")

        try:
            if file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            elif file_path.endswith('.xlsx'):
                df = pd.read_excel(file_path)
            else:
                raise ValueError("Unsupported file format. Use CSV or Excel.")
            
            # Normalize Headers (simple lowercase/strip for safety)
            df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]
            
            self._validate_schema(df)
            self._standardize_types(df)
            
            # Tag source system
            df['source_system'] = source_name
            
            logger.info(f"Successfully loaded {len(df)} records from {source_name}")
            return df

        except Exception as e:
            logger.error(f"Failed to load {file_path}: {str(e)}")
            raise

    def _validate_schema(self, df: pd.DataFrame):
        """
        Ensures required columns exist.
        """
        missing = [col for col in self.REQUIRED_COLUMNS if col not in df.columns]
        if missing:
            raise ValueError(f"Missing required columns: {missing}")

    def _standardize_types(self, df: pd.DataFrame):
        """
        Enforce data types for reconciliation critical fields.
        """
        # Ensure date is datetime
        df['value_date'] = pd.to_datetime(df['value_date'])
        
        # Ensure amount is float (handle potential currency symbols if needed, assuming clean for now)
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
        
        # Ensure ID is string
        df['txn_ref_id'] = df['txn_ref_id'].astype(str)
