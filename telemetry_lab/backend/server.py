"""Minimal local API server (optional).

This uses the standard library to stay dependency-light. Replace with FastAPI
or Flask if you want richer endpoints.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from telemetry_lab.backend.report import build_report

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


class TelemetryHandler(BaseHTTPRequestHandler):
    def _send_json(self, payload: dict, status: int = 200) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _send_text(self, payload: str, content_type: str, status: int = 200) -> None:
        encoded = payload.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def _send_json_file(self, path: Path) -> None:
        try:
            payload = json.loads(path.read_text())
        except FileNotFoundError:
            self._send_json({"error": "Not found"}, status=404)
            return
        self._send_json(payload)

    def _send_csv_file(self, path: Path) -> None:
        try:
            payload = path.read_text()
        except FileNotFoundError:
            self._send_json({"error": "Not found"}, status=404)
            return
        self._send_text(payload, "text/csv")

    def do_GET(self) -> None:  # noqa: N802 - standard lib signature
        if self.path == "/health":
            self._send_json({"status": "ok"})
            return

        if self.path == "/data/sample":
            self._send_csv_file(DATA_DIR / "sample.csv")
            return

        if self.path == "/data/cleaned":
            self._send_csv_file(DATA_DIR / "cleaned.csv")
            return

        if self.path == "/data/labels":
            self._send_json_file(DATA_DIR / "labels.json")
            return

        if self.path == "/data/alerts":
            self._send_json_file(DATA_DIR / "alerts.json")
            return

        if self.path == "/data/assets":
            self._send_json_file(DATA_DIR / "asset_comms.json")
            return

        if self.path == "/data/report":
            try:
                alerts = json.loads((DATA_DIR / "alerts.json").read_text())
                labels = json.loads((DATA_DIR / "labels.json").read_text())
            except FileNotFoundError:
                self._send_json({"error": "Not found"}, status=404)
                return
            report = build_report(alerts, labels)
            self._send_json(report)
            return

        self._send_json({"error": "Not found"}, status=404)


def main() -> None:
    server = HTTPServer(("127.0.0.1", 8000), TelemetryHandler)
    print("Serving telemetry API on http://localhost:8000")
    server.serve_forever()


if __name__ == "__main__":
    main()
