# ASTRA-Q Architecture

## System Overview

```
Frontend (Next.js + TypeScript + Tailwind + Framer Motion)
    ↓ REST API
Backend (Python + FastAPI)
    ├── Data Generation (Synthetic Dataset)
    ├── Validation Engine
    ├── Screening Engine  
    ├── Drift Engine
    ├── Forecast Engine
    ├── Attribution Engine
    ├── Historical Comparison Engine
    └── SQLite Database (decisions + records)
```

## Backend Services

| Service | Purpose | Methods |
|---------|---------|---------|
| `data_generator` | Deterministic synthetic burn-in data | Seeded NumPy |
| `validation_engine` | Data quality checks | Range/timestamp/duplicate/reference checks |
| `screening_engine` | Lot-relative + absolute screening | Median, MAD, Robust Z-score |
| `drift_engine` | Trajectory classification | Robust regression, EWMA, CUSUM |
| `forecast_engine` | End-of-burn-in prediction | Linear/polynomial extrapolation + PI |
| `attribution_engine` | Component vs system pattern analysis | Cross-factor evidence aggregation |
| `historical_engine` | Population shift detection | KS-test, distribution comparison |

## Data Model

- 100 components, 8 boards, 24 channels, 168-hour burn-in
- Parameters: Resistance, Voltage, Current, Temperature, Leakage
- Fixed seed = 42 for reproducibility
