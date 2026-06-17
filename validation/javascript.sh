#!/usr/bin/env bash

set -euo pipefail

pushd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null

deno run --allow-net test_server.ts &
deno_pid=$!
trap 'kill "$deno_pid" 2>/dev/null || true' EXIT

until nc -z localhost 8000; do echo "Waiting for server to open port..."; sleep 1; done;

./w3c.sh
