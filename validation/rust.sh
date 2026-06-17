#!/usr/bin/env bash

pushd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null

cargo run --manifest-path "../cargo/Cargo.toml" --example w3c_validation &
rust_pid=$!
trap 'kill "$rust_pid" 2>/dev/null || true' EXIT

until nc -z localhost 8000; do echo "Waiting for server to open port..."; sleep 1; done;

./w3c.sh
