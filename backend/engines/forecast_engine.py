"""
ASTRA-Q Forecast Engine
=========================
Predicts end-of-burn-in values using early observations.

Methods:
  - Robust linear extrapolation (Theil-Sen)
  - Quadratic extrapolation (for accelerating drift)
  - Prediction intervals using residual-based bootstrap
  
Outputs:
  - Forecast value at 168 hours
  - Prediction interval (lower, upper)
  - Screening boundary intersection
  - Risk interpretation
  
Never claims certainty. Always provides uncertainty bounds.
"""

import numpy as np
from scipy import stats
from typing import Dict, Any, Optional


FORECAST_HOUR = 168  # End of burn-in target


def forecast_components(
    component_results: Dict[str, Dict],
    drift_results: Dict[str, Dict],
    lot_baseline: Dict[str, Any],
) -> Dict[str, Dict]:
    """
    Forecast end-of-burn-in values for all components.
    
    Uses drift classification to select appropriate model:
      - STABLE/GRADUAL: linear extrapolation
      - ACCELERATING: quadratic extrapolation
      - STEP_CHANGE: post-step linear
      - INTERMITTENT/NOISY: linear with wider intervals
    """
    forecast_results = {}
    
    screening_boundary_high = lot_baseline.get("screening_boundary_high", lot_baseline["spec_high"])
    screening_boundary_low = lot_baseline.get("screening_boundary_low", lot_baseline["spec_low"])
    
    for comp_id, comp_data in component_results.items():
        trajectory = np.array(comp_data["trajectory_values"])
        hours = np.array(comp_data["trajectory_hours"])
        
        drift = drift_results.get(comp_id, {})
        drift_class = drift.get("drift_class", "UNKNOWN")
        
        if len(trajectory) < 5:
            forecast_results[comp_id] = _insufficient_forecast(comp_id)
            continue
        
        result = _forecast_component(
            comp_id, trajectory, hours, drift_class, drift,
            screening_boundary_high, screening_boundary_low,
            lot_baseline
        )
        forecast_results[comp_id] = result
    
    return forecast_results


