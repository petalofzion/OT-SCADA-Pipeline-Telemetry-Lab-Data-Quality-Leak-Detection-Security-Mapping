"""Build incident reports from alerts + labels."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def build_report(
    alerts: list[dict[str, Any]],
    labels: list[dict[str, Any]],
    *,
    generated_at: str | None = None,
) -> dict[str, Any]:
    """Assemble a report payload that conforms to report.schema.json."""
    timestamp = generated_at or datetime.now(timezone.utc).isoformat()
    summary = {
        "alert_count": len(alerts),
        "label_count": len(labels),
    }
    return {
        "generated_at": timestamp,
        "alerts": alerts,
        "labels": labels,
        "summary": summary,
    }


def _load_json(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text())


def write_report(path: Path, report: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(report, indent=2))


def build_report_csv_rows(report: dict[str, Any]) -> list[dict[str, Any]]:
    generated_at = report.get("generated_at", "")
    rows = []
    for alert in report.get("alerts", []):
        rows.append(
            {
                "record_type": "alert",
                "generated_at": generated_at,
                "kind": "",
                "start_index": alert.get("start_index"),
                "end_index": alert.get("end_index"),
                "confidence": alert.get("confidence"),
                "reason": alert.get("reason", ""),
            }
        )
    for label in report.get("labels", []):
        rows.append(
            {
                "record_type": "label",
                "generated_at": generated_at,
                "kind": label.get("kind", ""),
                "start_index": label.get("start_index"),
                "end_index": label.get("end_index"),
                "confidence": "",
                "reason": label.get("reason", ""),
            }
        )
    return rows


def write_report_csv(path: Path, report: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rows = build_report_csv_rows(report)
    fieldnames = [
        "record_type",
        "generated_at",
        "kind",
        "start_index",
        "end_index",
        "confidence",
        "reason",
    ]
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def parse_args() -> argparse.Namespace:
    data_dir = Path(__file__).resolve().parents[1] / "data"
    parser = argparse.ArgumentParser(description="Build a report from alerts and labels.")
    parser.add_argument(
        "--alerts",
        dest="alerts_path",
        default=str(data_dir / "alerts.json"),
        help="Path to the alerts JSON file.",
    )
    parser.add_argument(
        "--labels",
        dest="labels_path",
        default=str(data_dir / "labels.json"),
        help="Path to the labels JSON file.",
    )
    parser.add_argument(
        "--out",
        dest="output_path",
        default=str(data_dir / "report.json"),
        help="Path for the report output JSON.",
    )
    parser.add_argument(
        "--ui-out",
        dest="ui_output_path",
        default=None,
        help="Optional path to mirror the report into the UI data folder.",
    )
    parser.add_argument(
        "--csv-out",
        dest="csv_output_path",
        default=None,
        help="Optional path for the report CSV output.",
    )
    parser.add_argument(
        "--ui-csv-out",
        dest="ui_csv_output_path",
        default=None,
        help="Optional path to mirror the report CSV into the UI data folder.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    alerts = _load_json(Path(args.alerts_path))
    labels = _load_json(Path(args.labels_path))
    report = build_report(alerts, labels)
    write_report(Path(args.output_path), report)
    if args.ui_output_path:
        write_report(Path(args.ui_output_path), report)
    if args.csv_output_path:
        write_report_csv(Path(args.csv_output_path), report)
    if args.ui_csv_output_path:
        write_report_csv(Path(args.ui_csv_output_path), report)


if __name__ == "__main__":
    main()
