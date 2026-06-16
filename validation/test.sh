#!/usr/bin/env bash

set -euo pipefail

uv --version

pushd $(dirname $0) > /dev/null

deno run --allow-net test_server.ts &
deno_pid=$!
trap "kill $deno_pid" EXIT

until nc -z localhost 8000; do echo "Waiting for server to open port..."; sleep 1; done;

export STRICT_LEVEL=1
export SPEC_LEVEL=2

uv run --no-project --script - http://localhost:8000/test <<'PY' || exit 1
# /// script
# dependencies = [
#   "aiohttp>=3.14.1"
# ]
# ///
import asyncio, runpy, sys

sys.path.insert(0, "w3c/test")
sys.argv = ["w3c/test/test.py", *sys.argv[1:]]
asyncio.set_event_loop(asyncio.new_event_loop())
runpy.run_path("w3c/test/test.py", run_name="__main__")
PY
