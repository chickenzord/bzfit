#!/bin/bash
# update-serving.sh - Update a serving's nutritional information

# --- Configuration ---
API_BASE_URL="${BZFIT_API_URL:-http://localhost:3001}"
SERVING_ID="$1"
JSON_PAYLOAD="$2"

# --- Validation ---
if [ -z "$SERVING_ID" ] || [ -z "$JSON_PAYLOAD" ]; then
  echo "Usage: $0 <serving_id> '<json_payload>'"
  exit 1
fi

if [ -z "$BZFIT_AUTH_TOKEN" ]; then
  echo "Error: BZFIT_AUTH_TOKEN environment variable is not set."
  exit 1
fi

# --- Execution ---
curl -s -X PATCH \
  --url "${API_BASE_URL}/api/v1/catalog/servings/${SERVING_ID}" \
  --header "Authorization: Bearer ${BZFIT_AUTH_TOKEN}" \
  --header "Content-Type: application/json" \
  --data "${JSON_PAYLOAD}" | jq '.'