def _forecast_component(
    comp_id: str,
    values: np.ndarray,
    hours: np.ndarray,
    drift_class: str,
    drift_info: Dict,
    boundary_high: float,
    boundary_low: float,
    lot_baseline: Dict,
) -> Dict[str, Any]:
    """Forecast a single component."""
    
    max_hour = hours[-1]
    forecast_horizon = FORECAST_HOUR
    
    # Select model based on drift classification
    if drift_class == "ACCELERATING_DRIFT":
        forecast_val, pi_low, pi_high, model = _quadratic_forecast(values, hours, forecast_horizon)
    elif drift_class == "STEP_CHANGE":
        step_hour = drift_info.get("step_hour", max_hour // 2)
        forecast_val, pi_low, pi_high, model = _post_step_forecast(values, hours, forecast_horizon, step_hour)
    elif drift_class in ("INTERMITTENT", "NOISY"):
        forecast_val, pi_low, pi_high, model = _linear_forecast(values, hours, forecast_horizon, widen_pi=2.0)
    elif drift_class == "INSUFFICIENT_DATA":
        return _insufficient_forecast(comp_id)
    else:
        # STABLE or GRADUAL_DRIFT
        forecast_val, pi_low, pi_high, model = _linear_forecast(values, hours, forecast_horizon)
    
    # Risk assessment
    exceeds_boundary = forecast_val > boundary_high or forecast_val < boundary_low
    pi_exceeds = pi_high > boundary_high or pi_low < boundary_low
    exceeds_spec = forecast_val > lot_baseline["spec_high"] or forecast_val < lot_baseline["spec_low"]
    
    if exceeds_spec:
        risk = "CRITICAL"
    elif exceeds_boundary:
        risk = "HIGH"
    elif pi_exceeds:
        risk = "ELEVATED"
    else:
        risk = "LOW"
    
    # Confidence based on data quality and drift type
    if drift_class in ("INTERMITTENT", "NOISY"):
        confidence = "LOW"
    elif drift_class == "ACCELERATING_DRIFT" and (forecast_horizon - max_hour) > max_hour:
        confidence = "LOW"  # Long extrapolation of acceleration is unreliable
    elif len(values) >= 20:
        confidence = "HIGH"
    else:
        confidence = "MEDIUM"
    
    # Generate forecast trajectory for visualization
    forecast_hours = np.arange(0, forecast_horizon + 1, 4)
    if model == "quadratic":
        t_norm = (forecast_hours - hours[0]) / max(hours[-1] - hours[0], 1)
        coeffs = np.polyfit((hours - hours[0]) / max(hours[-1] - hours[0], 1), values, 2)
        forecast_trajectory = np.polyval(coeffs, t_norm)
    else:
        slope, intercept, _, _ = stats.theilslopes(values, hours)
        forecast_trajectory = intercept + slope * forecast_hours
    
    return {
        "component_id": comp_id,
        "forecast_hour": FORECAST_HOUR,
        "forecast_value": round(float(forecast_val), 4),
        "prediction_interval_low": round(float(pi_low), 4),
        "prediction_interval_high": round(float(pi_high), 4),
        "screening_boundary_high": round(float(boundary_high), 4),
        "screening_boundary_low": round(float(boundary_low), 4),
        "risk": risk,
        "confidence": confidence,
        "model_used": model,
        "drift_class": drift_class,
        "forecast_trajectory": [round(float(v), 4) for v in forecast_trajectory],
        "forecast_hours": forecast_hours.tolist(),
        "exceeds_boundary": bool(exceeds_boundary),
        "exceeds_spec": bool(exceeds_spec),
    }


def _linear_forecast(
    values: np.ndarray,
    hours: np.ndarray,
    target_hour: int,
    widen_pi: float = 1.0,
) -> tuple:
    """Linear extrapolation using Theil-Sen robust regression."""
    slope, intercept, _, _ = stats.theilslopes(values, hours)
    forecast = intercept + slope * target_hour
    
    # Prediction interval from residuals
    predicted = intercept + slope * hours
    residuals = values - predicted
    residual_std = np.std(residuals)
    
    # Wider interval for extrapolation
    extrap_factor = 1 + 0.5 * max(0, (target_hour - hours[-1]) / (hours[-1] - hours[0] + 1))
    pi_width = 1.96 * residual_std * extrap_factor * widen_pi
    
    return forecast, forecast - pi_width, forecast + pi_width, "linear_robust"


def _quadratic_forecast(
    values: np.ndarray,
    hours: np.ndarray,
    target_hour: int,
) -> tuple:
    """Quadratic extrapolation for accelerating drift."""
    t_norm = (hours - hours[0]) / max(hours[-1] - hours[0], 1)
    coeffs = np.polyfit(t_norm, values, 2)
    
    t_target = (target_hour - hours[0]) / max(hours[-1] - hours[0], 1)
    forecast = np.polyval(coeffs, t_target)
    
    # Residuals
    predicted = np.polyval(coeffs, t_norm)
    residuals = values - predicted
    residual_std = np.std(residuals)
    
    # Wider interval for quadratic extrapolation (less reliable)
    extrap_factor = 1 + 1.0 * max(0, (target_hour - hours[-1]) / (hours[-1] - hours[0] + 1))
    pi_width = 2.0 * residual_std * extrap_factor
    
    return forecast, forecast - pi_width, forecast + pi_width, "quadratic"


def _post_step_forecast(
    values: np.ndarray,
    hours: np.ndarray,
    target_hour: int,
    step_hour: int,
) -> tuple:
    """Post-step linear forecast using only data after the step."""
    mask = hours >= step_hour
    if np.sum(mask) < 3:
        return _linear_forecast(values, hours, target_hour)
    
    post_values = values[mask]
    post_hours = hours[mask]
    return _linear_forecast(post_values, post_hours, target_hour, widen_pi=1.5)


def _insufficient_forecast(comp_id: str) -> Dict[str, Any]:
    """Return forecast unavailable response."""
    return {
        "component_id": comp_id,
        "forecast_hour": FORECAST_HOUR,
        "forecast_value": None,
        "prediction_interval_low": None,
        "prediction_interval_high": None,
        "screening_boundary_high": None,
        "screening_boundary_low": None,
        "risk": "UNKNOWN",
        "confidence": "NONE",
        "model_used": None,
        "drift_class": "INSUFFICIENT_DATA",
        "forecast_trajectory": [],
        "forecast_hours": [],
        "exceeds_boundary": None,
        "exceeds_spec": None,
        "message": "FORECAST UNAVAILABLE — Insufficient valid early observations",
    }
