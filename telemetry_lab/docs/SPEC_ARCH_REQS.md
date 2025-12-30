# OT/SCADA Pipeline Telemetry Lab — Spec, Architecture, Requirements

## Purpose
Demonstrate data quality + leak detection + OT security mapping in a small,
explainable OT/SCADA-style telemetry pipeline that can be shipped in one day.

## Core User Stories
1. **Operator** can view time-series data, alarms, and export a report.
2. **Engineer** can trace how data quality impacts leak detection.
3. **Security analyst** can understand asset inventory, comms paths, and
   access levels with practical mitigations.

## Functional Requirements
### A. Telemetry Generator (Python)
- Generate synthetic flow, pressure, temperature telemetry.
- Inject data quality issues: missing data, stuck sensor, spikes, drift.
- Inject a small-leak signature (subtle sustained deviation).
- Output CSV + injection metadata JSON.

### B. Data Quality Labeling (Python)
- Label bad segments (missing, flatline, spike, drift/outlier).
- Output cleaned stream + labels (CSV/JSON).

### C. Leak Detection Baseline (Python)
- Implement EWMA or CUSUM with a persistence window.
- Output alerts with confidence and reason codes.

### D. Operator Dashboard (React)
- Time-series chart (raw vs cleaned) + data quality overlays.
- Alarm table with reason codes.
- Export “incident report” JSON/CSV.

### E. OT Security Mapping
- Asset list (sensor, RTU, historian, HMI, analytics).
- Comms map (graph or diagram).
- Access levels and practical protections.

### F. Documentation
- 60-second setup.
- Architecture diagram (ASCII ok).
- Screenshots.
- Limitations + next steps.

## Non-Functional Requirements
- **Local-first**: everything should run on a developer machine.
- **Minimal dependencies** for backend scripts.
- **Explainability**: reason codes and heuristics are transparent.
- **Traceability**: data quality labels link to leak detection decisions.

## Architecture
```
┌─────────────┐      ┌───────────────────┐      ┌─────────────────┐
│ Generator   │      │ Quality Labeling  │      │ Leak Detection  │
│ generate_   │─────▶│ label_quality.py  │─────▶│ detect_leaks.py │
│ data.py     │      │ (labels, cleaned) │      │ (alerts)        │
└─────────────┘      └───────────────────┘      └─────────────────┘
         │                       │                        │
         ▼                       ▼                        ▼
     sample.csv             labels.json               alerts.json
         │                       │                        │
         └───────────────┬───────┴───────────────┬────────┘
                         ▼                       ▼
                   Operator Dashboard (React)    API (optional)
```

## Data Contracts
- `sample.csv`: `timestamp, flow, pressure, temperature`
- `labels.json`: `kind, start_index, end_index, reason`
- `alerts.json`: `start_index, end_index, confidence, reason`

## Assumptions
- Sampling rate: 1 minute.
- Leak signature: sustained drop in flow & pressure.
- Missing data is represented as `NaN` in CSV.

## Open Questions / Future Enhancements
- Replace fixed thresholds with adaptive baselines.
- Add ROC/STA style metrics for detection quality.
- Add asset graph visualization and attack path analysis.
