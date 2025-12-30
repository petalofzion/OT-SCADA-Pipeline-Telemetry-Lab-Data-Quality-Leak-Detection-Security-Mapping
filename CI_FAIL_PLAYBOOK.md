# CI Failure Playbook

## Linting failures
- **ruff**: run `python -m ruff check --fix telemetry_lab`.
- **black**: run `python -m black telemetry_lab scripts`.
- **eslint**: run `cd telemetry_lab/ui && npm run lint -- --fix`.

## Test failures
- **pytest**: inspect the failing test and update fixtures or code.
- **golden dataset mismatch**: update `telemetry_lab/data/golden/*` with rationale in README or test notes.

## Security scans
- **bandit**: confirm the flagged code is safe or refactor the pattern.
- **pip-audit**: upgrade pinned versions or add explicit exceptions with justification.

## UI checks
- **Playwright**: re-run `npx playwright test` and attach screenshots/logs of failures.
- **Build issues**: delete `node_modules` and re-run `npm ci`.

## Large file check
- Remove or move any assets over 2 MB, or add a small placeholder instead.
