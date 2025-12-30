# Success Metrics Tracker

Use this sheet as a resume-ready progress tracker.

## Baseline Goals
| Metric | Target | Status | Evidence |
| --- | --- | --- | --- |
| Synthetic data generator runs end-to-end | Yes | ☐ | `backend/generate_data.py` |
| Quality labeling produces labels + cleaned CSV | Yes | ☐ | `backend/label_quality.py` |
| Leak detection outputs alerts + reason codes | Yes | ☐ | `backend/detect_leaks.py` |
| Dashboard shows raw vs cleaned toggles | Yes | ☐ | UI mock + TODOs |
| Asset & comms map documented | Yes | ☐ | README + UI page |
| Incident report export available | Yes | ☐ | UI button + TODO |

## Quantitative Metrics (fill after running)
| Metric | Definition | Target | Baseline | Latest |
| --- | --- | --- | --- | --- |
| False alarm rate | % alerts without injected leak | < 5% | TBD | TBD |
| Detection delay | Minutes from leak start to first alert | < 10 min | TBD | TBD |
| Data quality coverage | % of injected issues labeled | > 90% | TBD | TBD |
| Cleaning impact | % reduction in false alarms after cleaning | > 30% | TBD | TBD |

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
