"""Synthetic telemetry generator for OT/SCADA pipeline lab.

This module focuses on clarity and explainability. It is intentionally small
and has inline TODOs where future enhancements should go.
"""
from __future__ import annotations

import csv
import json
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
from random import Random
from typing import Iterable, List


@dataclass
class TelemetryPoint:
    timestamp: str
    flow: float
    pressure: float
    temperature: float


@dataclass
class InjectionEvent:
    kind: str
    start_index: int
    end_index: int
    description: str


def _base_profile(step: int) -> tuple[float, float, float]:
    """Return baseline flow/pressure/temperature for a time step."""
    flow = 100.0 + 2.5 * (step % 24)
    pressure = 50.0 + 0.4 * (step % 48)
    temperature = 20.0 + 0.1 * (step % 72)
    return flow, pressure, temperature


def generate_points(
    *,
    start_time: datetime,
    minutes: int,
    seed: int = 42,
) -> list[TelemetryPoint]:
    """Generate a baseline time-series with no quality issues."""
    rng = Random(seed)
    points: list[TelemetryPoint] = []
    for step in range(minutes):
        base_flow, base_pressure, base_temp = _base_profile(step)
        jitter = rng.uniform(-0.5, 0.5)
        points.append(
            TelemetryPoint(
                timestamp=(start_time + timedelta(minutes=step)).isoformat(),
                flow=base_flow + jitter,
                pressure=base_pressure + jitter * 0.3,
                temperature=base_temp + jitter * 0.1,
            )
        )
    return points


def inject_quality_issues(points: list[TelemetryPoint]) -> list[InjectionEvent]:
    """Inject missing data, flatlines, spikes, and drift."""
    events: list[InjectionEvent] = []

    # Missing block
    for idx in range(60, 70):
        points[idx].flow = float("nan")
        points[idx].pressure = float("nan")
    events.append(
        InjectionEvent(
            kind="missing",
            start_index=60,
            end_index=69,
            description="10-minute missing telemetry window",
        )
    )

    # Flatline
    flat_value = points[120].flow
    for idx in range(120, 135):
        points[idx].flow = flat_value
    events.append(
        InjectionEvent(
            kind="flatline",
            start_index=120,
            end_index=134,
            description="Flow sensor stuck (flatline)",
        )
    )

    # Spike
    points[180].pressure += 20.0
    events.append(
        InjectionEvent(
            kind="spike",
            start_index=180,
            end_index=180,
            description="Pressure spike outlier",
        )
    )

    # Drift
    for offset, idx in enumerate(range(220, 240)):
        points[idx].temperature += offset * 0.2
    events.append(
        InjectionEvent(
            kind="drift",
            start_index=220,
            end_index=239,
            description="Temperature sensor drift",
        )
    )

    return events


def inject_small_leak(points: list[TelemetryPoint]) -> InjectionEvent:
    """Inject a subtle leak pattern as a sustained reduction in flow."""
    for idx in range(260, 300):
        points[idx].flow -= 3.5
        points[idx].pressure -= 1.2
    return InjectionEvent(
        kind="small_leak",
        start_index=260,
        end_index=299,
        description="Sustained drop in flow/pressure",
    )


def write_csv(path: Path, points: Iterable[TelemetryPoint]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["timestamp", "flow", "pressure", "temperature"])
        writer.writeheader()
        for point in points:
            writer.writerow(asdict(point))


def write_json(path: Path, events: List[InjectionEvent]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = [asdict(event) for event in events]
    path.write_text(json.dumps(payload, indent=2))


def main() -> None:
    """Generate a full synthetic run and persist artifacts."""
    output_dir = Path(__file__).resolve().parents[1] / "data"
    points = generate_points(start_time=datetime(2024, 1, 1, 0, 0), minutes=360)
    events = inject_quality_issues(points)
    events.append(inject_small_leak(points))

    write_csv(output_dir / "sample.csv", points)
    write_json(output_dir / "injections.json", events)


if __name__ == "__main__":
    main()
