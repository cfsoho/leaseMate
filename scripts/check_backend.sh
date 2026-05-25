#!/usr/bin/env bash
set -euo pipefail

echo "Checking backend Python files..."
docker compose exec backend python -m compileall app

echo "Checking production Compose config..."
docker compose -f docker-compose.prod.yml config >/dev/null

echo "Backend sanity checks passed."
