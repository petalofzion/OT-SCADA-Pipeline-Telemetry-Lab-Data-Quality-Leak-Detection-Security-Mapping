import json
import subprocess
from pathlib import Path

import jsonschema


def test_report_cli_output_matches_schema(tmp_path: Path) -> None:
    alerts_path = tmp_path / "alerts.json"
    labels_path = tmp_path / "labels.json"
    report_path = tmp_path / "report.json"

    alerts_payload = [
        {
            "start_index": 3,
            "end_index": 8,
            "confidence": 0.75,
            "reason": "Sustained flow drop vs EWMA baseline",
        }
    ]
    labels_payload = [
        {
            "kind": "missing",
            "start_index": 1,
            "end_index": 2,
            "reason": "Missing telemetry value(s)",
        }
    ]

    alerts_path.write_text(json.dumps(alerts_payload))
    labels_path.write_text(json.dumps(labels_payload))

    script_path = Path(__file__).resolve().parents[1] / "backend" / "report.py"
    subprocess.run(
        [
            "python",
            str(script_path),
            "--alerts",
            str(alerts_path),
            "--labels",
            str(labels_path),
            "--out",
            str(report_path),
        ],
        check=True,
    )

    assert report_path.exists()
    report = json.loads(report_path.read_text())

    schema_dir = Path(__file__).resolve().parents[1] / "schemas"
    report_schema = json.loads((schema_dir / "report.schema.json").read_text())
    resolver = jsonschema.RefResolver(base_uri=f"{schema_dir.as_uri()}/", referrer=report_schema)

    jsonschema.validate(report, report_schema, resolver=resolver)
    assert report["summary"]["alert_count"] == 1
    assert report["summary"]["label_count"] == 1
