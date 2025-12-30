"""Minimal local API server (optional).

This uses the standard library to stay dependency-light. Replace with FastAPI
or Flask if you want richer endpoints.
"""

from __future__ import annotations

import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parents[1] / "data"


class TelemetryHandler(BaseHTTPRequestHandler):
    def _send_json(self, payload: dict, status: int = 200) -> None:
        encoded = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802 - standard lib signature
        if self.path == "/health":
            self._send_json({"status": "ok"})
            return

        if self.path == "/data/alerts":
            payload = json.loads((DATA_DIR / "alerts.json").read_text())
            self._send_json({"alerts": payload})
            return

        self._send_json({"error": "Not found"}, status=404)


def main() -> None:
    server = HTTPServer(("127.0.0.1", 8000), TelemetryHandler)
    print("Serving telemetry API on http://localhost:8000")
    server.serve_forever()


if __name__ == "__main__":
    main()
