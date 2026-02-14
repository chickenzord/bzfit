# Using API Test Tool with AI Agents

This document shows how different AI agents can use the API testing tool.

## Tool Location

**Path**: `scripts/api-test/test-api`
**Metadata**: `scripts/api-test/tool.json`

## General Pattern

All AI agents can invoke the tool via bash subprocess:

```bash
cd scripts/api-test && ./test-api COMMAND [ARGS...]
```

## Claude Code

Claude Code can use the tool directly with the Bash tool:

```typescript
// Claude invokes:
Bash({
  command: "cd scripts/api-test && ./test-api login",
  description: "Login to get JWT token"
})

// Then test endpoints:
Bash({
  command: 'cd scripts/api-test && ./test-api quick-add "Test Food" "" "" 100 g LUNCH',
  description: "Test quick-add endpoint"
})

// Parse responses with jq:
Bash({
  command: "cd scripts/api-test && ./test-api search 'chicken' | jq '.[] | {name, brand}'",
  description: "Search and extract fields"
})
```

### Claude Code Workflow

1. **Check server running**: `ps aux | grep "npm run dev:server"`
2. **Check fixtures loaded**: `./test-api login` (if fails, prompt user to run fixtures)
3. **Run tests**: Execute test commands
4. **Parse results**: Use `jq` for JSON parsing
5. **Report**: Summarize results to user

## Google Gemini

Gemini can use code execution to run bash commands:

```python
# Gemini can execute:
import subprocess
import json

# Login
result = subprocess.run(
    ["./test-api", "login"],
    cwd="scripts/api-test",
    capture_output=True,
    text=True
)
token = result.stdout.strip()

# Test endpoint
result = subprocess.run(
    ["./test-api", "quick-add", "Test Food", "", "", "100", "g", "LUNCH"],
    cwd="scripts/api-test",
    capture_output=True,
    text=True
)
response = json.loads(result.stdout)
print(f"Created meal: {response['id']}")
```

## OpenAI GPT (with Code Interpreter)

GPT with code interpreter can run bash commands:

```python
# GPT can execute:
import subprocess
import json

def run_api_test(command):
    """Run BzFit API test command"""
    result = subprocess.run(
        f"cd scripts/api-test && ./test-api {command}",
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout

# Login
run_api_test("login")

# Test quick-add
response = run_api_test('quick-add "Nasi Goreng" "Seafood" "" 250 g LUNCH')
data = json.loads(response)
print(f"Meal created: {data['mealType']} on {data['date']}")
```

## Manual Testing

Developers can use the tool directly:

```bash
cd scripts/api-test

# Login
./test-api login

# Run tests
./test-api quick-add "Test" "" "" 100 g LUNCH | jq '.'
./test-api search "test" | jq '.'
./test-api daily-summary | jq '.totals'
```

## Integration Checklist

When an AI agent starts testing:

- [ ] Check if server is running (port 3001)
- [ ] Check if fixtures are loaded (try login, if fails prompt to run `npm run fixtures:load`)
- [ ] Login to get token
- [ ] Execute test commands
- [ ] Parse JSON responses
- [ ] Report results to user

## Common Scenarios

### Test New Endpoint

```bash
# Agent workflow:
1. ./test-api login
2. ./test-api curl POST /api/v1/new/endpoint '{"data":"test"}'
3. Parse response and verify
```

### Verify Quick-Add Flow

```bash
# Agent workflow:
1. ./test-api login
2. ./test-api quick-add "Test Food" "" "" 100 g LUNCH
3. Extract foodId and servingId from response
4. Verify isEstimated: true
5. Verify serving status: NEEDS_REVIEW
```

### Test Daily Summary

```bash
# Agent workflow:
1. ./test-api login
2. ./test-api quick-add "Food 1" "" "" 100 g BREAKFAST
3. ./test-api quick-add "Food 2" "" "" 200 g LUNCH
4. ./test-api daily-summary | jq '.totals'
5. Verify totals calculated correctly
```

## Error Handling

All agents should handle these common errors:

### Login Fails
```
Error: Login failed. Run 'npm run fixtures:load' to create fixture users.
```
**Action**: Prompt user to run fixtures or run it automatically

### Connection Refused
```
curl: (7) Failed to connect to localhost port 3001
```
**Action**: Prompt user to start server with `npm run dev:server`

### Token Expired
```
{"statusCode":401,"message":"Unauthorized"}
```
**Action**: Run `./test-api login` again

## Response Format

All API responses are JSON. Use `jq` or JSON parsers:

```bash
# Example response from quick-add:
{
  "id": "meal-id",
  "userId": "user-id",
  "date": "2026-02-14",
  "mealType": "LUNCH",
  "items": [{
    "id": "item-id",
    "foodId": "food-id",
    "servingId": "serving-id",
    "isEstimated": true,
    "food": {"name": "Test Food"},
    "serving": {"size": 100, "unit": "g"}
  }],
  "totals": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
}
```

## Tool Metadata

For programmatic access to tool capabilities, read `tool.json`:

```bash
# Agent can read metadata:
cat scripts/api-test/tool.json
```

Contains:
- Available commands
- Parameter definitions
- Examples
- Prerequisites
- Environment variables
- Fixture user credentials

## Best Practices

1. **Always login first**: Token is cached for efficiency
2. **Use jq for parsing**: Easier than string manipulation
3. **Check prerequisites**: Server running, fixtures loaded
4. **Handle errors gracefully**: Provide helpful messages
5. **Report clearly**: Show what was tested and results
6. **Clean up**: Logout after testing (optional)

## Example: Full Test Session

```bash
# Complete agent workflow:

# 1. Verify prerequisites
echo "Checking server..." && curl -s http://localhost:3001/api > /dev/null && echo "✓ Server running"

# 2. Login
TOKEN=$(./test-api login)
echo "✓ Logged in"

# 3. Test quick-add
MEAL=$(./test-api quick-add "Test Food" "" "" 100 g LUNCH | jq -r '.id')
echo "✓ Created meal: $MEAL"

# 4. Verify
SUMMARY=$(./test-api daily-summary | jq '.meals | length')
echo "✓ Daily meals count: $SUMMARY"

# 5. Report
echo "All tests passed!"
```
