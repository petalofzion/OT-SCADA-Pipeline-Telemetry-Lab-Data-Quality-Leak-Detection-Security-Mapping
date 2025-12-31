# Success Metrics Tracker

Use this sheet as a resume-ready progress tracker.

## Baseline Goals

| Metric | Target | Status | Evidence |
| --- | --- | --- | --- |
| Generator runs E2E | Yes | ✅ | [sample], [injections] |
| Labels + cleaned CSV | Yes | ✅ | [labels], [cleaned] |
| Leak alerts + reasons | Yes | ✅ | [alerts] |
| Raw vs cleaned toggles | Yes | ✅ | [ui-app] |
| Asset + comms map | Yes | ✅ | [asset-comms], [ui-app] |
| Incident report export | Yes | ✅ | [report-py], [ui-app] |

## Quantitative Metrics (fill after running)

| Metric | Definition | Target | Baseline | Latest |
| --- | --- | --- | --- | --- |
| False alarm rate | Alerts w/out leak (%) | < 5% | 85.7% | 85.7% |
| Detection delay | Min from leak start | < 10 min | 0 min | 0 min |
| Data quality coverage | Injected issues labeled (%) | > 90% | 100% | 100% |
| Cleaning impact | False alarms reduced (%) | > 30% | -500.0% | -500.0% |

## Milestone Checklist

- [ ] M1: Data generation + injection metadata
- [ ] M2: Quality labeling + cleaned output
- [ ] M3: Leak detection baseline
- [ ] M4: UI wiring to real data
- [ ] M5: Asset/comms map visualization
- [ ] M6: Resume-ready screenshots + report

## Notes

- Keep evidence links to outputs or screenshots.
- Update metrics after each iteration to show improvement.

## Metric Evidence

- False alarm rate: [alerts], [injections]
- Detection delay: [alerts], [injections]
- Data quality coverage: [labels], [injections]
- Cleaning impact: [sample], [alerts]

[sample]: ../data/sample.csv
[injections]: ../data/injections.json
[labels]: ../data/labels.json
[cleaned]: ../data/cleaned.csv
[alerts]: ../data/alerts.json
[asset-comms]: ../data/asset_comms.json
[ui-app]: ../ui/src/App.jsx
[report-py]: ../backend/report.py
