#!/bin/bash
# get-daily-summary.sh - Get the nutritional summary for a specific date

# --- Configuration ---
API_BASE_URL="${BZFIT_API_URL:-http://localhost:3001}"
DATE="$1"

# --- Validation ---
if [ -z "$DATE" ]; then
  echo "Usage: $0 <date e.g., 2026-02-26>"
  exit 1
fi

if [ -z "$BZFIT_AUTH_TOKEN" ]; then
  echo "Error: BZFIT_AUTH_TOKEN environment variable is not set."
  exit 1
fi

# --- Execution ---
curl -s -G \
  --url "${API_BASE_URL}/api/v1/nutrition/meals/daily-summary" \
  --header "Authorization: Bearer ${BZFIT_AUTH_TOKEN}" \
  --data-urlencode "date=${DATE}" | jq '.'
