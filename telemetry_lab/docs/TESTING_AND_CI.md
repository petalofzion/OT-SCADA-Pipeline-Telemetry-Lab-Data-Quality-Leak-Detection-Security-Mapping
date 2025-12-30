# Testing & CI Gates

This document defines the tests and quality gates that keep the lab stable.

## Test Suite

### 1) Unit tests (pytest)

- Deterministic data generation check (seeded output hash).
- Quality label checks for missing, flatline, spike, drift.
- Leak detection triggers on known leak, stays quiet on noise.

### 2) Property-based tests (hypothesis)

- Cleaning removes NaNs from flow values.
- Missing + flatline labels do not overlap.
- Alert indices always within bounds.

### 3) Integration tests

- CLI leak detection writes alerts and matches schema.

### 4) UI smoke tests (Playwright)

- Build passes via `npm run build`.
- Smoke test asserts the main toggles, alerts table, and export button.

### 5) Contract tests

- JSON schema validation for `labels.json`, `alerts.json`, `report.json`.

## CI Pipeline (GitHub Actions)

- Python: ruff, black, mypy, bandit, pip-audit, pytest + coverage ≥ 70%.
- UI: npm ci, eslint, build, Playwright smoke.
- Repo hygiene: Markdown lint + large-file check.

## Local command

- `make check` runs the full suite locally.

## Notes

- Update golden datasets with a short rationale if the generator changes.
- Add screenshots/logs to CI_FAIL_PLAYBOOK.md entries when failures occur.
