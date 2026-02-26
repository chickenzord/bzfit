#!/bin/bash
# list-needs-review.sh - List items needing nutritional review

# --- Configuration ---
API_BASE_URL="${BZFIT_API_URL:-http://localhost:3001}"

# --- Execution ---
curl -s "${API_BASE_URL}/api/v1/catalog/needs-review" | jq '.'
