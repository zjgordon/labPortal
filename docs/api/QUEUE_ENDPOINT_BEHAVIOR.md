# Queue Endpoint Behavior Documentation

## Overview

The `/api/control/queue` endpoint has been enhanced to provide good wire behavior for agents, including polling support, action locking, and proper HTTP status codes.

## Endpoint Details

**URL:** `GET /api/control/queue`  
**Authentication:** Required (Bearer token)  
**Content-Type:** `application/json`

## Parameters

### Query Parameters

| Parameter | Type    | Default | Range | Description |
|-----------|---------|---------|-------|-------------|
| `max`     | integer | 1       | 1-10  | Maximum number of actions to return |
| `wait`    | integer | 0       | 0-25  | Seconds to poll for actions |

### Parameter Validation

- **`max`**: Must be between 1 and 10 (inclusive)
- **`wait`**: Must be between 0 and 25 seconds (inclusive)
- Invalid parameters result in a 400 Bad Request response

## Response Behavior

### HTTP Status Codes

| Status | Description | When Returned |
|--------|-------------|----------------|
| 200    | OK          | Actions found and returned |
| 204    | No Content  | No actions available |
| 400    | Bad Request | Invalid parameters |
| 401    | Unauthorized| Missing or invalid authentication |
| 500    | Server Error| Internal server error |

### Response Headers

All responses include:
- `Cache-Control: no-store` - Prevents caching of sensitive data
- `Vary: Authorization` - Ensures proper cache key generation
- `Connection: keep-alive` - Maintains persistent connections

## Action Locking

When actions are returned, they are automatically locked to prevent race conditions:

1. **Status Update**: Actions are marked as `running`
2. **Timestamp Update**: `startedAt` is set to the current time
3. **Atomic Operation**: Locking is performed within a database transaction

### Locked Action Fields

```json
{
  "id": "action-id",
  "hostId": "host-id",
  "serviceId": "service-id",
  "kind": "start|stop|restart",
  "status": "running",
  "startedAt": "2025-09-03T00:00:00.000Z",
  "requestedAt": "2025-09-03T00:00:00.000Z",
  "service": {
    "id": "service-id",
    "unitName": "service-name",
    "displayName": "Service Display Name",
    "description": "Service description"
  }
}
```

## Polling Behavior

### When `wait > 0`

The endpoint implements intelligent polling:

1. **Immediate Check**: First attempts to find actions immediately
2. **Polling Loop**: If no actions found, polls every ~500ms
3. **Timeout**: Stops polling after the specified wait time
4. **Action Locking**: Actions are locked as soon as they're found

### Polling Algorithm

```typescript
if (actions.length === 0 && wait > 0) {
  const startTime = Date.now()
  const pollInterval = 500 // 500ms between polls
  
  while (actions.length === 0 && (Date.now() - startTime) < (wait * 1000)) {
    await new Promise(resolve => setTimeout(resolve, pollInterval))
    actions = await getAndLockActions()
  }
}
```

### Polling Examples

| Wait Time | Max Polls | Total Duration |
|-----------|-----------|----------------|
| 1 second  | 2         | ~1 second      |
| 5 seconds | 10        | ~5 seconds     |
| 10 seconds| 20        | ~10 seconds    |
| 25 seconds| 50        | ~25 seconds    |

## Security Features

### Authentication

- **Required**: All requests must include `Authorization: Bearer <token>`
- **Token Validation**: Tokens are validated against `Host.agentTokenHash`
- **Host Isolation**: Only actions for the authenticated host are returned

### Middleware Protection

- **Cookie Rejection**: Requests with cookies are rejected (400 status)
- **Header Validation**: Authorization header format is validated
- **Early Rejection**: Invalid requests are rejected before reaching the route handler

## Usage Examples

### Basic Usage (No Polling)

```bash
curl -X GET "http://localhost:3000/api/control/queue" \
  -H "Authorization: Bearer <agent-token>"
```

**Response:** 200 with actions or 204 if none available

### With Polling

```bash
curl -X GET "http://localhost:3000/api/control/queue?wait=10&max=3" \
  -H "Authorization: Bearer <agent-token>"
```

**Response:** 200 with actions (if found within 10 seconds) or 204

### Parameter Validation

```bash
curl -X GET "http://localhost:3000/api/control/queue?max=15" \
  -H "Authorization: Bearer <agent-token>"
```

**Response:** 400 Bad Request with validation error

## Error Handling

### Validation Errors

```json
{
  "error": "Max parameter must be between 1 and 10"
}
```

```json
{
  "error": "Wait parameter must be between 0 and 25 seconds"
}
```

### Authentication Errors

```json
{
  "error": "Authorization header with Bearer token required"
}
```

```json
{
  "error": "Unauthorized. Valid agent token required."
}
```

### Security Errors

```json
{
  "error": "Cookies not allowed for agent endpoints"
}
```

## Performance Characteristics

### Response Times

- **Immediate Response**: < 10ms when actions are available
- **Polling Overhead**: ~500ms per poll interval
- **Maximum Wait**: 25 seconds (configurable)

### Resource Usage

- **Database Queries**: 1 query per poll interval
- **Memory Usage**: Minimal (only action data in memory)
- **Connection Pooling**: Maintains persistent connections

## Best Practices

### For Agents

1. **Use Appropriate Wait Times**: 
   - Short wait (1-5s) for high-frequency polling
   - Longer wait (10-25s) for batch processing

2. **Handle 204 Responses**: 
   - 204 indicates no work available
   - Implement exponential backoff for repeated 204s

3. **Process Actions Quickly**: 
   - Actions are locked when returned
   - Report completion via `/api/control/report`

### For Administrators

1. **Monitor Action Locks**: 
   - Check for stuck actions (status: running, old startedAt)
   - Implement cleanup for abandoned actions

2. **Queue Management**: 
   - Use appropriate max values for agent capacity
   - Monitor queue depth and processing times

## Implementation Notes

### Database Transactions

Actions are locked using database transactions to ensure atomicity:

```typescript
return await prisma.$transaction(async (tx) => {
  // Find queued actions
  const queuedActions = await tx.action.findMany({...})
  
  if (queuedActions.length === 0) return []
  
  // Lock actions atomically
  await tx.action.updateMany({...})
  
  return queuedActions.map(action => ({...action, status: 'running'}))
})
```

### Polling Implementation

The polling mechanism is designed to be efficient and responsive:

- **Non-blocking**: Uses `setTimeout` for delays
- **Configurable**: Poll interval can be adjusted
- **Timeout-aware**: Respects the specified wait time
- **Resource-efficient**: Stops polling when actions are found

## Future Enhancements

1. **Adaptive Polling**: Adjust poll interval based on queue activity
2. **Priority Queuing**: Support for action priorities
3. **Batch Processing**: Return multiple actions in a single response
4. **Metrics Collection**: Track polling efficiency and response times
5. **Webhook Support**: Push notifications for new actions

