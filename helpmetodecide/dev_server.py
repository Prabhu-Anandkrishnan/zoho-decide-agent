#!/usr/bin/env python3
"""Static dev server on :5174 with API proxy to FastAPI (:8000). No npm required."""
from __future__ import annotations

import argparse
import http.server
import json
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_API_TARGET = "http://127.0.0.1:8000"
PROXY_PREFIXES = ("/canshowComparison", "/compare", "/health")


def make_handler(upstream: str):
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            self.upstream = upstream
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def do_OPTIONS(self):
            if self.path.split("?", 1)[0] in PROXY_PREFIXES:
                self.send_response(204)
                self._cors_headers()
                self.end_headers()
                return
            super().do_OPTIONS()

        def do_POST(self):
            if self._proxy():
                return
            self.send_error(405, "Method Not Allowed")

        def do_GET(self):
            if self.path.split("?", 1)[0] == "/health" and self._proxy():
                return
            super().do_GET()

        def _proxy(self) -> bool:
            path = self.path.split("?", 1)[0]
            if path not in PROXY_PREFIXES:
                return False

            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else None
            url = self.upstream + self.path

            req = urllib.request.Request(
                url,
                data=body,
                method=self.command,
                headers={"Content-Type": self.headers.get("Content-Type", "application/json")},
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    payload = resp.read()
                    self.send_response(resp.status)
                    self._cors_headers()
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                    self.send_header("Content-Length", str(len(payload)))
                    self.end_headers()
                    self.wfile.write(payload)
            except urllib.error.HTTPError as err:
                payload = err.read()
                self.send_response(err.code)
                self._cors_headers()
                self.send_header("Content-Type", err.headers.get("Content-Type", "application/json"))
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
            except urllib.error.URLError as err:
                msg = json.dumps({"detail": f"API unreachable at {self.upstream}: {err.reason}"}).encode()
                self.send_response(502)
                self._cors_headers()
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(msg)))
                self.end_headers()
                self.wfile.write(msg)
            return True

        def _cors_headers(self) -> None:
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")

        def log_message(self, fmt, *args):
            print(f"[dev:5174] {self.address_string()} - {fmt % args}")

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description="Help Me Decide dev server")
    parser.add_argument("--port", type=int, default=5174)
    parser.add_argument("--api", default=DEFAULT_API_TARGET, help="FastAPI upstream")
    args = parser.parse_args()

    api_target = args.api.rstrip("/")
    handler = make_handler(api_target)
    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    print(f"Serving {ROOT} at http://127.0.0.1:{args.port}/")
    print(f"Proxying {PROXY_PREFIXES} → {api_target}")
    server.serve_forever()


if __name__ == "__main__":
    main()
