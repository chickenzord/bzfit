#!/bin/bash
# EAS pre-install hook — runs inside the EAS temp build directory.
#
# Writes google-services.json from the GOOGLE_SERVICES_JSON_BASE64 env var.
# This is necessary because EAS builds from a clean git snapshot, so
# gitignored files (like google-services.json) are never present in the
# temp dir — they must be reconstructed from an env var.
#
# Local builds:  set GOOGLE_SERVICES_JSON_BASE64 in your shell before running
#                eas build --local, e.g.:
#                  export GOOGLE_SERVICES_JSON_BASE64=$(base64 -i google-services.json)
# CI builds:     GOOGLE_SERVICES_JSON_BASE64 is injected from GitHub Secrets.

set -euo pipefail

if [ -n "${GOOGLE_SERVICES_JSON_BASE64:-}" ]; then
  echo "$GOOGLE_SERVICES_JSON_BASE64" | base64 -d > google-services.json
  echo "✅ google-services.json written from GOOGLE_SERVICES_JSON_BASE64"
else
  echo "❌ GOOGLE_SERVICES_JSON_BASE64 is not set. Cannot write google-services.json."
  echo "   For local builds: export GOOGLE_SERVICES_JSON_BASE64=\$(base64 -i google-services.json)"
  exit 1
fi
