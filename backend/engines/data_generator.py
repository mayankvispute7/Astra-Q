"""
ASTRA-Q Synthetic Data Generator
=================================
Generates deterministic, realistic burn-in test data for 100 components
across 8 boards, 24 channels, 168-hour burn-in.

Fixed seed = 42 for reproducibility.

Embeds four hero scenarios:
  1. C-042: Hidden within-spec outlier (passes limits, lot-relative outlier)
  2. Common-mode event: 80 components on CH04-CH06 shift due to system cause
  3. Whole-lot shift: LOT-24A median shifted vs historical lots
  4. Insufficient evidence: Conflicting component/system signals
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple

SEED = 42
NUM_COMPONENTS = 100
NUM_BOARDS = 8
CHANNELS_PER_BOARD = 3  # 24 channels total
BURN_IN_HOURS = 168
MEASUREMENT_INTERVAL = 4  # every 4 hours
NUM_MEASUREMENTS = BURN_IN_HOURS // MEASUREMENT_INTERVAL  # 42 readings per component

# Specification limits for resistance (Ohms)
SPEC_LOW = 8.0
SPEC_HIGH = 12.0

# Historical lot parameters (lots 21-23)
HISTORICAL_LOTS = {
    "LOT-21": {"median": 10.05, "mad": 0.42, "n_components": 100},
    "LOT-22": {"median": 10.12, "mad": 0.38, "n_components": 100},
    "LOT-23": {"median": 10.08, "mad": 0.45, "n_components": 100},
}

# Current lot
CURRENT_LOT = "LOT-24A"
CURRENT_LOT_MEDIAN_TARGET = 10.47  # Shifted from historical ~10.08


def generate_component_assignments(rng: np.random.Generator) -> pd.DataFrame:
    """Assign 100 components to boards and channels."""
    components = []
    comp_idx = 0
    for board_id in range(1, NUM_BOARDS + 1):
        for channel_id in range(1, CHANNELS_PER_BOARD + 1):
            # ~4 components per channel, distribute remainder
            n_on_channel = 4 if comp_idx < 96 else (NUM_COMPONENTS - comp_idx)
            for _ in range(min(n_on_channel, NUM_COMPONENTS - comp_idx)):
                comp_idx += 1
                components.append({
                    "component_id": f"C-{comp_idx:03d}",
                    "lot_id": CURRENT_LOT,
                    "board_id": f"BRD-{board_id:02d}",
                    "channel_id": f"CH-{(board_id - 1) * CHANNELS_PER_BOARD + channel_id:02d}",
                    "channel_num": (board_id - 1) * CHANNELS_PER_BOARD + channel_id,
                    "test_station": f"TS-{((board_id - 1) // 4) + 1:02d}",
                    "reference_unit": f"REF-{board_id:02d}",
                })
                if comp_idx >= NUM_COMPONENTS:
                    break
            if comp_idx >= NUM_COMPONENTS:
                break
        if comp_idx >= NUM_COMPONENTS:
            break
    return pd.DataFrame(components)


def generate_base_resistance(rng: np.random.Generator, n: int) -> np.ndarray:
    """Generate initial resistance values centered around lot median target."""
    return rng.normal(CURRENT_LOT_MEDIAN_TARGET, 0.40, size=n)


def generate_normal_trajectory(rng: np.random.Generator, base_value: float,
                                n_points: int) -> np.ndarray:
    """Normal component: stable with small noise."""
    noise = rng.normal(0, 0.03, size=n_points)
    # Slight natural drift (very small)
    drift = np.linspace(0, rng.uniform(-0.02, 0.02), n_points)
    return base_value + noise + drift


def generate_c042_trajectory(rng: np.random.Generator, n_points: int) -> np.ndarray:
    """
    HERO CASE 1: C-042 — Hidden within-spec outlier.
    Starts at ~10.5, accelerating drift toward spec boundary.
    Final value ~11.94 (within spec 8-12 but lot-relative outlier).
    """
    base = 10.50
    # Accelerating quadratic drift
    t = np.linspace(0, 1, n_points)
    drift = 1.44 * t**2  # reaches ~1.44 at end -> 10.50 + 1.44 = 11.94
    noise = rng.normal(0, 0.025, size=n_points)
    return base + drift + noise


def generate_system_affected_trajectory(rng: np.random.Generator, base_value: float,
                                         n_points: int, event_hour: int,
                                         shift_magnitude: float) -> np.ndarray:
    """
    HERO CASE 2: Common-mode event.
    Normal until event_hour, then step shift.
    """
    event_idx = event_hour // MEASUREMENT_INTERVAL
    trajectory = generate_normal_trajectory(rng, base_value, n_points)
    # Apply step shift after event
    trajectory[event_idx:] += shift_magnitude
    # Add correlated noise post-event
    trajectory[event_idx:] += rng.normal(0, 0.02, size=n_points - event_idx)
    return trajectory


def generate_reference_unit_trajectory(rng: np.random.Generator, base_value: float,
                                        n_points: int, is_affected_channel: bool,
                                        event_hour: int) -> np.ndarray:
    """Reference unit: stable normally, shifts on affected channels."""
    noise = rng.normal(0, 0.015, size=n_points)
    trajectory = base_value + noise
    if is_affected_channel:
        event_idx = event_hour // MEASUREMENT_INTERVAL
        trajectory[event_idx:] += 0.12  # Reference also shifts -> system evidence
    return trajectory


def generate_intermittent_trajectory(rng: np.random.Generator, base_value: float,
                                      n_points: int) -> np.ndarray:
    """HERO CASE 4 helper: Intermittent anomaly with conflicting evidence."""
    trajectory = generate_normal_trajectory(rng, base_value, n_points)
    # Add intermittent spikes
    spike_indices = rng.choice(n_points, size=5, replace=False)
    for idx in spike_indices:
        trajectory[idx] += rng.uniform(0.4, 0.8)
    return trajectory


def generate_gradual_drift_trajectory(rng: np.random.Generator, base_value: float,
                                       n_points: int) -> np.ndarray:
    """Gradual linear drift for additional flagged components."""
    t = np.linspace(0, 1, n_points)
    drift = rng.uniform(0.3, 0.6) * t
    noise = rng.normal(0, 0.03, size=n_points)
    return base_value + drift + noise


def generate_step_change_trajectory(rng: np.random.Generator, base_value: float,
                                     n_points: int) -> np.ndarray:
    """Step change at random point."""
    step_idx = rng.integers(n_points // 3, 2 * n_points // 3)
    trajectory = generate_normal_trajectory(rng, base_value, n_points)
    trajectory[step_idx:] += rng.uniform(0.3, 0.5)
    return trajectory


def generate_dataset() -> Dict:
    """
    Generate complete synthetic burn-in dataset.
    
    Returns dict with:
      - burn_in_data: DataFrame of all measurements
      - component_assignments: DataFrame of component-to-board/channel mapping
      - historical_lots: Dict of historical lot statistics
      - reference_data: DataFrame of reference unit measurements
      - metadata: Dict of generation metadata
    """
    rng = np.random.default_rng(SEED)
    
    # Assign components to boards/channels
    assignments = generate_component_assignments(rng)
    
    # Determine component behaviors
    base_values = generate_base_resistance(rng, NUM_COMPONENTS)
    
    hours = np.arange(0, BURN_IN_HOURS, MEASUREMENT_INTERVAL)
    
    # Channels affected by common-mode event (CH04-CH06 = channels 4,5,6)
    affected_channels = {"CH-04", "CH-05", "CH-06"}
    event_hour = 96  # Event at 96 hours
    
    # Components for Hero Case 4 (insufficient evidence)
    insufficient_evidence_components = {"C-088", "C-089"}
    
    # Additional flagged components (gradual drift or step change)
    additional_drift = {"C-015", "C-027", "C-034", "C-051", "C-063", "C-078"}
    additional_step = {"C-009", "C-045", "C-096"}
    
    all_records = []
    reference_records = []
    
    for idx, row in assignments.iterrows():
        comp_id = row["component_id"]
        channel_id = row["channel_id"]
        board_id = row["board_id"]
        base_val = base_values[idx]
        
        is_affected_channel = channel_id in affected_channels
        
        # Determine trajectory type
        if comp_id == "C-042":
            # HERO CASE 1: Hidden within-spec outlier
            resistance_traj = generate_c042_trajectory(rng, NUM_MEASUREMENTS)
        elif is_affected_channel and comp_id not in insufficient_evidence_components:
            # HERO CASE 2: Common-mode event (channels 4-6)
            shift_mag = rng.uniform(0.15, 0.25)
            resistance_traj = generate_system_affected_trajectory(
                rng, base_val, NUM_MEASUREMENTS, event_hour, shift_mag
            )
        elif comp_id in insufficient_evidence_components:
            # HERO CASE 4: Intermittent with conflicting evidence
            resistance_traj = generate_intermittent_trajectory(rng, base_val, NUM_MEASUREMENTS)
        elif comp_id in additional_drift:
            resistance_traj = generate_gradual_drift_trajectory(rng, base_val, NUM_MEASUREMENTS)
        elif comp_id in additional_step:
            resistance_traj = generate_step_change_trajectory(rng, base_val, NUM_MEASUREMENTS)
        else:
            # Normal component
            resistance_traj = generate_normal_trajectory(rng, base_val, NUM_MEASUREMENTS)
        
        # Generate correlated parameters
        for i, hour in enumerate(hours):
            temp_base = 85.0 + rng.normal(0, 0.5)  # Burn-in at 85°C nominal
            if is_affected_channel and hour >= event_hour:
                temp_base += rng.uniform(0.8, 1.5)  # Slight temp shift on affected channels
            
            voltage = 5.0 + rng.normal(0, 0.01)
            current = resistance_traj[i] / voltage * 1000 + rng.normal(0, 0.5)  # mA, derived
            leakage = max(0, rng.normal(0.5, 0.1) + (resistance_traj[i] - 10.0) * 0.05)
            power = voltage * (current / 1000)
            
            all_records.append({
                "component_id": comp_id,
                "lot_id": CURRENT_LOT,
                "board_id": board_id,
                "channel_id": channel_id,
                "test_station": row["test_station"],
                "reference_unit": row["reference_unit"],
                "burn_in_hour": int(hour),
                "timestamp": f"2026-09-{15 + hour // 24:02d}T{(8 + hour % 24):02d}:00:00",
                "parameter": "resistance",
                "value": round(float(resistance_traj[i]), 4),
                "temperature": round(float(temp_base), 2),
                "voltage": round(float(voltage), 3),
                "current": round(float(current), 2),
                "leakage": round(float(leakage), 4),
                "power": round(float(power), 4),
                "spec_low": SPEC_LOW,
                "spec_high": SPEC_HIGH,
            })
    
    # Generate reference unit data
    ref_units = assignments[["board_id", "reference_unit"]].drop_duplicates()
    for _, ref_row in ref_units.iterrows():
        board_id = ref_row["board_id"]
        ref_id = ref_row["reference_unit"]
        ref_base = 10.00 + rng.normal(0, 0.05)
        
        # Check if this board has affected channels
        board_channels = assignments[assignments["board_id"] == board_id]["channel_id"].unique()
        board_has_affected = any(ch in affected_channels for ch in board_channels)
        
        for i, hour in enumerate(hours):
            ref_val = ref_base + rng.normal(0, 0.015)
            if board_has_affected and hour >= event_hour:
                ref_val += 0.12  # Reference shifts too -> system evidence
            
            reference_records.append({
                "reference_unit": ref_id,
                "board_id": board_id,
                "burn_in_hour": int(hour),
                "timestamp": f"2026-09-{15 + hour // 24:02d}T{(8 + hour % 24):02d}:00:00",
                "parameter": "resistance",
                "value": round(float(ref_val), 4),
            })
    
    # Generate historical lot distributions
    historical_data = {}
    for lot_id, params in HISTORICAL_LOTS.items():
        lot_rng = np.random.default_rng(hash(lot_id) % (2**31))
        n = params["n_components"]
        final_values = lot_rng.normal(params["median"], params["mad"] * 1.4826, size=n)
        historical_data[lot_id] = {
            "final_values": final_values.tolist(),
            "median": float(np.median(final_values)),
            "mad": float(np.median(np.abs(final_values - np.median(final_values)))),
            "mean": float(np.mean(final_values)),
            "std": float(np.std(final_values)),
            "n_components": n,
        }
    
    burn_in_df = pd.DataFrame(all_records)
    reference_df = pd.DataFrame(reference_records)
    
    # Inject data quality issues for validation engine testing
    # Add a few duplicate readings
    dup_indices = rng.choice(len(burn_in_df), size=3, replace=False)
    duplicates = burn_in_df.iloc[dup_indices].copy()
    burn_in_df = pd.concat([burn_in_df, duplicates], ignore_index=True)
    
    # Add one impossible value
    impossible_idx = rng.integers(0, len(burn_in_df))
    burn_in_df.loc[impossible_idx, "value"] = -5.0  # Negative resistance = impossible
    
    # Add missing values (NaN) to a few entries
    missing_indices = rng.choice(len(burn_in_df), size=5, replace=False)
    for mi in missing_indices:
        burn_in_df.loc[mi, "value"] = np.nan
    
    metadata = {
        "generator_version": "1.0.0",
        "seed": SEED,
        "n_components": NUM_COMPONENTS,
        "n_boards": NUM_BOARDS,
        "n_channels": NUM_BOARDS * CHANNELS_PER_BOARD,
        "burn_in_hours": BURN_IN_HOURS,
        "measurement_interval_hours": MEASUREMENT_INTERVAL,
        "spec_low": SPEC_LOW,
        "spec_high": SPEC_HIGH,
        "lot_id": CURRENT_LOT,
        "data_type": "SYNTHETIC DEMONSTRATION DATA",
        "hero_cases": {
            "hidden_outlier": "C-042",
            "common_mode_channels": list(affected_channels),
            "common_mode_event_hour": event_hour,
            "whole_lot_shift": True,
            "insufficient_evidence": list(insufficient_evidence_components),
        }
    }
    
    return {
        "burn_in_data": burn_in_df,
        "component_assignments": assignments,
        "historical_lots": historical_data,
        "reference_data": reference_df,
        "metadata": metadata,
    }


def get_current_lot_final_values(burn_in_df: pd.DataFrame) -> np.ndarray:
    """Get the final (latest hour) resistance values for current lot."""
    max_hour = burn_in_df["burn_in_hour"].max()
    final = burn_in_df[
        (burn_in_df["burn_in_hour"] == max_hour) & 
        (burn_in_df["value"].notna()) &
        (burn_in_df["parameter"] == "resistance")
    ]
    return final["value"].values


if __name__ == "__main__":
    data = generate_dataset()
    print(f"Generated {len(data['burn_in_data'])} measurement records")
    print(f"Components: {data['metadata']['n_components']}")
    print(f"Boards: {data['metadata']['n_boards']}")
    print(f"Hours: {data['metadata']['burn_in_hours']}")
    print(f"\nData quality issues injected: duplicates, impossible values, missing values")
    print(f"\nHero cases embedded:")
    for k, v in data['metadata']['hero_cases'].items():
        print(f"  {k}: {v}")
