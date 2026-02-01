from typing import Dict, List

class XAIExplainer:
    """
    Explainable AI Module.
    Generates human-readable rationales and feature attributions for audit logs.
    Simulates SHAP (Shapley Additive Explanations) values heuristically.
    """
    
    @staticmethod
    def explain_multimodal_decision(decision: Dict, features: List[float]) -> Dict:
        """
        Returns a dictionary of feature contributions.
        Features Order: [amt_log_diff, date_diff, ref_lev, ref_token, ref_partial, exact_amt, day_match]
        """
        # Heuristic Attribution Logic
        # We assign 'points' based on how much a feature supports 'Match (1)' vs 'No Match (0)'
        
        contributions = {}
        
        # 1. Amount (Negative if diff exists, Positive if exact)
        if features[5] == 1.0: # Exact Amt Match
            contributions['Amount Exact'] = +0.50
        else:
            contributions['Amount Delta'] = -1.0 * features[0] # Log diff penalty
            
        # 2. Date
        if features[1] == 0:
            contributions['Date Exact'] = +0.20
        else:
            contributions['Date Mismatch'] = -0.10 * features[1] # Penalty per day
            
        # 3. ID Similarity (0-100)
        # Normalize 50 as neutral. >50 positive, <50 negative
        lev_score = features[2]
        if lev_score > 90:
            contributions['ID Similarity (High)'] = +0.40
        elif lev_score > 70:
            contributions['ID Similarity (Med)'] = +0.10
        else:
            contributions['ID Similarity (Low)'] = -0.30

        # Sort by absolute impact
        sorted_attribs = dict(sorted(contributions.items(), key=lambda item: abs(item[1]), reverse=True))
        
        return {
            "rationale": sorted_attribs,
            "decision_score": decision['score']
        }
