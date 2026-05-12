#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm run build
wrangler pages deploy dist/client --project-name=machtblick-bundestag --branch=main --commit-dirty=true
