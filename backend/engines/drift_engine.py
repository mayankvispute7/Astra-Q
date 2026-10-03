"""
ASTRA-Q Drift Engine
======================
Classifies component trajectories into drift categories using
interpretable statistical methods.

Categories:
  STABLE - No significant trend
  GRADUAL_DRIFT - Linear monotonic trend
  ACCELERATING_DRIFT - Non-linear increasing trend (quadratic fit)
  STEP_CHANGE - Sudden discrete shift
  INTERMITTENT - Sporadic spikes/outliers
  NOISY - High variance, uncertain classification

Methods:
  - Robust linear regression (Theil-Sen slope)
  - CUSUM for step detection
  - Variance ratio for stability
  - Quadratic fit for acceleration detection
"""

import numpy as np
from scipy import stats
from typing import Dict, List, Any


# Thresholds for drift classification
SLOPE_THRESHOLD = 0.002     # Ω/hour for meaningful drift
ACCEL_THRESHOLD = 0.00005   # Quadratic coefficient for acceleration
STEP_THRESHOLD = 0.15       # Ω step for step-change detection
NOISE_CV_THRESHOLD = 0.03   # Coefficient of variation for noisy classification
INTERMITTENT_SPIKE_Z = 3.0  # Z-score for spike detection


def analyze_drift(component_results: Dict[str, Dict]) -> Dict[str, Dict]:
    """
    Analyze drift patterns for all screened components.
    
    Args:
        component_results: dict from screening engine with trajectory data
    
    Returns:
        Dict mapping component_id -> drift analysis results
    """
    drift_results = {}
    
    for comp_id, comp_data in component_results.items():
        trajectory = np.array(comp_data["trajectory_values"])
        hours = np.array(comp_data["trajectory_hours"])
        
        if len(trajectory) < 5:
            drift_results[comp_id] = {
                "component_id": comp_id,
                "drift_class": "INSUFFICIENT_DATA",
                "confidence": "LOW",
                "slope": None,
                "acceleration": None,
                "cusum_max": None,
                "step_detected": False,
                "step_hour": None,
                "n_spikes": 0,
                "message": "Fewer than 5 valid observations for drift analysis",
            }
            continue
        
        result = _classify_trajectory(trajectory, hours, comp_id)
        drift_results[comp_id] = result
    
    return drift_results


def _classify_trajectory(values: np.ndarray, hours: np.ndarray, comp_id: str) -> Dict[str, Any]:
    """Classify a single component's trajectory."""
    n = len(values)
    
    # 1. Robust linear regression (Theil-Sen)
    slope, intercept, _, _ = stats.theilslopes(values, hours)
    
    # 2. Quadratic fit for acceleration
    t_norm = (hours - hours[0]) / max(hours[-1] - hours[0], 1)
    try:
        quad_coeffs = np.polyfit(t_norm, values, 2)
        acceleration = quad_coeffs[0]  # quadratic coefficient
    except:
        acceleration = 0.0
    
    # 3. Residuals from linear fit
    linear_pred = intercept + slope * hours
    residuals = values - linear_pred
    residual_std = np.std(residuals)
    
    # 4. CUSUM for step detection
    mean_val = np.mean(values)
    cusum_pos = np.zeros(n)
    cusum_neg = np.zeros(n)
    for i in range(1, n):
        cusum_pos[i] = max(0, cusum_pos[i-1] + (values[i] - mean_val) - 0.5 * np.std(values))
        cusum_neg[i] = max(0, cusum_neg[i-1] - (values[i] - mean_val) - 0.5 * np.std(values))
    cusum_max = float(max(np.max(cusum_pos), np.max(cusum_neg)))
    
    # 5. Step detection (largest single-point change)
    deltas = np.abs(np.diff(values))
    max_delta = np.max(deltas)
    max_delta_idx = np.argmax(deltas)
    step_detected = max_delta > STEP_THRESHOLD
    step_hour = int(hours[max_delta_idx + 1]) if step_detected else None
    
    # 6. Spike detection (for intermittent)
    median_val = np.median(values)
    mad_val = np.median(np.abs(values - median_val))
    if mad_val < 1e-6:
        mad_val = 0.01
    spike_z = np.abs(values - median_val) / (mad_val * 1.4826)
    n_spikes = int(np.sum(spike_z > INTERMITTENT_SPIKE_Z))
    
    # 7. Coefficient of variation
    cv = np.std(values) / max(np.abs(np.mean(values)), 1e-6)
    
    # 8. EWMA for recent trend
    alpha = 0.3
    ewma = np.zeros(n)
    ewma[0] = values[0]
    for i in range(1, n):
        ewma[i] = alpha * values[i] + (1 - alpha) * ewma[i-1]
    recent_trend = ewma[-1] - ewma[max(0, n - 10)]
    
    # Classification logic
    abs_slope = abs(slope)
    
    if n_spikes >= 3 and abs_slope < SLOPE_THRESHOLD:
        drift_class = "INTERMITTENT"
        confidence = "MEDIUM"
    elif step_detected and abs_slope < SLOPE_THRESHOLD * 2:
        drift_class = "STEP_CHANGE"
        confidence = "HIGH" if max_delta > STEP_THRESHOLD * 2 else "MEDIUM"
    elif abs_slope > SLOPE_THRESHOLD and abs(acceleration) > ACCEL_THRESHOLD:
        drift_class = "ACCELERATING_DRIFT"
        confidence = "HIGH" if abs_slope > SLOPE_THRESHOLD * 3 else "MEDIUM"
    elif abs_slope > SLOPE_THRESHOLD:
        drift_class = "GRADUAL_DRIFT"
        confidence = "HIGH" if abs_slope > SLOPE_THRESHOLD * 2 else "MEDIUM"
    elif cv > NOISE_CV_THRESHOLD:
        drift_class = "NOISY"
        confidence = "LOW"
    else:
        drift_class = "STABLE"
        confidence = "HIGH" if abs_slope < SLOPE_THRESHOLD * 0.3 else "MEDIUM"
    
    # Compute drift rate in Ω/hour
    drift_rate = float(slope)
    
    # Total drift over burn-in
    total_drift = float(values[-1] - values[0])
    
    return {
        "component_id": comp_id,
        "drift_class": drift_class,
        "confidence": confidence,
        "slope": round(float(slope), 6),
        "slope_per_hour": round(float(slope), 6),
        "acceleration": round(float(acceleration), 6),
        "total_drift": round(total_drift, 4),
        "cusum_max": round(cusum_max, 4),
        "step_detected": bool(step_detected),
        "step_hour": step_hour,
        "step_magnitude": round(float(max_delta), 4) if step_detected else None,
        "n_spikes": n_spikes,
        "residual_std": round(float(residual_std), 4),
        "coefficient_of_variation": round(float(cv), 6),
        "recent_trend": round(float(recent_trend), 4),
        "ewma_values": [round(float(v), 4) for v in ewma],
    }
