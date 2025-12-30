import json
from pathlib import Path

import jsonschema

from telemetry_lab.backend.detect_leaks import LeakAlert
from telemetry_lab.backend.label_quality import QualityLabel


def _load_schema(path: Path) -> dict:
    return json.loads(path.read_text())


def _schema_dir() -> Path:
    return Path(__file__).resolve().parents[1] / "schemas"


def test_labels_schema_validation() -> None:
    schema_path = _schema_dir() / "labels.schema.json"
    schema = _load_schema(schema_path)
    labels = [
        QualityLabel(
            kind="missing",
            start_index=1,
            end_index=2,
            reason="Missing telemetry value(s)",
        ).__dict__
    ]
    jsonschema.validate(labels, schema)


def test_alerts_schema_validation() -> None:
    schema_path = _schema_dir() / "alerts.schema.json"
    schema = _load_schema(schema_path)
    alerts = [
        LeakAlert(
            start_index=10,
            end_index=20,
            confidence=0.8,
            reason="Sustained flow drop vs EWMA baseline",
        ).__dict__
    ]
    jsonschema.validate(alerts, schema)


def test_report_schema_validation() -> None:
    schema_dir = _schema_dir()
    report_schema = _load_schema(schema_dir / "report.schema.json")

    resolver = jsonschema.RefResolver(base_uri=f"{schema_dir.as_uri()}/", referrer=report_schema)

    report = {
        "generated_at": "2024-01-01T00:00:00Z",
        "alerts": [
            {
                "start_index": 10,
                "end_index": 12,
                "confidence": 0.9,
                "reason": "Sustained flow drop vs EWMA baseline",
            }
        ],
        "labels": [
            {
                "kind": "missing",
                "start_index": 1,
                "end_index": 2,
                "reason": "Missing telemetry value(s)",
            }
        ],
        "summary": {"alert_count": 1, "label_count": 1},
    }

    jsonschema.validate(report, report_schema, resolver=resolver)
