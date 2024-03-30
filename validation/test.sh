#!/usr/bin/env bash

set -euo pipefail

python3 --version
echo -e "Node $(node --version)"

pushd $(dirname $0) > /dev/null

node test_server.mjs &
node_pid=$!
trap "kill $node_pid" EXIT

until nc -z localhost 8000; do echo "Waiting for server to open port..."; sleep 1; done;

export STRICT_LEVEL=1
export SPEC_LEVEL=2

python3 w3c/test/test.py http://localhost:8000/test || exit 1

kill $node_pid
