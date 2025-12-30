"""Fail if tracked files exceed a size threshold."""
from __future__ import annotations

import subprocess
from pathlib import Path

MAX_BYTES = 2 * 1024 * 1024  # 2 MB


def main() -> None:
    result = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True)
    oversized = []
    for line in result.stdout.splitlines():
        path = Path(line)
        if path.is_file() and path.stat().st_size > MAX_BYTES:
            oversized.append((path, path.stat().st_size))

    if oversized:
        print("Large files detected:")
        for path, size in oversized:
            print(f"- {path} ({size} bytes)")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
