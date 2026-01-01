# OT/SCADA Pipeline Telemetry Lab — Data Quality + Leak Detection + Security Mapping

A resume-ready demo that showcases pipeline telemetry generation, data quality
labeling, leak detection, and OT/ICS security mapping with a local-first
operator dashboard.

## 60-second setup

```bash
cd telemetry_lab
python3 -m venv .venv
source .venv/bin/activate
python backend/generate_data.py
python backend/label_quality.py
python backend/detect_leaks.py
python backend/report.py --ui-out ui/src/data/report.json
```

For a full demo runbook (data generation → API → UI → report export), see
`telemetry_lab/docs/DEMO_RUN.md`.

Report artifacts:

- `telemetry_lab/data/report.json` (incident report output)
- `telemetry_lab/data/report.csv` (incident report CSV export)
- `telemetry_lab/ui/src/data/report.json` (UI export payload)
- `telemetry_lab/ui/src/data/report.csv` (UI CSV export payload)

### Offline UI snapshot

The UI fallback loaders use the static snapshot in `telemetry_lab/data/`.
Regenerate it after running the data pipeline:

```bash
cd telemetry_lab
source .venv/bin/activate
python backend/generate_data.py
python backend/label_quality.py
python backend/detect_leaks.py
python backend/report.py --out data/report.json --csv-out data/report.csv
```

Optional UI:

```bash
cd ui
npm install
npm run dev
```

## Architecture (ASCII)

```text
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

## Repo structure

```text
telemetry_lab/
  backend/
    generate_data.py
    label_quality.py
    detect_leaks.py
    server.py
  data/
    sample.csv
    labels.json
    golden/
  docs/
    SPEC_ARCH_REQS.md
    SUCCESS_METRICS.md
    AI_WORKFLOW.md
  schemas/
    labels.schema.json
    alerts.schema.json
    report.schema.json
  tests/
    (pytest + hypothesis)
  ui/
    (Vite + React app)
```

## What it demonstrates

- **Pipeline applications & leak detection**: EWMA detection with
  reason codes and persistence windows to reduce false alarms.
- **Data quality**: labeling missing data, flatlines, spikes, drift/outliers.
- **OT/ICS modernization**: operator dashboard, alert table, export workflows.
- **Security mapping**: asset inventory, comms paths, access levels, practical
  mitigations.

## Documentation

- `telemetry_lab/docs/SPEC_ARCH_REQS.md` — requirements + architecture sheet.
- `telemetry_lab/docs/SUCCESS_METRICS.md` — success metrics tracker.
- `telemetry_lab/docs/AI_WORKFLOW.md` — AI agent workflow playbook.
- `telemetry_lab/docs/TESTING_AND_CI.md` — test suite and CI gates.
- `CHECKLIST.md` — pre-commit commands for agents.
- `CI_FAIL_PLAYBOOK.md` — guidance for resolving CI failures.

## Screenshots

![Operator dashboard](telemetry_lab/docs/telemetry-dashboard.png)

## Evidence & Artifacts

- **Dashboard Screenshot**: `telemetry_lab/docs/telemetry-dashboard.png` (captured
  2026-01-01)
- **Raw Telemetry Sample**: `telemetry_lab/data/sample.csv` (refreshed 2026-01-01)
- **Cleaned Data**: `telemetry_lab/data/cleaned.csv` (refreshed 2026-01-01)
- **Data Quality Labels**: `telemetry_lab/data/labels.json` (refreshed 2026-01-01)
- **Leak Alerts**: `telemetry_lab/data/alerts.json` (refreshed 2026-01-01)
- **Incident Report**: `telemetry_lab/data/report.json` (refreshed 2026-01-01)

## Golden datasets

- `telemetry_lab/data/golden/seed_123.csv` is used by tests to verify the
  generator is reproducible for a fixed seed.
- `telemetry_lab/data/golden/quality_input.csv` and
  `telemetry_lab/data/golden/quality_expected_labels.json` validate labeling
  behavior for missing, flatline, spike, and drift.

## Testing & quality gates

Install dev dependencies:

```bash
pip install -r telemetry_lab/requirements-dev.txt
```

Run the full check suite:

```bash
make check
```

## Threats & mitigations (OT/ICS mindset)

- **Least privilege**: separate operator/engineer/admin roles, reduce standing
  privileges.
- **Segmentation**: isolate field devices, RTUs, historians, and analytics nodes.
- **Credential storage**: use OS-level keyrings or vaults; avoid plaintext in
  configs.
- **Monitoring**: log remote access and alert on anomalous commands.

## Limitations

- Detection logic is intentionally simple and threshold-based.
- Recharts dashboards and the vis-network comms map are implemented, but CSV
  export is not wired up yet (JSON export works).

## Next steps

- Add CSV export to complement the existing JSON export.
- Add advanced detection (CUSUM, ROC/STA, isolation forest).
- Extend the comms graph with attack path analysis.

## License

MIT
