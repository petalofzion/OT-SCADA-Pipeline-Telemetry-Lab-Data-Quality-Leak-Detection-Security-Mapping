# Demo runbook (data → API → UI → report export)

Use this runbook to reproduce the full telemetry lab demo: generate data,
label quality issues, detect leaks, start the API server, launch the UI,
and export the incident report.

> **Working directory:** run the commands from the repository root unless noted.

## 1) Generate data + quality labels + leak alerts

```bash
cd telemetry_lab
python3 -m venv .venv
source .venv/bin/activate
python backend/generate_data.py
python backend/label_quality.py
python backend/detect_leaks.py
```

### Report output files

- `telemetry_lab/data/sample.csv` (raw telemetry sample)
- `telemetry_lab/data/cleaned.csv` (cleaned telemetry for analysis)
- `telemetry_lab/data/labels.json` (data quality labels)
- `telemetry_lab/data/alerts.json` (leak detection alerts)

## 2) Start the API server

```bash
cd telemetry_lab
source .venv/bin/activate
python backend/server.py
```

You should see:

```text
Serving telemetry API on http://localhost:8000
```

### Useful endpoints

- `http://localhost:8000/health`
- `http://localhost:8000/data/sample`
- `http://localhost:8000/data/labels`
- `http://localhost:8000/data/alerts`
- `http://localhost:8000/data/report`

## 3) Launch the UI

```bash
cd telemetry_lab/ui
npm install
npm run dev
```

The Vite dev server output will include a local URL such as:

```text
  Local:   http://localhost:5173/
```

## 4) Export the incident report

Generate the incident report JSON/CSV and mirror it into the UI data folder:

```bash
cd telemetry_lab
source .venv/bin/activate
python backend/report.py \
  --out data/report.json \
  --ui-out ui/src/data/report.json \
  --csv-out data/report.csv \
  --ui-csv-out ui/src/data/report.csv
```

### Expected output files

- `telemetry_lab/data/report.json` (incident report)
- `telemetry_lab/data/report.csv` (incident report CSV export)
- `telemetry_lab/ui/src/data/report.json` (UI export payload)
- `telemetry_lab/ui/src/data/report.csv` (UI CSV export payload)

If you are running the API server, `/data/report` will return the same payload.
