import csv
import json
from pathlib import Path

from telemetry_lab.backend.label_quality import label_quality


def _load_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="") as handle:
        return list(csv.DictReader(handle))


def test_quality_labels_missing_flatline_spike_drift() -> None:
    base_dir = Path(__file__).resolve().parents[1] / "data" / "golden"
    input_path = base_dir / "quality_input.csv"
    expected_path = base_dir / "quality_expected_labels.json"

    rows = _load_csv(input_path)
    labels = label_quality(rows)

    expected = json.loads(expected_path.read_text())
    assert [label.__dict__ for label in labels] == expected
