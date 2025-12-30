import csv
import json
import subprocess
from pathlib import Path

import jsonschema


def test_detect_leaks_cli_output(tmp_path: Path) -> None:
    input_path = tmp_path / "input.csv"
    output_path = tmp_path / "alerts.json"

    with input_path.open("w", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["timestamp", "flow", "pressure", "temperature"])
        for idx in range(20):
            writer.writerow([f"2024-01-01T00:{idx:02d}:00", "100", "50", "20"])
        for idx in range(20, 30):
            writer.writerow([f"2024-01-01T00:{idx:02d}:00", "96", "48", "20"])

    script_path = Path(__file__).resolve().parents[1] / "backend" / "detect_leaks.py"
    subprocess.run(
        [
            "python",
            str(script_path),
            "--in",
            str(input_path),
            "--out",
            str(output_path),
            "--persistence",
            "3",
        ],
        check=True,
    )

    assert output_path.exists()
    alerts = json.loads(output_path.read_text())
    schema_path = Path(__file__).resolve().parents[1] / "schemas" / "alerts.schema.json"
    schema = json.loads(schema_path.read_text())
    jsonschema.validate(alerts, schema)
    assert alerts, "Expected CLI integration test to produce at least one alert"
