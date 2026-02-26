#!/bin/bash
# search-food.sh - Search the BzFit food catalog

# --- Configuration ---
API_BASE_URL="${BZFIT_API_URL:-http://localhost:3001}"
QUERY="$1"

# --- Validation ---
if [ -z "$QUERY" ]; then
  echo "Usage: $0 <query>"
  exit 1
fi

# --- Execution ---
curl -s -G \
  --url "${API_BASE_URL}/api/v1/catalog/foods/search" \
  --data-urlencode "q=${QUERY}" | jq '.'
