from __future__ import annotations

import json
import threading
import urllib.request
from http.server import HTTPServer
from pathlib import Path

from telemetry_lab.backend import server


def _start_server(tmp_path: Path) -> tuple[HTTPServer, threading.Thread]:
    (tmp_path / "sample.csv").write_text(
        "timestamp,flow,pressure,temperature\n2024-01-01T00:00:00,100,50,20\n"
    )
    (tmp_path / "cleaned.csv").write_text(
        "timestamp,flow,pressure,temperature\n2024-01-01T00:00:00,100,50,20\n"
    )
    (tmp_path / "labels.json").write_text(
        json.dumps([{"kind": "missing", "start_index": 1, "end_index": 2, "reason": "Test"}])
    )
    (tmp_path / "alerts.json").write_text(
        json.dumps([{"start_index": 1, "end_index": 2, "confidence": 0.7, "reason": "Test"}])
    )
    (tmp_path / "asset_comms.json").write_text(
        json.dumps(
            {
                "trustBoundaries": [{"id": "tb-1", "label": "Test", "color": "#000"}],
                "assets": [],
                "communications": [],
            }
        )
    )
    server.DATA_DIR = tmp_path
    httpd = HTTPServer(("127.0.0.1", 0), server.TelemetryHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, thread


def test_server_health_and_alerts(tmp_path: Path) -> None:
    httpd, thread = _start_server(tmp_path)
    try:
        base_url = f"http://127.0.0.1:{httpd.server_port}"
        with urllib.request.urlopen(f"{base_url}/health") as response:
            payload = json.loads(response.read().decode("utf-8"))
        assert payload == {"status": "ok"}

        with urllib.request.urlopen(f"{base_url}/data/alerts") as response:
            payload = json.loads(response.read().decode("utf-8"))
        assert payload

        with urllib.request.urlopen(f"{base_url}/data/labels") as response:
            payload = json.loads(response.read().decode("utf-8"))
        assert payload

        with urllib.request.urlopen(f"{base_url}/data/assets") as response:
            payload = json.loads(response.read().decode("utf-8"))
        assert payload["trustBoundaries"]

        with urllib.request.urlopen(f"{base_url}/data/report") as response:
            payload = json.loads(response.read().decode("utf-8"))
        assert payload["summary"]["alert_count"] == 1

        with urllib.request.urlopen(f"{base_url}/data/sample") as response:
            payload = response.read().decode("utf-8")
        assert "timestamp,flow,pressure,temperature" in payload

        with urllib.request.urlopen(f"{base_url}/data/cleaned") as response:
            payload = response.read().decode("utf-8")
        assert "timestamp,flow,pressure,temperature" in payload

        try:
            urllib.request.urlopen(f"{base_url}/missing")
        except urllib.error.HTTPError as exc:
            assert exc.code == 404
        else:
            raise AssertionError("Expected 404 for missing endpoint")
    finally:
        httpd.shutdown()
        thread.join(timeout=1)
