"""
ASTRA-Q Screening Engine
==========================
Performs lot-relative and absolute screening using robust statistics.

Methods:
  - Absolute specification check (pass/fail against limits)
  - Robust lot-relative screening (median, MAD, robust Z-score)
  - Delta screening (measurement-to-measurement changes)

Outputs transparent evidence, not opaque scores.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any


# Screening thresholds
ROBUST_Z_THRESHOLD = 3.0  # Flag at >3 MAD
ROBUST_Z_WATCH = 2.0      # Watch at >2 MAD


def screen_lot(clean_df: pd.DataFrame, spec_low: float, spec_high: float) -> Dict[str, Any]:
    """
    Perform complete screening analysis on a lot of components.
    
    Args:
        clean_df: Cleaned burn-in data (from validation engine)
        spec_low: Lower specification limit
        spec_high: Upper specification limit
    
    Returns:
        Dict with:
        - lot_baseline: lot-level statistics
        - component_results: per-component screening results
        - screening_summary: counts
    """
    # Get latest readings for each component
    max_hour = clean_df["burn_in_hour"].max()
    latest = clean_df[
        (clean_df["burn_in_hour"] == max_hour) &
        (clean_df["parameter"] == "resistance")
    ].copy()
    
    if len(latest) == 0:
        return {"error": "No valid data at final measurement point"}
    
    # Compute lot baseline using robust statistics
    lot_values = latest["value"].values
    lot_median = float(np.median(lot_values))
    lot_mad = float(np.median(np.abs(lot_values - lot_median)))
    
    # Avoid zero MAD (would cause division by zero)
    if lot_mad < 1e-6:
        lot_mad = 0.01
    
    # Scale factor for MAD -> equivalent std dev (for normal distribution)
    mad_scale = 1.4826
    lot_robust_std = lot_mad * mad_scale
    
    lot_baseline = {
        "lot_median": round(lot_median, 4),
        "lot_mad": round(lot_mad, 4),
        "lot_robust_std": round(lot_robust_std, 4),
        "lot_mean": round(float(np.mean(lot_values)), 4),
        "lot_std": round(float(np.std(lot_values)), 4),
        "lot_min": round(float(np.min(lot_values)), 4),
        "lot_max": round(float(np.max(lot_values)), 4),
        "lot_q25": round(float(np.percentile(lot_values, 25)), 4),
        "lot_q75": round(float(np.percentile(lot_values, 75)), 4),
        "n_components": len(lot_values),
        "spec_low": spec_low,
        "spec_high": spec_high,
        "screening_boundary_low": round(lot_median - ROBUST_Z_THRESHOLD * lot_mad * mad_scale, 4),
        "screening_boundary_high": round(lot_median + ROBUST_Z_THRESHOLD * lot_mad * mad_scale, 4),
    }
    
    # Screen each component
    component_results = {}
    for _, row in latest.iterrows():
        comp_id = row["component_id"]
        value = row["value"]
        
        # Absolute specification check
        spec_pass = spec_low <= value <= spec_high
        spec_margin_low = value - spec_low
        spec_margin_high = spec_high - value
        
        # Robust Z-score (lot-relative)
        robust_z = (value - lot_median) / (lot_mad * mad_scale)
        
        # Deviation from median in MAD units
        mad_deviation = (value - lot_median) / lot_mad if lot_mad > 0 else 0
        
        # Determine screening status
        if not spec_pass:
            screen_status = "SPEC_FAIL"
        elif abs(robust_z) > ROBUST_Z_THRESHOLD:
            screen_status = "LOT_OUTLIER"
        elif abs(robust_z) > ROBUST_Z_WATCH:
            screen_status = "LOT_WATCH"
        else:
            screen_status = "PASS"
        
        # Get full trajectory for this component
        comp_trajectory = clean_df[
            (clean_df["component_id"] == comp_id) &
            (clean_df["parameter"] == "resistance")
        ].sort_values("burn_in_hour")
        
        trajectory_values = comp_trajectory["value"].values.tolist()
        trajectory_hours = comp_trajectory["burn_in_hour"].values.tolist()
        
        # Delta screening (largest hour-to-hour change)
        if len(trajectory_values) > 1:
            deltas = np.diff(trajectory_values)
            max_delta = float(np.max(np.abs(deltas)))
            max_delta_hour = int(trajectory_hours[np.argmax(np.abs(deltas)) + 1])
        else:
            max_delta = 0.0
            max_delta_hour = 0
        
        component_results[comp_id] = {
            "component_id": comp_id,
            "lot_id": row.get("lot_id", ""),
            "board_id": row.get("board_id", ""),
            "channel_id": row.get("channel_id", ""),
            "current_value": round(float(value), 4),
            "spec_pass": bool(spec_pass),
            "spec_margin_low": round(float(spec_margin_low), 4),
            "spec_margin_high": round(float(spec_margin_high), 4),
            "lot_median": lot_baseline["lot_median"],
            "lot_mad": lot_baseline["lot_mad"],
            "robust_z_score": round(float(robust_z), 4),
            "mad_deviation": round(float(mad_deviation), 4),
            "deviation_from_median": round(float(value - lot_median), 4),
            "screen_status": screen_status,
            "max_delta": round(float(max_delta), 4),
            "max_delta_hour": max_delta_hour,
            "trajectory_values": [round(v, 4) for v in trajectory_values],
            "trajectory_hours": trajectory_hours,
            "n_observations": len(trajectory_values),
        }
    
    # Summary
    statuses = [r["screen_status"] for r in component_results.values()]
    summary = {
        "total_screened": len(statuses),
        "pass": statuses.count("PASS"),
        "lot_outlier": statuses.count("LOT_OUTLIER"),
        "lot_watch": statuses.count("LOT_WATCH"),
        "spec_fail": statuses.count("SPEC_FAIL"),
    }
    
    return {
        "lot_baseline": lot_baseline,
        "component_results": component_results,
        "screening_summary": summary,
    }
