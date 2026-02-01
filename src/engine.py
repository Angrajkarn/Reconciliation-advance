import pandas as pd
import logging
from typing import Dict, Tuple, List
from rapidfuzz import process, fuzz
from src.exceptions import ExceptionClassifier, ExceptionCode, Severity
from src.rules import RiskScorer, RuleEngine

logger = logging.getLogger(__name__)

class ReconciliationEngine:
    """
    Multi-stage reconciliation engine (Advanced Enterprise Version):
    1. Exact Match
    2. Fuzzy ID Match (Level 1)
    3. Tolerance Match (Amount/Date)
    4. Exception Classification & Risk Scoring (Level 2)
    """

    def __init__(self, config: Dict):
        self.config = config
        self.tol_amount = config['reconciliation']['tolerances']['amount_threshold']
        self.tol_days = config['reconciliation']['tolerances']['date_offset_days']
        self.risk_scorer = RiskScorer(config)

    def run(self, df_a: pd.DataFrame, df_b: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        logger.info("Starting Advanced Reconciliation Engine...")
        
        # --- STAGE 1: EXACT MATCH ---
        join_keys = self.config['reconciliation']['matching_rules']['exact_match_columns']
        merged = pd.merge(df_a, df_b, on=join_keys, how='outer', indicator=True, suffixes=('_a', '_b'))
        
        exact_matches = merged[merged['_merge'] == 'both'].copy()
        exact_matches['match_type'] = 'EXACT'
        exact_matches['status'] = 'RECONCILED'
        exact_matches['match_score'] = 100.0
        exact_matches['risk_score'] = 0.0
        
        unmatched = merged[merged['_merge'] != 'both'].copy()
        logger.info(f"Stage 1 (Exact) Complete. Matches: {len(exact_matches)}")
        
        # Prepare for Advanced Matching
        left_unmatched = unmatched[unmatched['_merge'] == 'left_only'].dropna(axis=1, how='all')
        right_unmatched = unmatched[unmatched['_merge'] == 'right_only'].dropna(axis=1, how='all')
        
        # We need working copies with clean indices
        left_recs = left_unmatched.to_dict('records')
        right_recs = right_unmatched.to_dict('records')
        
        # Helper to track matched IDs in Stages 2 & 3 to avoid duplicates
        matched_ids_a = set()
        matched_ids_b = set()
        
        advanced_matches = []
        exceptions = []

        # Optimization: Build lookup for Right side by Amount to reduce search space for fuzzy logic
        # (Naive O(N*M) is too slow for "Enterprise", so we bucket or use simple loops for this demo)
        
        # --- STAGE 2: FUZZY ID & TOLERANCE MATCHING ---
        # Strategy: Iterate interactions. 
        # For this demo, we iterate Left and look for candidates in Right.
        
        # Convert Right to a list of IDs for fuzzy lookup
        right_ids = [r['txn_ref_id'] for r in right_recs]
        right_id_map = {r['txn_ref_id']: r for r in right_recs}
        
        for row_a in left_recs:
            id_a = row_a['txn_ref_id']
            amount_a = row_a['amount']
            date_a = row_a['value_date'] 
            # source_system is in data, but not join key -> suffixed
            # verification: check config match keys in main.py/settings logic. 
            # In Settings: exact_match_columns: [txn_ref_id, amount, value_date, currency]
            # So source_system creates source_system_a/_b. Correct.
            
            best_match_id, score, _ = process.extractOne(id_a, right_ids, scorer=fuzz.ratio) or (None, 0, 0)
            
            match_candidate = None
            match_type = None
            
            if best_match_id and score >= 85:
                # Potential Candidate found by ID
                match_candidate = right_id_map[best_match_id]
                
                # Check constraints (Amount Tolerance)
                amt_diff = abs(amount_a - match_candidate['amount'])
                date_diff = abs((row_a['value_date'] - match_candidate['value_date']).days)
                
                is_id_exact = (score == 100)
                
                if amt_diff <= self.tol_amount and date_diff <= self.tol_days:
                    # It's a match!
                     if is_id_exact:
                         match_type = 'TOLERANCE' # ID exact, Amt/Date diff
                     else:
                         match_type = 'FUZZY_ID' # ID fuzzy
                         
                     # Record Match
                     advanced_matches.append({
                         'txn_ref_id': id_a, # Use A's ID
                         'txn_id_source_b': match_candidate['txn_ref_id'],
                         'amount': amount_a,
                         'value_date': row_a['value_date'],
                         'match_type': match_type,
                         'match_score': score,
                         'status': 'NEAR_MATCH_REVIEW',
                         'risk_score': 0.0 # Low risk
                     })
                     
                     matched_ids_a.add(id_a)
                     matched_ids_b.add(match_candidate['txn_ref_id'])
                     continue # Move to next A
            
            # If we are here, no match found for A. It's an exception.
            # But wait, we iterate all A.
            
        # --- STAGE 3: EXCEPTION CLASSIFICATION (Advanced) ---
        # Remaining A
        for row_a in left_recs:
            if row_a['txn_ref_id'] in matched_ids_a:
                continue
            
            # If check if ID exists in Right (Exact ID) but failed tolerance
            # (In my logic above, if id matched 100 but tol failed, match_candidate mismatch)
            # We can refined query:
            
            ex_code = ExceptionCode.MISSING_IN_SOURCE_B.value
            desc = "Transaction missing in Gateway"
            
            # Check if ID exists in B but Amount/Date mismatch (Break)
            # Simple check:
            if row_a['txn_ref_id'] in right_id_map:
                 rb = right_id_map[row_a['txn_ref_id']]
                 if rb['txn_ref_id'] not in matched_ids_b:
                     # It's a text-book break
                     ex_code = ExceptionCode.AMOUNT_MISMATCH.value # Generalize
                     desc = f"Break: Amt A {row_a['amount']} vs B {rb['amount']}"
                     matched_ids_b.add(rb['txn_ref_id']) # Mark B as 'handled' (as part of this break)
            
            # Calc Risk
            r_score = self.risk_scorer.calculate_score(row_a['amount'], ex_code)
            severity = RuleEngine.evaluate_severity(r_score, ex_code)
            
            exceptions.append({
                'txn_ref_id': row_a['txn_ref_id'],
                'amount': row_a['amount'],
                'source_system': 'SOURCE_A',
                'exception_code': ex_code,
                'severity': severity.value,
                'risk_score': r_score,
                'description': desc,
                'suggested_resolution': RuleEngine.get_resolution_suggestion(ex_code)
            })

        # Remaining B (not matched to A or marked as break)
        for row_b in right_recs:
            if row_b['txn_ref_id'] in matched_ids_b:
                continue
                
            ex_code = ExceptionCode.MISSING_IN_SOURCE_A.value
            r_score = self.risk_scorer.calculate_score(row_b['amount'], ex_code)
            severity = RuleEngine.evaluate_severity(r_score, ex_code)
            
            exceptions.append({
                'txn_ref_id': row_b['txn_ref_id'],
                'amount': row_b['amount'],
                'source_system': 'SOURCE_B',
                'exception_code': ex_code,
                'severity': severity.value,
                'risk_score': r_score,
                'description': "Transaction missing in Core Ledger",
                'suggested_resolution': RuleEngine.get_resolution_suggestion(ex_code)
            })

        # Consolidate
        df_adv = pd.DataFrame(advanced_matches)
        
        final_matches = pd.concat([exact_matches, df_adv], ignore_index=True)

        # --- ML ANOMALY DETECTION (Level 3) ---
        from src.ml_models import AnomalyDetector
        
        ml_detector = AnomalyDetector()
        
        # Train on successful matches (Normal Behavior)
        if not final_matches.empty:
            ml_detector.train(final_matches)
            
        df_ex = pd.DataFrame(exceptions)

        # Score Exceptions
        if not df_ex.empty:
            scores = ml_detector.predict_anomaly_score(df_ex)
            df_ex['ml_anomaly_score'] = scores
        
        logger.info(f"Engine Complete. Matches: {len(final_matches)}, Exceptions: {len(df_ex)}")
        return final_matches, df_ex
