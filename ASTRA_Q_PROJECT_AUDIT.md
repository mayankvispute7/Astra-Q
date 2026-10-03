# ASTRA-Q Project Audit

## 1. Executive Summary
ASTRA-Q is intended to be an AI-Assisted Reliability Screening & Investigation Workstation. Currently, the repository contains a React/Vite frontend and a FastAPI backend. The project structure and core backend logic (engines) for validation, screening, drift analysis, forecasting, attribution, and historical comparison are fully implemented in Python using synthetic generated data. The frontend is partially implemented but has a critical configuration issue (missing TailwindCSS), causing all the utility-based UI styling to break. No real dataset is used; the data is generated dynamically on backend pipeline execution.

## 2. Repository Structure
```
astra-main/
├── architecture.md
├── backend/
│   ├── astraq.db               # SQLite DB for engineer decisions
│   ├── main.py                 # FastAPI entry point
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── api/
│   │   └── (assumed empty/not heavily populated based on main.py handling routes)
│   └── engines/
│       ├── __init__.py
│       ├── attribution_engine.py
│       ├── data_generator.py
│       ├── drift_engine.py
│       ├── forecast_engine.py
│       ├── historical_engine.py
│       ├── screening_engine.py
│       └── validation_engine.py
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    ├── public/
    └── src/
        ├── App.tsx
        ├── index.css
        ├── main.tsx
        ├── api/
        │   └── client.ts
        ├── assets/
        └── components/
            ├── AttributionView.tsx
            ├── ComponentDeepDive.tsx
            ├── ComponentMatrix.tsx
            ├── DecisionLog.tsx
            ├── Header.tsx
            ├── HistoricalView.tsx
            ├── PipelineRunner.tsx
            └── ValidationLab.tsx
```

## 3. Technology Stack
- **Frontend**: React 19, Vite, TypeScript, Framer Motion, Recharts. (Missing: TailwindCSS)
- **Backend**: Python, FastAPI, Pandas, NumPy, SciPy, scikit-learn.
- **Database**: SQLite (only for engineer decisions; time-series data is kept in-memory).
- **ML / Analytics**: Custom deterministic Python logic (MAD screening, Theil-Sen regression, CUSUM, KS-Test).
- **Infrastructure**: None specified yet (Local development).

## 4. Frontend Analysis
- **Framework**: Vite + React (TypeScript).
- **Package Manager**: npm
- **Entry point**: `src/main.tsx` and `src/App.tsx`.
- **Main Views (Tab-based, no React Router)**:
  - PipelineRunner (Analysis initialization)
  - ComponentMatrix (List of components)
  - ComponentDeepDive (Specific component view)
  - AttributionView
  - HistoricalView
  - ValidationLab
  - DecisionLog
- **Data flow**: All data is fetched from the backend via `src/api/client.ts`. When `runAnalysis` is triggered, the backend generates deterministic synthetic data and stores it in memory.
- **Mock vs real data**: The frontend uses "real" responses from the backend API, but the backend itself generates the data synthetically. There is no hardcoded mock data in the frontend itself.

## 5. Backend Analysis
- **Entry point**: `backend/main.py`.
- **Server command**: `uvicorn main:app --reload`
- **Framework**: FastAPI.
- **API Routes**: Handled in `main.py`.
- **Services/Engines**: Separated into individual Python modules under `backend/engines/`.
- **Database**: Connects to `astraq.db` via sqlite3 module purely for storing engineer decisions. State is maintained in-memory `_analysis_state`.
- **CORS**: Configured to allow all origins `["*"]`.

## 6. ASTRA-Q Engine Status

| Engine | Implemented? | Files | Method | Frontend Connected? | Notes |
|--------|--------------|-------|--------|---------------------|-------|
| Validation | Yes | `validation_engine.py` | Range, timestamp, duplicate checks | Yes | Fully mocked data issues |
| Screening | Yes | `screening_engine.py` | Median, MAD, Robust Z-score | Yes | Evaluates lot-relative outliers |
| Drift | Yes | `drift_engine.py` | Theil-Sen regression, CUSUM | Yes | Identifies gradual/step/intermittent drift |
| Forecast | Yes | `forecast_engine.py` | Linear/polynomial extrapolation + PI | Yes | Forecasts up to 168h |
| Attribution | Yes | `attribution_engine.py` | Cross-factor evidence aggregation | Yes | Differs between component & system |
| Investigation | Yes (UI) | `main.py` / `DecisionLog.tsx`| SQLite CRUD operations | Yes | Records engineer decisions |

*Note: All engines are "implemented" but operate strictly on deterministically generated synthetic data embedded in `data_generator.py`.*

## 7. API Map

| Method | Endpoint | Purpose | Input | Output | Implementation Status |
|--------|----------|---------|-------|--------|------------------------|
| POST | `/api/analysis/run` | Triggers pipeline and data generation | None | Progress stages, summary | Implemented |
| GET | `/api/components` | List all component results | None | ComponentListResponse | Implemented |
| GET | `/api/components/{id}`| Component details & graphs | Path ID | ComponentDetailResponse| Implemented |
| GET | `/api/historical` | Historical lot comparison | None | Historical comparison data | Implemented |
| GET | `/api/common-mode` | Common-mode pattern analysis | None | System components, patterns| Implemented |
| POST | `/api/decisions` | Record engineer decision | DecisionPayload | Confirmation object | Implemented |
| GET | `/api/decisions` | Fetch recorded decisions | None | List of decisions | Implemented |
| GET | `/api/validation-lab` | Get adversarial scenario tests | None | Scenarios & success rates | Implemented |
| GET | `/api/report/{id}` | Generate full investigation report | Path ID | Report object | Implemented |

