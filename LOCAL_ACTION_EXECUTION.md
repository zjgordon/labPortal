# Local Action Execution

The portal can execute systemctl commands directly on the host without requiring external agents. This feature is designed for local development and testing, allowing immediate execution of service control actions.

## Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Local Action Execution
HOST_LOCAL_ID="local"
ALLOW_SYSTEMCTL="false"
```

### Configuration Options

- **HOST_LOCAL_ID**: The host identifier that triggers local execution (default: "local")
- **ALLOW_SYSTEMCTL**: Whether to allow sudo systemctl commands (default: "false")

## How It Works

### 1. Action Detection
When an action is created via `/api/control/actions`, the system checks if:
- The `hostId` matches `HOST_LOCAL_ID`
- The user is authenticated as admin
- The service exists and allows the requested action

### 2. Immediate Execution
If local execution is triggered:
1. Action status changes from "queued" → "running"
2. Systemctl command is executed
3. Action status updates to "completed" or "failed"
4. Results are captured and stored

### 3. Command Execution Strategy
- **User services**: `systemctl --user <command> <unit>`
- **System services**: `sudo systemctl <command> <unit>` (only if `ALLOW_SYSTEMCTL=true`)

## Security Features

### Input Validation
- **Commands**: Only `start`, `stop`, `restart`, `status` are allowed
- **Unit names**: Must match safe patterns (e.g., `*.service`, `*.socket`)
- **Authentication**: Admin-only access required

### Command Sanitization
- HTML tags are stripped from output
- Output length is limited to 1000 characters
- Special characters are properly escaped

### Permission Control
- User services run without sudo
- System services require `ALLOW_SYSTEMCTL=true`
- Common system services are automatically detected

## Supported Unit Types

- **Services**: `*.service` (e.g., `nginx.service`)
- **Sockets**: `*.socket` (e.g., `docker.socket`)
- **Timers**: `*.timer` (e.g., `systemd-tmpfiles-clean.timer`)
- **Targets**: `*.target` (e.g., `multi-user.target`)

## Example Usage

### Start a User Service
```bash
curl -X POST http://localhost:3000/api/control/actions \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "hostId": "local",
    "serviceId": "service-id-here",
    "kind": "start"
  }'
```

### Response for Local Execution
```json
{
  "id": "action-id",
  "hostId": "local",
  "serviceId": "service-id",
  "kind": "start",
  "status": "completed",
  "requestedBy": "admin@local",
  "requestedAt": "2025-09-02T21:30:00.000Z",
  "startedAt": "2025-09-02T21:30:01.000Z",
  "finishedAt": "2025-09-02T21:30:02.000Z",
  "exitCode": 0,
  "message": "Successfully started nginx.service",
  "host": { "id": "local", "name": "local" },
  "service": { "id": "service-id", "unitName": "nginx.service", "displayName": "Nginx" }
}
```

## Error Handling

### Common Error Scenarios
- **Unit not found**: Service doesn't exist on the system
- **Permission denied**: Insufficient privileges to control the service
- **Service failed**: Service failed to start/stop/restart
- **Timeout**: Command execution exceeded 30-second limit

### Error Response Example
```json
{
  "id": "action-id",
  "status": "failed",
  "exitCode": 1,
  "message": "Failed to start nginx.service: Unit not found",
  "startedAt": "2025-09-02T21:30:01.000Z",
  "finishedAt": "2025-09-02T21:30:02.000Z"
}
```

## Configuration Examples

### Development Environment
```bash
HOST_LOCAL_ID="local"
ALLOW_SYSTEMCTL="false"  # Only user services
```

### Testing Environment
```bash
HOST_LOCAL_ID="test-host"
ALLOW_SYSTEMCTL="true"   # Allow system services
```

### Production Environment
```bash
HOST_LOCAL_ID="prod-host"
ALLOW_SYSTEMCTL="false"  # Restrict to user services only
```

## Safety Considerations

### Command Injection Prevention
- All inputs are validated against whitelisted patterns
- Commands are built using safe string concatenation
- Output is sanitized before storage

### Resource Limits
- 30-second timeout for all commands
- 1MB buffer limit for command output
- Rate limiting through existing API protection

### Audit Trail
- All actions are logged with timestamps
- User identification is captured
- Success/failure status is recorded

## Troubleshooting

### Action Stuck in "Running" State
- Check if the systemctl command is hanging
- Verify the service exists and is accessible
- Check system logs for errors

### Permission Errors
- Ensure `ALLOW_SYSTEMCTL=true` for system services
- Verify the user has sudo privileges
- Check if the service requires special permissions

### Unit Not Found Errors
- Verify the unit name is correct
- Check if the unit is installed
- Ensure the unit follows the allowed naming patterns

## Integration Notes

- Local execution happens synchronously during the API request
- Actions for remote hosts remain in "queued" status
- External agents can still update action status for remote hosts
- The system gracefully falls back to queued actions if local execution fails
