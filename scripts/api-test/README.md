# BzFit API Testing Tool

Bash-based API testing tool for BzFit. Works with any AI agent (Claude, Gemini, GPT, etc.) or manual testing.

## Quick Start

```bash
# 1. Load test data (one-time setup)
npm run fixtures:load

# 2. Start API server
npm run dev:server

# 3. Run tests
cd scripts/api-test
./test-api login
./test-api quick-add "Nasi Goreng" "Seafood" "" 250 g LUNCH
./test-api search "chicken"
```

## Installation

The tool is located at `scripts/api-test/` in the project root. No installation needed.

## Prerequisites

1. **Load fixtures** (creates test users and food data):
   ```bash
   npm run fixtures:load
   ```

2. **Start dev server** (must be running for API calls):
   ```bash
   npm run dev:server
   ```

## Test Users

Pre-configured fixture users (from `fixtures/users.yml`):

| Email | Password | Purpose |
|-------|----------|---------|
| `demo@bzfit.local` | `Demo1234!` | Default (auto-used) |
| `admin@bzfit.local` | `Admin1234!` | Admin testing |
| `user@example.com` | `securePassword123` | Alternative |

## Commands

### Authentication

```bash
# Login (stores JWT token in /tmp/bzfit-api-token)
./test-api login

# Login with specific user
./test-api login admin@bzfit.local Admin1234!

# Clear stored token
./test-api logout
```

### Quick-Add Food

Create food + serving + log to meal in one atomic call.

```bash
./test-api quick-add NAME [VARIANT] [BRAND] SIZE UNIT MEAL_TYPE [DATE] [QUANTITY]
```

**Parameters**:
- `NAME` - Food name (required)
- `VARIANT` - Food variant (optional, use `""` to skip)
- `BRAND` - Brand name (optional, use `""` to skip)
- `SIZE` - Serving size (required, numeric)
- `UNIT` - Unit (g, ml, oz, cup, etc.) (required)
- `MEAL_TYPE` - BREAKFAST, LUNCH, DINNER, SNACK (required)
- `DATE` - YYYY-MM-DD (optional, defaults to today)
- `QUANTITY` - Multiplier (optional, defaults to 1.0)

**Examples**:
```bash
./test-api quick-add "Nasi Goreng" "Seafood" "Warung" 250 g LUNCH
./test-api quick-add "Smoothie" "" "" 300 ml BREAKFAST 2026-02-15 1.5
./test-api quick-add "Rice" "" "" 150 g DINNER
```

### Search Foods

```bash
./test-api search QUERY
```

**Examples**:
```bash
./test-api search "chicken"
./test-api search "mcdonald"
./test-api search "rice"
```

### Daily Summary

Get all meals for a date with nutrition totals.

```bash
./test-api daily-summary [DATE]
```

**Examples**:
```bash
./test-api daily-summary                    # Today
./test-api daily-summary 2026-02-14         # Specific date
```

### List Meals

```bash
./test-api list-meals [DATE]
```

**Examples**:
```bash
./test-api list-meals                       # All meals
./test-api list-meals 2026-02-14           # Meals on date
```

### Create Meal

```bash
./test-api create-meal MEAL_TYPE [DATE]
```

**Examples**:
```bash
./test-api create-meal BREAKFAST
./test-api create-meal LUNCH 2026-02-15
```

### Raw API Request

Make authenticated curl request to any endpoint.

```bash
./test-api curl METHOD PATH [JSON_DATA]
```

**Examples**:
```bash
# GET request
./test-api curl GET /api/v1/catalog/foods

# GET with query params
./test-api curl GET "/api/v1/catalog/foods/search?q=rice"

# POST request
./test-api curl POST /api/v1/nutrition/meals \
  '{"mealType":"LUNCH","date":"2026-02-14"}'

# PATCH request
./test-api curl PATCH /api/v1/nutrition/meals/MEAL_ID \
  '{"notes":"Updated"}'

# DELETE request
./test-api curl DELETE /api/v1/nutrition/meals/MEAL_ID
```

## Environment Variables

```bash
# Change API base URL (default: http://localhost:3001)
export BZFIT_API_URL=http://localhost:3001
```

## Response Formatting

Pipe responses through `jq` for pretty formatting:

```bash
# Pretty print
./test-api search "chicken" | jq '.'

# Extract specific fields
./test-api search "chicken" | jq '.[] | {name, brand}'

# Get daily totals
./test-api daily-summary | jq '.totals'

# Count results
./test-api list-meals | jq '. | length'
```

## Testing Workflow

Complete testing workflow example:

```bash
# Setup (one-time)
npm run fixtures:load

# Start server (each session)
npm run dev:server &

# Login
./test-api login

# Test quick-add flow
./test-api quick-add "Homemade Pasta" "" "" 200 g DINNER

# Verify it was added
./test-api search "pasta"
./test-api daily-summary

# Test meal creation
MEAL=$(./test-api create-meal BREAKFAST | jq -r '.id')
echo "Created meal: $MEAL"

# Add item to meal
./test-api curl POST /api/v1/nutrition/meals/$MEAL/items \
  '{"foodId":"FOOD_ID","servingId":"SERVING_ID","quantity":1.0}'

# Get final summary
./test-api daily-summary | jq '.totals'
```

## Troubleshooting

### "Login failed" or "User not found"
**Fix**: Run `npm run fixtures:load` to create test users

### "Connection refused"
**Fix**: Start the server with `npm run dev:server`

### "Token expired"
**Fix**: Get fresh token with `./test-api login`

### Script not executable
**Fix**: `chmod +x ./test-api`

## Token Management

- JWT tokens stored in: `/tmp/bzfit-api-token`
- Auto-reused across commands
- Valid for 7 days
- Automatically included in Authorization header

## For AI Agents

This tool is designed to be invoked by AI agents (Claude, Gemini, GPT, etc.) for automated testing.

**How to use**:
1. Check prerequisites are met (fixtures loaded, server running)
2. Invoke via bash subprocess: `cd scripts/api-test && ./test-api COMMAND`
3. Parse JSON responses for verification

**Tool metadata**: See `tool.json` for structured command reference

**Example agent workflow**:
```
Agent: "I'll test the quick-add endpoint"
Agent runs: cd scripts/api-test && ./test-api login
Agent runs: ./test-api quick-add "Test Food" "" "" 100 g LUNCH
Agent parses response and reports: "✓ Food created with ID: xxx, isEstimated: true"
```

## API Endpoints Covered

| Endpoint | Command |
|----------|---------|
| `POST /api/v1/auth/login` | `login` |
| `POST /api/v1/nutrition/meals/quick-add` | `quick-add` |
| `GET /api/v1/catalog/foods/search` | `search` |
| `GET /api/v1/nutrition/meals/daily-summary` | `daily-summary` |
| `GET /api/v1/nutrition/meals` | `list-meals` |
| `POST /api/v1/nutrition/meals` | `create-meal` |
| Any endpoint | `curl METHOD PATH` |

## Files

- `test-api` - Main executable bash script
- `tool.json` - Structured tool metadata for AI agents
- `README.md` - This documentation

## Contributing

To add new test commands:

1. Add function `cmd_yourcommand()` to `test-api`
2. Add case entry in `main()` function
3. Update `tool.json` with command metadata
4. Document in this README
