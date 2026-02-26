#!/bin/bash
# quick-add-meal.sh - Quick-add a food item to a meal

# --- Configuration ---
API_BASE_URL="${BZFIT_API_URL:-http://localhost:3001}"
JSON_PAYLOAD="$1"

# --- Validation ---
if [ -z "$JSON_PAYLOAD" ]; then
  echo "Usage: $0 '<json_payload>'"
  exit 1
fi

if [ -z "$BZFIT_AUTH_TOKEN" ]; then
  echo "Error: BZFIT_AUTH_TOKEN environment variable is not set."
  exit 1
fi

# --- Execution ---
curl -s -X POST \
  --url "${API_BASE_URL}/api/v1/nutrition/quick-add" \
  --header "Authorization: Bearer ${BZFIT_AUTH_TOKEN}" \
  --header "Content-Type: application/json" \
  --data "${JSON_PAYLOAD}" | jq '.'
