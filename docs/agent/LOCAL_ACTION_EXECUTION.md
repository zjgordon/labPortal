# Local Action Execution

The portal can execute systemctl commands directly on the host without requiring external agents. This feature is designed for local development and testing, allowing immediate execution of service control actions.

## Environment Configuration

Add these variables to your `.env.local` file:

```bash
# Local Action Execution
HOST_LOCAL_ID="local"
ALLOW_SYSTEMCTL="false"
UNIT_ALLOWLIST_REGEX="^([a-z0-9@._-]+)\\.service$"
EXEC_TIMEOUT_MS="60000"
```

### Configuration Options

- **HOST_LOCAL_ID**: The host identifier that triggers local execution (default: "local")
- **ALLOW_SYSTEMCTL**: Whether to allow sudo systemctl commands (default: "false")
- **UNIT_ALLOWLIST_REGEX**: Regex pattern for allowed unit names (default: "^([a-z0-9@._-]+)\\.service$")
- **EXEC_TIMEOUT_MS**: Command execution timeout in milliseconds (default: 60000)

## How It Works

### 1. Action Detection
When an action is created via `/api/control/actions`, the system checks if:
- The `hostId` matches `HOST_LOCAL_ID`
- The user is authenticated as admin
- The service exists and allows the requested action

### 2. Unit Name Validation
Before execution, the system validates the `ManagedService.unitName` against the `UNIT_ALLOWLIST_REGEX`:
- Only units matching the regex pattern are allowed
- Prevents execution of potentially dangerous unit names
- Falls back to basic validation if regex is invalid

### 3. Immediate Execution
If local execution is triggered:
1. Action status changes from "queued" → "running"
2. Systemctl command is executed with timeout protection
3. Action status updates to "completed" or "failed"
4. Results are captured and stored with duration and timeout information

### 4. Command Execution Strategy
- **User services first**: `systemctl --user <command> <unit>`
- **System services**: `sudo systemctl <command> <unit>` (only if `ALLOW_SYSTEMCTL=true`)

## Security Features

### Input Validation
- **Commands**: Only `start`, `stop`, `restart`, `status` are allowed
- **Unit names**: Must match `UNIT_ALLOWLIST_REGEX` pattern
- **Authentication**: Admin-only access required

### Command Sanitization
- HTML tags are stripped from output
- Output length is limited to 1000 characters
- Special characters are properly escaped

### Permission Control
- User services run without sudo
- System services require `ALLOW_SYSTEMCTL=true`
- Common system services are automatically detected

### Timeout Protection
- Configurable timeout via `EXEC_TIMEOUT_MS`
- Distinguishes timeout errors from command failures
- Special exit code (-2) for timeout conditions

## Supported Unit Types

The `UNIT_ALLOWLIST_REGEX` controls which unit types are allowed. The default pattern `^([a-z0-9@._-]+)\.service$` allows:
- **Services**: `*.service` (e.g., `nginx.service`, `my-app.service`)

You can customize the regex to allow other unit types:
- **Sockets**: `^([a-z0-9@._-]+)\.(service|socket)$`
- **Timers**: `^([a-z0-9@._-]+)\.(service|socket|timer)$`
- **Targets**: `^([a-z0-9@._-]+)\.(service|socket|timer|target)$`

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
- **Timeout**: Command execution exceeded `EXEC_TIMEOUT_MS` limit
- **Invalid unit name**: Unit name doesn't match `UNIT_ALLOWLIST_REGEX`

### Error Response Example
```json
{
  "id": "action-id",
  "status": "failed",
  "exitCode": 1,
  "message": "Failed to start nginx.service: Unit not found (exit code: 1)",
  "startedAt": "2025-09-02T21:30:01.000Z",
  "finishedAt": "2025-09-02T21:30:02.000Z"
}
```

### Timeout Response Example
```json
{
  "id": "action-id",
  "status": "failed",
  "exitCode": -2,
  "message": "Command timed out after 60000ms: systemctl start nginx.service",
  "startedAt": "2025-09-02T21:30:01.000Z",
  "finishedAt": "2025-09-02T21:30:02.000Z"
}
```

## Configuration Examples

### Development Environment
```bash
HOST_LOCAL_ID="local"
ALLOW_SYSTEMCTL="false"  # Only user services
UNIT_ALLOWLIST_REGEX="^([a-z0-9@._-]+)\\.service$"
EXEC_TIMEOUT_MS="30000"   # 30 second timeout
```

### Testing Environment
```bash
HOST_LOCAL_ID="test-host"
ALLOW_SYSTEMCTL="true"   # Allow system services
UNIT_ALLOWLIST_REGEX="^([a-z0-9@._-]+)\\.(service|socket)$"
EXEC_TIMEOUT_MS="60000"   # 60 second timeout
```

### Production Environment
```bash
HOST_LOCAL_ID="prod-host"
ALLOW_SYSTEMCTL="true"   # Allow system services
UNIT_ALLOWLIST_REGEX="^([a-z0-9@._-]+)\\.service$"
EXEC_TIMEOUT_MS="120000"  # 2 minute timeout
```

## Sudo Configuration

When `ALLOW_SYSTEMCTL=true`, you need to configure sudo access. See [SUDOERS_CONFIGURATION.md](../ops/SUDOERS_CONFIGURATION.md) for detailed instructions.

### Quick Sudo Setup
```bash
# Create dedicated user
sudo useradd -r -s /bin/false lab-portal

# Add to sudoers
echo "lab-portal ALL=(root) NOPASSWD: /usr/bin/systemctl start [a-zA-Z0-9@._-]*.service, /usr/bin/systemctl stop [a-zA-Z0-9@._-]*.service, /usr/bin/systemctl restart [a-zA-Z0-9@._-]*.service, /usr/bin/systemctl status [a-zA-Z0-9@._-]*.service" | sudo tee /etc/sudoers.d/lab-portal
```

## Safety Considerations

### Command Injection Prevention
- All inputs are validated against regex patterns
- Commands are built using safe string concatenation
- Output is sanitized before storage

### Resource Limits
- Configurable timeout for all commands
- 1MB buffer limit for command output
- Rate limiting through existing API protection

### Audit Trail
- All actions are logged with timestamps
- User identification is captured
- Success/failure status is recorded
- Duration and timeout information is stored

## Troubleshooting

### Action Stuck in "Running" State
- Check if the systemctl command is hanging
- Verify the service exists and is accessible
- Check system logs for errors
- Verify timeout configuration

### Permission Errors
- Ensure `ALLOW_SYSTEMCTL=true` for system services
- Verify the user has sudo privileges
- Check if the service requires special permissions
- Review sudoers configuration

### Unit Not Found Errors
- Verify the unit name is correct
- Check if the unit is installed
- Ensure the unit follows the `UNIT_ALLOWLIST_REGEX` pattern

### Timeout Issues
- Increase `EXEC_TIMEOUT_MS` for slow services
- Check if the service is hanging during startup/shutdown
- Monitor system resources during execution

## Integration Notes

- Local execution happens synchronously during the API request
- Actions for remote hosts remain in "queued" status
- External agents can still update action status for remote hosts
- The system gracefully falls back to queued actions if local execution fails
- Duration and timeout information is captured for monitoring and debugging
