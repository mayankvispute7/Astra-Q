"""
ASTRA-Q Attribution Engine
============================
Determines whether an anomaly is more consistent with:
  - Component-level behavior
  - System/test-equipment behavior
  - Lot-level behavior
  - Mixed/confounded patterns

Analyzes evidence across:
  - Board patterns
  - Channel patterns
  - Reference unit behavior
  - Temporal synchronization
  - Other components on same channel/board

Outputs transparent evidence weights, NOT a black-box classifier.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple
from scipy import stats


def attribute_anomalies(
    clean_df: pd.DataFrame,
    reference_df: pd.DataFrame,
    component_results: Dict[str, Dict],
    drift_results: Dict[str, Dict],
    validation_result: Dict[str, Any],
) -> Dict[str, Dict]:
    """
    Attribute flagged components to component/system/lot/mixed patterns.
    
    Returns per-component attribution with evidence breakdown.
    """
    attribution_results = {}
    
    # Get flagged components (anything not PASS in screening or not STABLE in drift)
    flagged = {}
    for comp_id, comp_data in component_results.items():
        is_flagged = (
            comp_data["screen_status"] != "PASS" or
            drift_results.get(comp_id, {}).get("drift_class", "STABLE") not in ("STABLE",)
        )
        if is_flagged:
            flagged[comp_id] = comp_data
    
    # For each flagged component, analyze evidence
    for comp_id, comp_data in flagged.items():
        channel_id = comp_data["channel_id"]
        board_id = comp_data["board_id"]
        
        evidence = {
            "component": _component_evidence(comp_id, comp_data, drift_results),
            "channel": _channel_evidence(comp_id, channel_id, clean_df, component_results, drift_results),
            "board": _board_evidence(comp_id, board_id, clean_df, component_results, drift_results),
            "reference": _reference_evidence(board_id, reference_df),
            "temporal": _temporal_evidence(comp_id, clean_df, validation_result),
        }
        
        # Determine attribution
        attribution = _determine_attribution(evidence)
        
        attribution_results[comp_id] = {
            "component_id": comp_id,
            "channel_id": channel_id,
            "board_id": board_id,
            "attribution": attribution["label"],
            "confidence": attribution["confidence"],
            "evidence": evidence,
            "evidence_summary": attribution["summary"],
            "recommendation": attribution["recommendation"],
        }
    
    # Also detect common-mode patterns across the whole lot
    common_mode = _detect_common_mode_patterns(clean_df, component_results, drift_results)
    
    # For non-flagged components, mark as normal
    for comp_id in component_results:
        if comp_id not in attribution_results:
            attribution_results[comp_id] = {
                "component_id": comp_id,
                "attribution": "NORMAL",
                "confidence": "HIGH",
                "evidence": {},
                "evidence_summary": "No significant anomaly detected",
                "recommendation": None,
            }
    
    return {
        "component_attributions": attribution_results,
        "common_mode_patterns": common_mode,
    }


def _component_evidence(comp_id: str, comp_data: Dict, drift_results: Dict) -> Dict:
    """Evaluate evidence that the anomaly is component-specific."""
    drift = drift_results.get(comp_id, {})
    
    score = 0
    indicators = []
    
    # High lot-relative deviation
    mad_dev = abs(comp_data.get("mad_deviation", 0))
    if mad_dev > 3.0:
        score += 3
        indicators.append(f"+{mad_dev:.1f} MAD from lot median")
    elif mad_dev > 2.0:
        score += 1
        indicators.append(f"+{mad_dev:.1f} MAD from lot median (moderate)")
    
    # Drift
    drift_class = drift.get("drift_class", "STABLE")
    if drift_class in ("ACCELERATING_DRIFT", "GRADUAL_DRIFT"):
        score += 2
        indicators.append(f"Drift: {drift_class}")
    elif drift_class == "STEP_CHANGE":
        score += 1
        indicators.append("Step change detected")
    
    return {
        "score": score,
        "indicators": indicators,
        "strength": "STRONG" if score >= 4 else ("MODERATE" if score >= 2 else "WEAK"),
    }


def _channel_evidence(comp_id: str, channel_id: str, clean_df: pd.DataFrame,
                       component_results: Dict, drift_results: Dict) -> Dict:
    """Check if other components on same channel show similar patterns."""
    channel_comps = clean_df[clean_df["channel_id"] == channel_id]["component_id"].unique()
    peers = [c for c in channel_comps if c != comp_id]
    
    if len(peers) == 0:
        return {"score": 0, "indicators": ["No channel peers"], "strength": "UNKNOWN",
                "n_peers": 0, "n_affected": 0}
    
    n_affected = 0
    for peer in peers:
        peer_data = component_results.get(peer, {})
        peer_drift = drift_results.get(peer, {})
        if (peer_data.get("screen_status", "PASS") != "PASS" or
            peer_drift.get("drift_class", "STABLE") not in ("STABLE",)):
            n_affected += 1
    
    ratio = n_affected / len(peers)
    
    score = 0
    indicators = []
    
    if ratio > 0.5:
        score += 3
        indicators.append(f"{n_affected}/{len(peers)} channel peers also affected — SYSTEM pattern")
    elif ratio > 0.2:
        score += 1
        indicators.append(f"{n_affected}/{len(peers)} channel peers affected")
    else:
        indicators.append(f"Channel peers: {n_affected}/{len(peers)} affected — component-specific")
    
    return {
        "score": score,
        "indicators": indicators,
        "strength": "STRONG" if score >= 3 else ("MODERATE" if score >= 1 else "WEAK"),
        "n_peers": len(peers),
        "n_affected": n_affected,
    }


def _board_evidence(comp_id: str, board_id: str, clean_df: pd.DataFrame,
                     component_results: Dict, drift_results: Dict) -> Dict:
    """Check if other components on same board show similar patterns."""
    board_comps = clean_df[clean_df["board_id"] == board_id]["component_id"].unique()
    peers = [c for c in board_comps if c != comp_id]
    
    if len(peers) == 0:
        return {"score": 0, "indicators": ["No board peers"], "strength": "UNKNOWN",
                "n_peers": 0, "n_affected": 0}
    
    n_affected = 0
    for peer in peers:
        peer_data = component_results.get(peer, {})
        peer_drift = drift_results.get(peer, {})
        if (peer_data.get("screen_status", "PASS") != "PASS" or
            peer_drift.get("drift_class", "STABLE") not in ("STABLE",)):
            n_affected += 1
    
    ratio = n_affected / len(peers)
    
    score = 0
    indicators = []
    
    if ratio > 0.5:
        score += 2
        indicators.append(f"{n_affected}/{len(peers)} board peers affected — possible board-level cause")
    elif ratio > 0.2:
        score += 1
        indicators.append(f"{n_affected}/{len(peers)} board peers affected")
    else:
        indicators.append(f"Board peers: {n_affected}/{len(peers)} affected")
    
    return {
        "score": score,
        "indicators": indicators,
        "strength": "STRONG" if score >= 2 else ("MODERATE" if score >= 1 else "WEAK"),
        "n_peers": len(peers),
        "n_affected": n_affected,
    }


def _reference_evidence(board_id: str, reference_df: pd.DataFrame) -> Dict:
    """Check reference unit stability on this board."""
    board_refs = reference_df[reference_df["board_id"] == board_id]
    
    if len(board_refs) == 0:
        return {"score": 0, "indicators": ["No reference data"], "strength": "UNKNOWN",
                "reference_stable": None}
    
    values = board_refs.sort_values("burn_in_hour")["value"].values
    
    if len(values) < 5:
        return {"score": 0, "indicators": ["Insufficient reference data"], "strength": "UNKNOWN",
                "reference_stable": None}
    
    # Check reference stability
    median_ref = np.median(values)
    mad_ref = np.median(np.abs(values - median_ref))
    if mad_ref < 1e-6:
        mad_ref = 0.01
    
    # Check for step changes
    diffs = np.abs(np.diff(values))
    max_diff = np.max(diffs)
    
    reference_shifted = max_diff > 0.05  # >50mΩ step in reference
    
    score = 0
    indicators = []
    
    if reference_shifted:
        score += 3
        indicators.append(f"Reference unit SHIFTED (max Δ={max_diff:.4f}Ω) — SYSTEM evidence")
    else:
        indicators.append(f"Reference unit STABLE (max Δ={max_diff:.4f}Ω)")
    
    return {
        "score": score,
        "indicators": indicators,
        "strength": "STRONG" if reference_shifted else "WEAK",
        "reference_stable": not reference_shifted,
        "max_reference_shift": round(float(max_diff), 4),
    }


def _temporal_evidence(comp_id: str, clean_df: pd.DataFrame,
                        validation_result: Dict) -> Dict:
    """Check for temporal synchronization with other components."""
    sync_events = [
        ev for ev in validation_result.get("issues", [])
        if ev.get("type") == "SYNCHRONIZED_EVENT"
    ]
    
    in_sync_event = False
    sync_details = []
    
    for event in sync_events:
        if comp_id in event.get("affected_components", []):
            in_sync_event = True
            sync_details.append({
                "hour": event.get("hour", 0),
                "n_affected": event.get("count", len(event.get("affected_components", []))),
                "channels": event.get("channels", []),
            })
    
    score = 0
    indicators = []
    
    if in_sync_event:
        score += 3
        for sd in sync_details:
            indicators.append(
                f"Part of synchronized event at hour {sd['hour']} "
                f"affecting {sd['n_affected']} components"
            )
    else:
        indicators.append("No temporal synchronization with other components")
    
    return {
        "score": score,
        "indicators": indicators,
        "strength": "STRONG" if in_sync_event else "WEAK",
        "in_sync_event": in_sync_event,
        "sync_details": sync_details,
    }


def _determine_attribution(evidence: Dict) -> Dict:
    """Determine overall attribution from evidence scores."""
    comp_score = evidence["component"]["score"]
    channel_score = evidence["channel"]["score"]
    board_score = evidence["board"]["score"]
    ref_score = evidence["reference"]["score"]
    temporal_score = evidence["temporal"]["score"]
    
    system_score = channel_score + board_score + ref_score + temporal_score
    
    # Decision logic
    if system_score >= 6 and comp_score <= 2:
        return {
            "label": "SYSTEM_CONSISTENT",
            "confidence": "HIGH",
            "summary": "Evidence strongly suggests system/test-equipment cause",
            "recommendation": "Review test-channel conditions before component disposition",
        }
    elif system_score >= 4 and comp_score >= 3:
        return {
            "label": "MIXED_PATTERN",
            "confidence": "LOW",
            "summary": "Both component and system evidence present — confounded",
            "recommendation": "Cannot distinguish component from system cause. Additional investigation required.",
        }
    elif comp_score >= 4 and system_score <= 2:
        return {
            "label": "COMPONENT_CONSISTENT",
            "confidence": "HIGH",
            "summary": "Evidence consistent with component-level anomaly",
            "recommendation": "Component-level investigation warranted",
        }
    elif comp_score >= 2 and system_score >= 2:
        return {
            "label": "INSUFFICIENT_EVIDENCE",
            "confidence": "LOW",
            "summary": "Conflicting evidence — cannot determine attribution with confidence",
            "recommendation": "Additional measurements or retest required",
        }
    elif comp_score >= 2:
        return {
            "label": "COMPONENT_CONSISTENT",
            "confidence": "MEDIUM",
            "summary": "Moderate evidence for component-level anomaly",
            "recommendation": "Monitor and consider additional investigation",
        }
    elif system_score >= 3:
        return {
            "label": "SYSTEM_CONSISTENT",
            "confidence": "MEDIUM",
            "summary": "Moderate evidence for system-level cause",
            "recommendation": "Review test equipment and channel conditions",
        }
    else:
        return {
            "label": "UNATTRIBUTABLE",
            "confidence": "LOW",
            "summary": "Insufficient evidence for clear attribution",
            "recommendation": "Continue monitoring",
        }


def _detect_common_mode_patterns(
    clean_df: pd.DataFrame,
    component_results: Dict[str, Dict],
    drift_results: Dict[str, Dict],
) -> List[Dict]:
    """Detect common-mode patterns across channels/boards."""
    patterns = []
    
    # Group flagged components by channel
    channel_flagged = {}
    for comp_id, comp_data in component_results.items():
        drift = drift_results.get(comp_id, {})
        is_flagged = (
            comp_data.get("screen_status", "PASS") != "PASS" or
            drift.get("drift_class", "STABLE") not in ("STABLE",)
        )
        if is_flagged:
            ch = comp_data.get("channel_id", "")
            channel_flagged.setdefault(ch, []).append(comp_id)
    
    # Check for channels with high affected rate
    for channel_id, flagged_comps in channel_flagged.items():
        all_on_channel = clean_df[clean_df["channel_id"] == channel_id]["component_id"].nunique()
        ratio = len(flagged_comps) / max(all_on_channel, 1)
        
        if ratio > 0.5 and len(flagged_comps) >= 3:
            patterns.append({
                "type": "CHANNEL_COMMON_MODE",
                "channel_id": channel_id,
                "n_affected": len(flagged_comps),
                "n_total": all_on_channel,
                "ratio": round(ratio, 2),
                "components": flagged_comps,
                "message": f"Common-mode pattern on {channel_id}: "
                           f"{len(flagged_comps)}/{all_on_channel} components affected",
            })
    
    # Group by board
    board_flagged = {}
    for comp_id, comp_data in component_results.items():
        drift = drift_results.get(comp_id, {})
        is_flagged = (
            comp_data.get("screen_status", "PASS") != "PASS" or
            drift.get("drift_class", "STABLE") not in ("STABLE",)
        )
        if is_flagged:
            bd = comp_data.get("board_id", "")
            board_flagged.setdefault(bd, []).append(comp_id)
    
    for board_id, flagged_comps in board_flagged.items():
        all_on_board = clean_df[clean_df["board_id"] == board_id]["component_id"].nunique()
        ratio = len(flagged_comps) / max(all_on_board, 1)
        
        if ratio > 0.6 and len(flagged_comps) >= 5:
            patterns.append({
                "type": "BOARD_COMMON_MODE",
                "board_id": board_id,
                "n_affected": len(flagged_comps),
                "n_total": all_on_board,
                "ratio": round(ratio, 2),
                "components": flagged_comps,
                "message": f"Common-mode pattern on {board_id}: "
                           f"{len(flagged_comps)}/{all_on_board} components affected",
            })
    
    return patterns
