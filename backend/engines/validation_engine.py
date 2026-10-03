"""
ASTRA-Q Validation Engine
===========================
Checks data quality before any downstream analysis.

Detects:
  - Missing values
  - Duplicate readings
  - Impossible/out-of-range values
  - Timestamp anomalies
  - Synchronized events across channels
  - Reference unit behavior anomalies

Outputs per-component and dataset-level validation status:
  VALID | SUSPECT | INVALID | INSUFFICIENT
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple


def validate_dataset(burn_in_df: pd.DataFrame, reference_df: pd.DataFrame) -> Dict[str, Any]:
    """
    Run full data validation suite.
    
    Returns:
        Dict with validation results including:
        - dataset_status: overall dataset quality
        - component_validity: per-component status
        - issues: list of detected issues
        - summary: counts of each issue type
    """
    issues = []
    component_validity = {}
    
    # 1. Check for missing values
    missing_mask = burn_in_df["value"].isna()
    n_missing = missing_mask.sum()
    if n_missing > 0:
        missing_comps = burn_in_df[missing_mask]["component_id"].unique().tolist()
        issues.append({
            "type": "MISSING_VALUES",
            "severity": "WARNING",
            "count": int(n_missing),
            "affected_components": missing_comps,
            "message": f"{n_missing} missing measurement(s) detected across {len(missing_comps)} component(s)"
        })
        for comp in missing_comps:
            component_validity.setdefault(comp, []).append("MISSING_VALUES")
    
    # 2. Check for duplicates
    dup_cols = ["component_id", "burn_in_hour", "parameter"]
    duplicates = burn_in_df[burn_in_df.duplicated(subset=dup_cols, keep=False)]
    n_dups = len(duplicates) // 2  # pairs
    if n_dups > 0:
        dup_comps = duplicates["component_id"].unique().tolist()
        issues.append({
            "type": "DUPLICATE_READINGS",
            "severity": "WARNING",
            "count": int(n_dups),
            "affected_components": dup_comps,
            "message": f"{n_dups} duplicate reading pair(s) detected"
        })
        for comp in dup_comps:
            component_validity.setdefault(comp, []).append("DUPLICATE_READINGS")
    
    # 3. Check for impossible values
    valid_data = burn_in_df[burn_in_df["value"].notna()]
    impossible_mask = (valid_data["value"] < 0) | (valid_data["value"] > 100)
    n_impossible = impossible_mask.sum()
    if n_impossible > 0:
        imp_comps = valid_data[impossible_mask]["component_id"].unique().tolist()
        issues.append({
            "type": "IMPOSSIBLE_VALUES",
            "severity": "CRITICAL",
            "count": int(n_impossible),
            "affected_components": imp_comps,
            "message": f"{n_impossible} physically impossible value(s) detected (negative or >100Ω)"
        })
        for comp in imp_comps:
            component_validity.setdefault(comp, []).append("IMPOSSIBLE_VALUES")
    
    # 4. Check timestamp ordering
    for comp_id in burn_in_df["component_id"].unique():
        comp_data = burn_in_df[burn_in_df["component_id"] == comp_id].sort_values("burn_in_hour")
        hours = comp_data["burn_in_hour"].values
        if len(hours) > 1:
            diffs = np.diff(hours)
            if np.any(diffs <= 0):
                issues.append({
                    "type": "TIMESTAMP_ANOMALY",
                    "severity": "WARNING",
                    "count": 1,
                    "affected_components": [comp_id],
                    "message": f"Non-monotonic timestamps for {comp_id}"
                })
                component_validity.setdefault(comp_id, []).append("TIMESTAMP_ANOMALY")
    
    # 5. Check for synchronized events (>5 components shifting at same hour)
    sync_events = _detect_synchronized_events(burn_in_df)
    if sync_events:
        for event in sync_events:
            issues.append({
                "type": "SYNCHRONIZED_EVENT",
                "severity": "INFO",
                "count": event["n_affected"],
                "affected_components": event["components"],
                "hour": event["hour"],
                "channels": event["channels"],
                "message": f"Synchronized change at hour {event['hour']} "
                           f"affecting {event['n_affected']} components"
            })
    
    # 6. Check reference unit stability
    ref_issues = _check_reference_stability(reference_df)
    issues.extend(ref_issues)
    
    # 7. Compute component-level observation counts
    insufficient_comps = []
    for comp_id in burn_in_df["component_id"].unique():
        comp_valid = burn_in_df[
            (burn_in_df["component_id"] == comp_id) &
            (burn_in_df["value"].notna()) &
            (~((burn_in_df["value"] < 0) | (burn_in_df["value"] > 100)))
        ]
        n_valid = len(comp_valid)
        if n_valid < 5:
            insufficient_comps.append(comp_id)
            component_validity.setdefault(comp_id, []).append("INSUFFICIENT_DATA")
    
    if insufficient_comps:
        issues.append({
            "type": "INSUFFICIENT_OBSERVATIONS",
            "severity": "WARNING",
            "count": len(insufficient_comps),
            "affected_components": insufficient_comps,
            "message": f"{len(insufficient_comps)} component(s) with fewer than 5 valid observations"
        })
    
    # Determine overall status
    has_critical = any(i["severity"] == "CRITICAL" for i in issues)
    has_warning = any(i["severity"] == "WARNING" for i in issues)
    
    # Per-component final status
    all_components = burn_in_df["component_id"].unique().tolist()
    comp_statuses = {}
    for comp in all_components:
        comp_issues = component_validity.get(comp, [])
        if "IMPOSSIBLE_VALUES" in comp_issues:
            comp_statuses[comp] = "INVALID"
        elif "INSUFFICIENT_DATA" in comp_issues:
            comp_statuses[comp] = "INSUFFICIENT"
        elif len(comp_issues) > 0:
            comp_statuses[comp] = "SUSPECT"
        else:
            comp_statuses[comp] = "VALID"
    
    # Clean data (remove impossible, deduplicate, drop NaN)
    clean_df = burn_in_df.copy()
    clean_df = clean_df[clean_df["value"].notna()]
    clean_df = clean_df[(clean_df["value"] >= 0) & (clean_df["value"] <= 100)]
    clean_df = clean_df.drop_duplicates(subset=["component_id", "burn_in_hour", "parameter"], keep="first")
    clean_df = clean_df.sort_values(["component_id", "burn_in_hour"]).reset_index(drop=True)
    
    summary = {
        "total_records": len(burn_in_df),
        "clean_records": len(clean_df),
        "missing_values": int(n_missing),
        "duplicates": int(n_dups),
        "impossible_values": int(n_impossible),
        "insufficient_components": len(insufficient_comps),
        "synchronized_events": len(sync_events),
    }
    
    return {
        "dataset_status": "INVALID" if has_critical else ("SUSPECT" if has_warning else "VALID"),
        "component_validity": comp_statuses,
        "issues": issues,
        "summary": summary,
        "clean_data": clean_df,
    }


def _detect_synchronized_events(df: pd.DataFrame, threshold: int = 10) -> List[Dict]:
    """Detect hours where many components show large changes simultaneously."""
    events = []
    valid_df = df[(df["value"].notna()) & (df["parameter"] == "resistance")].copy()
    valid_df = valid_df.sort_values(["component_id", "burn_in_hour"])
    
    # Compute per-component hour-to-hour changes
    valid_df["prev_value"] = valid_df.groupby("component_id")["value"].shift(1)
    valid_df["delta"] = (valid_df["value"] - valid_df["prev_value"]).abs()
    valid_df = valid_df.dropna(subset=["delta"])
    
    # For each hour, count components with large deltas
    overall_median_delta = valid_df["delta"].median()
    overall_mad_delta = np.median(np.abs(valid_df["delta"] - overall_median_delta))
    if overall_mad_delta < 1e-6:
        overall_mad_delta = 0.01
    
    large_delta_threshold = overall_median_delta + 3 * overall_mad_delta * 1.4826
    
    for hour in valid_df["burn_in_hour"].unique():
        hour_data = valid_df[valid_df["burn_in_hour"] == hour]
        large_deltas = hour_data[hour_data["delta"] > large_delta_threshold]
        if len(large_deltas) >= threshold:
            events.append({
                "hour": int(hour),
                "n_affected": len(large_deltas),
                "components": large_deltas["component_id"].unique().tolist(),
                "channels": large_deltas["channel_id"].unique().tolist(),
            })
    
    return events


def _check_reference_stability(ref_df: pd.DataFrame) -> List[Dict]:
    """Check if reference units show unexpected shifts."""
    issues = []
    for ref_id in ref_df["reference_unit"].unique():
        ref_data = ref_df[ref_df["reference_unit"] == ref_id].sort_values("burn_in_hour")
        values = ref_data["value"].values
        if len(values) < 5:
            continue
        
        median_val = np.median(values)
        mad_val = np.median(np.abs(values - median_val))
        if mad_val < 1e-6:
            mad_val = 0.01
        
        # Check for step changes in reference
        diffs = np.abs(np.diff(values))
        large_changes = diffs > median_val * 0.01  # >1% change
        
        if np.any(large_changes):
            change_hours = ref_data["burn_in_hour"].values[1:][large_changes]
            issues.append({
                "type": "REFERENCE_SHIFT",
                "severity": "INFO",
                "count": int(np.sum(large_changes)),
                "affected_components": [],
                "reference_unit": ref_id,
                "board_id": ref_data["board_id"].iloc[0],
                "hours": change_hours.tolist(),
                "message": f"Reference unit {ref_id} shows shift at hour(s) {change_hours.tolist()}"
            })
    
    return issues
