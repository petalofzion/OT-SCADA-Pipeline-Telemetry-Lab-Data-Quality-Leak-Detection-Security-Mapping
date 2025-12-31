# AI Autonomous Workflow Guide

This project is designed so an AI agent can make safe, incremental progress.
Follow these steps to maintain context and traceability.

## 1) Context Primer (read first)

- `docs/SPEC_ARCH_REQS.md` for requirements + architecture.
- `docs/SUCCESS_METRICS.md` to align outputs with resume goals.
- `README.md` for setup, usage, and limitations.

## 2) Daily Agent Loop

1. **Pull context**: open current data outputs in `data/`.
2. **Check status**: update `docs/SUCCESS_METRICS.md`.
3. **Pick one deliverable**: implement/extend a single script or UI section.
4. **Validate**: run the relevant script(s).
5. **Quality gates**: run `make check` before committing.
6. **Document**: summarize changes and update README if needed.

## 3) Step-by-Step Task Mapping

### Task A — Telemetry Generator

- File: `backend/generate_data.py`
- Key function: `generate_points`
- Extend injection types by adding new `InjectionEvent`s.

### Task B — Quality Labeling

- File: `backend/label_quality.py`
- Key function: `label_quality`
- Add robust windows (median filters, z-score, etc.).

### Task C — Leak Detection

- File: `backend/detect_leaks.py`
- Key function: `detect_leaks`
- Consider CUSUM or model-based baselines.

### Task D — Operator Dashboard

- File: `ui/src/App.jsx`
- Current state: telemetry time-series rendered with Recharts + label/alert overlays.
- Current state: incident report JSON export button wired.
- Next: add CSV export for incident summaries and cleaned telemetry.
- Next: add operator-facing filters (severity, label type, time window).

### Task E — Security Mapping

- Files: `README.md`, `ui/src/App.jsx`
- Current state: asset + comms map rendered with vis-network and trust boundaries.
- Next: enrich assets with security metadata (protocol versions, auth status).
- Next: add coverage mapping to MITRE ATT&CK for ICS techniques.

## 4) Guardrails

- Keep backend scripts dependency-light.
- Always output reason codes for explainability.
- Avoid hidden automation; the goal is clarity for reviewers.

## 5) Data/Output Contracts

- Input CSV column order: `timestamp, flow, pressure, temperature`.
- Label JSON schema: `{kind, start_index, end_index, reason}`.
- Alerts JSON schema: `{start_index, end_index, confidence, reason}`.
