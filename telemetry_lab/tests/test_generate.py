import hashlib
from datetime import datetime
from pathlib import Path

from telemetry_lab.backend.generate_data import generate_points, write_csv


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def test_generate_reproducible_seed(tmp_path: Path) -> None:
    output_path = tmp_path / "seed_123.csv"
    points = generate_points(start_time=datetime(2024, 1, 1), minutes=12, seed=123)
    write_csv(output_path, points)

    golden_path = Path(__file__).resolve().parents[1] / "data" / "golden" / "seed_123.csv"
    assert _sha256(output_path) == _sha256(golden_path)
