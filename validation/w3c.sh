#!/usr/bin/env bash

set -euo pipefail

pushd "$(dirname "${BASH_SOURCE[0]}")" > /dev/null

export STRICT_LEVEL=2
export SPEC_LEVEL=2

uv run --no-project --with 'aiohttp>=3.14.1' w3c/test/test.py http://localhost:8000/test || exit 1
