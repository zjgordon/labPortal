# Control Actions API

The Control Actions API allows administrators to request start, stop, and restart operations for managed services on hosts.

## Authentication

All endpoints require admin authentication. Use the admin login at `/admin/login` with credentials:
- Email: `admin@local`
- Password: `admin123`

## Endpoints

### POST /api/control/actions

Create a new control action to start, stop, or restart a service.

**Request Body:**
```json
{
  "hostId": "string",
  "serviceId": "string", 
  "kind": "start" | "stop" | "restart"
}
```

**Response (201 Created):**
```json
{
  "id": "action-id",
  "hostId": "host-id",
  "serviceId": "service-id",
  "kind": "start",
  "status": "queued",
  "requestedBy": "admin@local",
  "requestedAt": "2025-09-02T21:24:39.000Z",
  "startedAt": null,
  "finishedAt": null,
  "exitCode": null,
  "message": null,
  "host": {
    "id": "host-id",
    "name": "host-name"
  },
  "service": {
    "id": "service-id",
    "unitName": "nginx.service",
    "displayName": "Nginx Web Server"
  }
}
```

**Validation Rules:**
- `hostId` must reference an existing host
- `serviceId` must reference an existing service
- The service must belong to the specified host
- `kind` must be one of: "start", "stop", "restart"
- The service must allow the requested action (check `allowStart`, `allowStop`, `allowRestart`)

**Error Responses:**
- `400 Bad Request`: Validation errors, host/service not found, action not allowed
- `401 Unauthorized`: Admin authentication required
- `500 Internal Server Error`: Server error

### GET /api/control/actions/:id

Get the current status of a control action.

**Response (200 OK):**
```json
{
  "id": "action-id",
  "hostId": "host-id",
  "serviceId": "service-id",
  "kind": "start",
  "status": "queued" | "running" | "completed" | "failed",
  "requestedBy": "admin@local",
  "requestedAt": "2025-09-02T21:24:39.000Z",
  "startedAt": "2025-09-02T21:24:40.000Z" | null,
  "finishedAt": "2025-09-02T21:24:45.000Z" | null,
  "exitCode": 0 | null,
  "message": "Service started successfully" | null,
  "host": {
    "id": "host-id",
    "name": "host-name"
  },
  "service": {
    "id": "service-id",
    "unitName": "nginx.service",
    "displayName": "Nginx Web Server"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Admin authentication required
- `404 Not Found`: Action not found
- `500 Internal Server Error`: Server error

## Action Lifecycle

1. **queued**: Action is created and waiting to be processed
2. **running**: Action is currently being executed
3. **completed**: Action completed successfully
4. **failed**: Action failed with an error

## Example Usage

### Start a service
```bash
curl -X POST http://localhost:3000/api/control/actions \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "hostId": "host-id-here",
    "serviceId": "service-id-here", 
    "kind": "start"
  }'
```

### Check action status
```bash
curl http://localhost:3000/api/control/actions/action-id-here \
  -H "Cookie: your-session-cookie"
```

## Security Features

- **Admin-only access**: All endpoints require admin authentication
- **Permission validation**: Actions are only allowed if the service permits them
- **Host-service linking**: Services must belong to the specified host
- **Input validation**: All inputs are validated using Zod schemas
- **Audit trail**: All actions record who requested them and when

## Integration Notes

- Actions are created with status "queued" and can be updated by external agents
- The API validates permissions but doesn't execute the actual system commands
- External agents should poll the action status and update it as the operation progresses
- Failed actions include exit codes and error messages for debugging
