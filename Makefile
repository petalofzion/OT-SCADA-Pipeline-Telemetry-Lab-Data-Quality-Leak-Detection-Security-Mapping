PYTHON ?= python

check:
	$(PYTHON) -m ruff check telemetry_lab
	$(PYTHON) -m black --check telemetry_lab scripts
	$(PYTHON) -m mypy telemetry_lab/backend telemetry_lab/tests
	$(PYTHON) -m bandit -r telemetry_lab/backend
	$(PYTHON) -m pip_audit -r telemetry_lab/requirements-dev.txt
	$(PYTHON) -m pytest
	$(PYTHON) scripts/check_large_files.py
	npx markdownlint-cli2 README.md telemetry_lab/docs/*.md CHECKLIST.md CI_FAIL_PLAYBOOK.md
	cd telemetry_lab/ui && npm run lint
	cd telemetry_lab/ui && npm run build
	cd telemetry_lab/ui && npx playwright test
