from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path

from telemetry_lab.backend import generate_data


def test_generate_and_write_artifacts(tmp_path: Path) -> None:
    points = generate_data.generate_points(start_time=datetime(2024, 1, 1), minutes=360, seed=1)
    assert len(points) == 360

    events = generate_data.inject_quality_issues(points)
    events.append(generate_data.inject_small_leak(points))

    csv_path = tmp_path / "sample.csv"
    json_path = tmp_path / "injections.json"
    generate_data.write_csv(csv_path, points)
    generate_data.write_json(json_path, events)

    with csv_path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == 360
    assert json.loads(json_path.read_text())
