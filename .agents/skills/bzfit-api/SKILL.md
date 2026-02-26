---
name: bzfit-api
description: Interacts with a self-hosted BzFit instance via its REST API to search the food catalog, log meals, view nutrition data, and manage foods.
---

# BzFit API Skill

This skill provides a command-line interface to interact with the BzFit self-hosted calorie tracking application's REST API.

## API Base URL

The scripts assume the BzFit server is running at `http://localhost:3001`. If your instance is hosted elsewhere, you must set the `BZFIT_API_URL` environment variable.

\`\`\`bash
export BZFIT_API_URL="http://your-bzfit-instance.com"
\`\`\`

## Authentication

For actions that require authentication (like logging meals), you need to provide a JWT token via the `BZFIT_AUTH_TOKEN` environment variable.

\`\`\`bash
export BZFIT_AUTH_TOKEN="your-jwt-token"
\`\`\`

## Scripts

All scripts are located in the `scripts/` directory and should be executed from the skill's root directory (`.agents/skills/bzfit-api`).

### Food Catalog

#### Search Food
Search the food catalog by a query string.

**Usage:**
\`\`\`bash
./scripts/search-food.sh "query"
\`\`\`
**Example:**
\`\`\`bash
./scripts/search-food.sh "nasi goreng"
\`\`\`

#### List Items Needing Review
Get a list of foods and servings that have the status `NEEDS_REVIEW`.

**Usage:**
\`\`\`bash
./scripts/list-needs-review.sh
\`\`\`

#### Update Serving
Update the nutritional information for a specific serving and change its status.

**Usage:**
\`\`\`bash
./scripts/update-serving.sh <serving_id> <json_payload>
\`\`\`
**Example:**
\`\`\`bash
./scripts/update-serving.sh "serving_id_123" '{"name": "Regular", "calories": 350, "carbs": 40, "protein": 10, "fat": 15, "status": "VERIFIED"}'
\`\`\`

### Meal Logging

#### Quick Add Meal
Quickly add a food item to a meal for a specific date. If the food doesn't exist, it will be created with `NEEDS_REVIEW` status.

**Usage:**
\`\`\`bash
./scripts/quick-add-meal.sh <json_payload>
\`\`\`
**Example:**
\`\`\`bash
./scripts/quick-add-meal.sh '{"query": "Nasi Uduk", "servingName": "1 porsi", "date": "2026-02-26", "mealType": "BREAKFAST"}'
\`\`\`

#### Get Daily Summary
Get the nutritional summary for a specific date.

**Usage:**
\`\`\`bash
./scripts/get-daily-summary.sh <date>
\`\`\`
**Example:**
\`\`\`bash
./scripts/get-daily-summary.sh "2026-02-26"
\`\`\`
