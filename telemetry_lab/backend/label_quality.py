"""Label data quality issues in telemetry.

This script scans the CSV and outputs labeled segments + a cleaned CSV.
"""

from __future__ import annotations

import csv
import json
import math
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


@dataclass
class QualityLabel:
    kind: str
    start_index: int
    end_index: int
    reason: str


def _is_missing(value: str) -> bool:
    try:
        return math.isnan(float(value))
    except ValueError:
        return True


def _row_has_missing(row: dict[str, str]) -> bool:
    return any(_is_missing(row[key]) for key in ("flow", "pressure", "temperature"))


def label_quality(rows: list[dict[str, str]]) -> list[QualityLabel]:
    labels: list[QualityLabel] = []

    # Missing data detection (any signal)
    missing_indices = [i for i, row in enumerate(rows) if _row_has_missing(row)]
    if missing_indices:
        start_index = missing_indices[0]
        previous_index = start_index
        for index in missing_indices[1:]:
            if index != previous_index + 1:
                labels.append(
                    QualityLabel(
                        kind="missing",
                        start_index=start_index,
                        end_index=previous_index,
                        reason="Missing telemetry value(s)",
                    )
                )
                start_index = index
            previous_index = index
        labels.append(
            QualityLabel(
                kind="missing",
                start_index=start_index,
                end_index=previous_index,
                reason="Missing telemetry value(s)",
            )
        )

    # Flatline detection (simple window, ignore windows with missing)
    window = 8
    for idx in range(len(rows) - window):
        window_rows = rows[idx : idx + window]
        if any(_row_has_missing(row) for row in window_rows):
            continue
        window_values = [float(row["flow"]) for row in window_rows]
        if len(set(window_values)) == 1:
            labels.append(
                QualityLabel(
                    kind="flatline",
                    start_index=idx,
                    end_index=idx + window - 1,
                    reason="Flow sensor flatline",
                )
            )
            break

    # Spike detection (single point range for UI visibility)
    for idx in range(1, len(rows) - 1):
        if (
            _row_has_missing(rows[idx - 1])
            or _row_has_missing(rows[idx])
            or _row_has_missing(rows[idx + 1])
        ):
            continue
        prev_val = float(rows[idx - 1]["pressure"])
        next_val = float(rows[idx + 1]["pressure"])
        cur_val = float(rows[idx]["pressure"])
        if cur_val > max(prev_val, next_val) + 10:
            labels.append(
                QualityLabel(
                    kind="spike",
                    start_index=idx,
                    end_index=idx + 1,
                    reason="Pressure spike outlier",
                )
            )
            break

    # Drift detection (temperature slope)
    drift_window = 12
    for idx in range(len(rows) - drift_window):
        window_rows = rows[idx : idx + drift_window]
        if any(_row_has_missing(row) for row in window_rows):
            continue
        start_temp = float(window_rows[0]["temperature"])
        end_temp = float(window_rows[-1]["temperature"])
        if end_temp - start_temp > 2.0:
            labels.append(
                QualityLabel(
                    kind="drift",
                    start_index=idx,
                    end_index=idx + drift_window - 1,
                    reason="Temperature drift detected",
                )
            )
            break

    return labels


def clean_rows(rows: Iterable[dict[str, str]]) -> list[dict[str, str]]:
    cleaned: list[dict[str, str]] = []
    for row in rows:
        if _row_has_missing(row):
            continue
        cleaned.append(row)
    return cleaned


def write_csv(path: Path, rows: Iterable[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["timestamp", "flow", "pressure", "temperature"])
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_json(path: Path, labels: list[QualityLabel]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = [asdict(label) for label in labels]
    path.write_text(json.dumps(payload, indent=2))


def main() -> None:
    data_dir = Path(__file__).resolve().parents[1] / "data"
    input_path = data_dir / "sample.csv"

    with input_path.open("r", newline="") as handle:
        rows = list(csv.DictReader(handle))

    labels = label_quality(rows)
    cleaned = clean_rows(rows)

    write_csv(data_dir / "cleaned.csv", cleaned)
    write_json(data_dir / "labels.json", labels)


if __name__ == "__main__":
    main()
