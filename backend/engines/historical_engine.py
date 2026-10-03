"""
ASTRA-Q Historical Comparison Engine
=======================================
Compares current lot distribution against historical lots to detect
population-level shifts that lot-relative screening would miss.

Methods:
  - Median comparison
  - MAD/spread comparison
  - Kolmogorov-Smirnov test
  - Distribution shift detection
  - Out-of-domain / novelty check

If the current lot is unlike historical data, the system reports
reduced confidence rather than acting overconfident.
"""

import numpy as np
from scipy import stats as sp_stats
from typing import Dict, List, Any


def compare_to_historical(
    current_lot_final_values: np.ndarray,
    historical_lots: Dict[str, Dict],
    current_lot_id: str = "LOT-24A",
) -> Dict[str, Any]:
    """
    Compare current lot distribution against historical lots.
    
    Args:
        current_lot_final_values: array of final resistance values for current lot
        historical_lots: dict of historical lot statistics and values
        current_lot_id: ID of current lot
    
    Returns:
        Dict with comparison results, shift detection, and confidence adjustment
    """
    if len(current_lot_final_values) < 5:
        return {
            "status": "INSUFFICIENT_DATA",
            "message": "Fewer than 5 final values available for comparison",
            "lot_comparisons": [],
            "population_shift": None,
            "confidence_adjustment": None,
        }
    
    current_median = float(np.median(current_lot_final_values))
    current_mad = float(np.median(np.abs(current_lot_final_values - current_median)))
    current_mean = float(np.mean(current_lot_final_values))
    current_std = float(np.std(current_lot_final_values))
    
    if current_mad < 1e-6:
        current_mad = 0.01
    
    # Compare against each historical lot
    lot_comparisons = []
    combined_historical = []
    
    for lot_id, lot_data in historical_lots.items():
        hist_values = np.array(lot_data["final_values"])
        combined_historical.extend(hist_values.tolist())
        
        hist_median = float(np.median(hist_values))
        hist_mad = float(np.median(np.abs(hist_values - hist_median)))
        if hist_mad < 1e-6:
            hist_mad = 0.01
        
        # KS test
        ks_stat, ks_pvalue = sp_stats.ks_2samp(current_lot_final_values, hist_values)
        
        # Median difference in historical MAD units
        median_diff = current_median - hist_median
        median_diff_mad = median_diff / (hist_mad * 1.4826) if hist_mad > 0 else 0
        
        # Spread comparison
        spread_ratio = current_mad / hist_mad if hist_mad > 0 else 1.0
        
        lot_comparisons.append({
            "lot_id": lot_id,
            "historical_median": round(hist_median, 4),
            "historical_mad": round(hist_mad, 4),
            "historical_mean": round(float(np.mean(hist_values)), 4),
            "historical_std": round(float(np.std(hist_values)), 4),
            "historical_n": len(hist_values),
            "current_median": round(current_median, 4),
            "current_mad": round(current_mad, 4),
            "median_difference": round(median_diff, 4),
            "median_diff_in_mad": round(float(median_diff_mad), 4),
            "spread_ratio": round(float(spread_ratio), 4),
            "ks_statistic": round(float(ks_stat), 4),
            "ks_p_value": round(float(ks_pvalue), 6),
            "significant_shift": bool(ks_pvalue < 0.01),
        })
    
    # Compare against combined historical pool
    combined_historical = np.array(combined_historical)
    combined_median = float(np.median(combined_historical))
    combined_mad = float(np.median(np.abs(combined_historical - combined_median)))
    if combined_mad < 1e-6:
        combined_mad = 0.01
    
    ks_combined_stat, ks_combined_p = sp_stats.ks_2samp(
        current_lot_final_values, combined_historical
    )
    
    overall_median_diff = current_median - combined_median
    overall_median_diff_mad = overall_median_diff / (combined_mad * 1.4826)
    
    # Detect population shift
    population_shift_detected = bool(
        ks_combined_p < 0.01 or
        abs(overall_median_diff_mad) > 2.0
    )
    
    shift_severity = "NONE"
    if population_shift_detected:
        if abs(overall_median_diff_mad) > 3.0 or ks_combined_p < 0.001:
            shift_severity = "SIGNIFICANT"
        else:
            shift_severity = "MODERATE"
    
    # Out-of-domain check
    # Are there values in the current lot that fall outside the historical range?
    hist_min = float(np.min(combined_historical))
    hist_max = float(np.max(combined_historical))
    n_out_of_range = int(np.sum(
        (current_lot_final_values < hist_min - combined_mad) |
        (current_lot_final_values > hist_max + combined_mad)
    ))
    
    # Confidence adjustment
    if population_shift_detected:
        confidence_note = "REDUCED — Current lot distribution differs from historical baseline"
    elif n_out_of_range > 5:
        confidence_note = "REDUCED — Multiple values outside historical range"
    else:
        confidence_note = "NORMAL — Current lot consistent with historical baseline"
    
    # Distribution summaries for visualization
    current_distribution = {
        "values": current_lot_final_values.tolist(),
        "median": round(current_median, 4),
        "mad": round(current_mad, 4),
        "mean": round(current_mean, 4),
        "std": round(current_std, 4),
        "min": round(float(np.min(current_lot_final_values)), 4),
        "max": round(float(np.max(current_lot_final_values)), 4),
        "q25": round(float(np.percentile(current_lot_final_values, 25)), 4),
        "q75": round(float(np.percentile(current_lot_final_values, 75)), 4),
        "n": len(current_lot_final_values),
    }
    
    historical_distribution = {
        "combined_values": combined_historical.tolist(),
        "median": round(float(combined_median), 4),
        "mad": round(float(combined_mad), 4),
        "mean": round(float(np.mean(combined_historical)), 4),
        "std": round(float(np.std(combined_historical)), 4),
        "n": len(combined_historical),
    }
    
    return {
        "status": "COMPLETE",
        "current_lot_id": current_lot_id,
        "lot_comparisons": lot_comparisons,
        "population_shift": {
            "detected": population_shift_detected,
            "severity": shift_severity,
            "overall_median_diff": round(overall_median_diff, 4),
            "overall_median_diff_mad": round(float(overall_median_diff_mad), 4),
            "ks_statistic": round(float(ks_combined_stat), 4),
            "ks_p_value": round(float(ks_combined_p), 6),
            "n_out_of_range": n_out_of_range,
        },
        "confidence_adjustment": confidence_note,
        "current_distribution": current_distribution,
        "historical_distribution": historical_distribution,
    }
