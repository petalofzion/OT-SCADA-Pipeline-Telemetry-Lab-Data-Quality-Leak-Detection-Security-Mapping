# Agent Checklist

Before committing any change, run the following:

1. `make check`
2. If behavior changes, update README run steps and any relevant docs.
3. Confirm success metrics updates if outputs change.

Notes:
- If Playwright tests fail locally, record the reason and retry after `npx playwright install`.