## 8. Database Map
**Type**: SQLite (`backend/astraq.db`)
**Tables**:
- `decisions`:
  - `id` (INTEGER PK)
  - `component_id` (TEXT)
  - `decision` (TEXT)
  - `rationale` (TEXT)
  - `engineer` (TEXT)
  - `timestamp` (TEXT)
  - `evidence_snapshot` (TEXT - JSON encoded)
  - `model_version` (TEXT)
  - `dataset_version` (TEXT)

*Note: The time-series sensor data and intermediate analysis results are NOT stored in the database. They live in memory inside `backend/main.py` globally as `_dataset` and `_analysis_state`.*

## 9. Environment Variables
Currently, the project uses **zero** environment variables. No `.env`, `.env.example`, or `.env.local` exists. All URLs (e.g., `http://127.0.0.1:8000`) and configurations are hardcoded.

## 10. How To Run

### Prerequisites
- Python 3.10+
- Node.js & npm

### Backend Setup
```bash
cd backend
python -m venv venv
# Activate venv (e.g., venv\Scripts\activate on Windows)
pip install -r requirements.txt
uvicorn main:app --reload
```
*(Currently fails out-of-the-box if dependencies are missing, e.g. scipy)*

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*(Note: Frontend runs but will be unstyled due to missing TailwindCSS).*

## 11. Actual Data Flow
Pipeline execution → `backend/engines/data_generator.py` generates synthetic CSV-equivalent data in-memory → Pipeline steps execute on this memory → Results aggregated in `_analysis_state` global dictionary → API serves this memory state → Frontend fetches and visualizes via `App.tsx` and Recharts.

When engineer decisions are made, Frontend → API → SQLite (`decisions` table).

## 12. Deployment Readiness
**Frontend**: 
- **Not Ready.**
- Missing TailwindCSS setup means the UI is totally broken in production.
- Hardcoded `http://127.0.0.1:8000/api` in `src/api/client.ts`. It will fail to connect in production.

**Backend**:
- **Not Ready.**
- Uses a global in-memory state (`_analysis_state`), meaning it will fail or behave unpredictably in multi-worker environments (e.g., Gunicorn or Render).
- Hardcoded relative SQLite DB path without proper volume management means decisions will be wiped on redeploys if using serverless or Docker without volumes.

**Database**:
- Missing proper DB setup for scale; an in-memory test DB approach is currently used for everything except decisions.

## 13. Known Issues

| Severity | Issue | Description |
|----------|-------|-------------|
| **CRITICAL** | Missing TailwindCSS | Frontend uses Tailwind utility classes (`min-h-screen`, `bg-slate-900`, etc.) but Tailwind is NOT installed or configured. The UI is severely broken. |
| **CRITICAL** | Hardcoded API Base | `src/api/client.ts` uses `http://127.0.0.1:8000`. This will crash/fail in any production deployment. |
| **HIGH** | In-memory Backend State | The entire ML and dataset memory is stored in a global `_analysis_state` dict in `main.py`. Multi-worker deployments will break state sharing. |
| **MEDIUM** | Missing Environment Variables | The project should externalize configuration (API endpoints, DB path, CORS). |
| **LOW** | Python Missing Modules | The system lacks an explicit instruction to install scipy/fastapi via virtual environment; requires `pip install -r requirements.txt`. |

## 14. Mock / Placeholder Components
- **Data Generation**: The ENTIRE dataset is a mock. `data_generator.py` uses predefined "Hero Cases" (e.g., `C-042`) and deterministic random generation. It looks incredibly real with "drift analysis", "mad calculation", and "validation checks", but it is ultimately 100% synthetically simulated upon every `/api/analysis/run` click.
- **Engineer Decisions DB**: The `astraq.db` database is real and functional, but uses a default string "demo_engineer" for all actions.

## 15. Missing ASTRA-Q Capabilities
- **Real data ingestion**: No CSV/Parquet upload feature or real DB connection for component telemetry.
- **Authentication**: No login or user management system to track which engineer made which decision.
- **True Production Database**: Missing a time-series or relational database (Postgres/TimescaleDB) for actual historical comparisons.

## 16. Recommended Development Order

1. **P0 (Must Fix):** Install and configure TailwindCSS in the frontend so the UI actually renders correctly.
2. **P0 (Must Fix):** Update `src/api/client.ts` to use Vite environment variables (`import.meta.env.VITE_API_URL`) instead of hardcoding `127.0.0.1`.
3. **P1 (Important):** Convert the in-memory `_analysis_state` to use a lightweight persistent layer (even Redis or structured SQLite) if deploying to a multi-worker environment.
4. **P1 (Important):** Allow uploading a custom CSV file instead of solely relying on the synthetic `data_generator.py`.
5. **P2 (Polish):** Add a simple engineer login/authentication flow for the `astraq.db` records.

## 17. Final Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend [React / Vite UI]
        UI[App Components] --> API_Client[client.ts]
        API_Client -- "REST API (Hardcoded 127.0.0.1)" --> Backend
    end

    subgraph Backend [FastAPI Backend]
        Router[main.py] --> DataGen[data_generator.py (Synthetic)]
        Router --> Validation[validation_engine.py]
        Router --> Screening[screening_engine.py]
        Router --> Drift[drift_engine.py]
        Router --> Forecast[forecast_engine.py]
        Router --> Attribution[attribution_engine.py]
        Router --> Historical[historical_engine.py]
        
        DataGen -- "Stores internally" --> State[(In-Memory Global State)]
        Validation --> State
        Screening --> State
        Drift --> State
        
        Router -- "Reads state" --> State
        Router -- "Reads/Writes" --> DB[(SQLite astraq.db)]
    end
```
