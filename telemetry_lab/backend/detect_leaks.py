"""Leak detection baseline using EWMA + persistence window."""
from __future__ import annotations

import argparse
import csv
import json
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, List


@dataclass
class LeakAlert:
    start_index: int
    end_index: int
    confidence: float
    reason: str


def ewma(values: list[float], alpha: float = 0.3) -> list[float]:
    smoothed: list[float] = []
    prev = values[0]
    for value in values:
        prev = alpha * value + (1 - alpha) * prev
        smoothed.append(prev)
    return smoothed


def detect_leaks(flow_values: list[float], persistence: int = 6) -> list[LeakAlert]:
    """Detect sustained flow drops relative to EWMA baseline."""
    if not flow_values:
        return []

    baseline = ewma(flow_values)
    alerts: list[LeakAlert] = []

    below: list[int] = []
    for idx, (value, base) in enumerate(zip(flow_values, baseline)):
        if value < base - 2.5:
            below.append(idx)
        else:
            if len(below) >= persistence:
                alerts.append(
                    LeakAlert(
                        start_index=below[0],
                        end_index=below[-1],
                        confidence=min(0.95, 0.5 + 0.05 * len(below)),
                        reason="Sustained flow drop vs EWMA baseline",
                    )
                )
            below = []

    if len(below) >= persistence:
        alerts.append(
            LeakAlert(
                start_index=below[0],
                end_index=below[-1],
                confidence=min(0.95, 0.5 + 0.05 * len(below)),
                reason="Sustained flow drop vs EWMA baseline",
            )
        )

    return alerts


def read_flow(path: Path) -> list[float]:
    with path.open("r", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return [float(row["flow"]) for row in rows]


def write_json(path: Path, alerts: Iterable[LeakAlert]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = [asdict(alert) for alert in alerts]
    path.write_text(json.dumps(payload, indent=2))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Detect leak events from a CSV file.")
    parser.add_argument(
        "--in",
        dest="input_path",
        default=str(Path(__file__).resolve().parents[1] / "data" / "cleaned.csv"),
        help="Input CSV file with cleaned telemetry.",
    )
    parser.add_argument(
        "--out",
        dest="output_path",
        default=str(Path(__file__).resolve().parents[1] / "data" / "alerts.json"),
        help="Output JSON file for alerts.",
    )
    parser.add_argument(
        "--persistence",
        type=int,
        default=6,
        help="Number of consecutive points required to trigger an alert.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    alerts = detect_leaks(read_flow(Path(args.input_path)), persistence=args.persistence)
    write_json(Path(args.output_path), alerts)


if __name__ == "__main__":
    main()
