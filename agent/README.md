# Lab Portal Agent

The Lab Portal Agent is a lightweight Node.js service that runs on remote hosts to execute systemctl commands on behalf of the Lab Portal. It provides secure, reliable execution of service management actions with comprehensive logging and error handling.

## Features

- **Secure Communication**: Authenticated communication with the Lab Portal using bearer tokens
- **Reliable Execution**: Automatic retry logic for restart failures with configurable delays
- **Timeout Handling**: Configurable execution timeouts with proper error reporting
- **Comprehensive Logging**: Detailed logging of all actions, outputs, and errors
- **Service Management**: Support for both user and system services via systemctl
- **Graceful Shutdown**: Proper cleanup and shutdown handling
- **Health Monitoring**: Regular heartbeat communication with the portal

## Installation

### Prerequisites

- Node.js 18+
- systemctl (systemd) access
- sudo access (for system services, if needed)

### Quick Start

1. **Clone and Install**:

   ```bash
   git clone <repository-url>
   cd labPortal/agent
   npm install
   ```

2. **Configure Environment**:

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Build and Run**:
   ```bash
   npm run build
   npm start
   ```

### Production Installation

1. **Build the Agent**:

   ```bash
   npm run build
   ```

2. **Install as Systemd Service** (see systemd unit example below)

3. **Configure Environment Variables** in the systemd service file

## Configuration

### Environment Variables

| Variable          | Required | Default      | Description                                                       |
| ----------------- | -------- | ------------ | ----------------------------------------------------------------- |
| `HOST_ID`         | Yes      | -            | Unique identifier for this host (must match portal configuration) |
| `PORTAL_BASE_URL` | Yes      | -            | Base URL of the Lab Portal (e.g., `http://portal.example.com`)    |
| `AGENT_TOKEN`     | Yes      | -            | Authentication token from the portal hosts management page        |
| `POLL_INTERVAL`   | No       | `4000`       | Polling interval in milliseconds (4 seconds)                      |
| `EXEC_TIMEOUT_MS` | No       | `60000`      | Command execution timeout in milliseconds (60 seconds)            |
| `RESTART_RETRY`   | No       | `1`          | Number of retry attempts for restart failures                     |
| `NODE_ENV`        | No       | `production` | Environment mode (`development` or `production`)                  |

### Example Configuration

```bash
# .env file
HOST_ID=web-server-01
PORTAL_BASE_URL=https://portal.example.com
AGENT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
POLL_INTERVAL=4000
EXEC_TIMEOUT_MS=60000
RESTART_RETRY=1
NODE_ENV=production
```

## Operation

### Main Loop

The agent operates in a continuous loop:

1. **Heartbeat**: Sends heartbeat to portal every poll interval
2. **Queue Check**: Polls for queued actions for this host
3. **Action Execution**: If actions are found, executes them immediately
4. **Status Reporting**: Reports execution results back to portal

### Action Execution Flow

1. **Queue Fetch**: Agent fetches queued actions from portal
2. **Immediate Status Report**: Reports status as "running" immediately
3. **Command Execution**: Executes the systemctl command
4. **Retry Logic**: For restart failures, retries once after 2-second delay
5. **Final Report**: Reports final status (succeeded/failed) with details

### Supported Commands

- `start` - Start a service
- `stop` - Stop a service
- `restart` - Restart a service (with retry logic)
- `status` - Check service status

### Service Types

The agent supports both user and system services:

- **User Services**: `systemctl --user <command> <unit>`
- **System Services**: `sudo systemctl <command> <unit>` (requires sudo access)

## Failure Semantics

### Timeout Handling

- **Timeout Detection**: Commands that exceed `EXEC_TIMEOUT_MS` are terminated
- **Status**: Set to "failed" with `exitCode: null`
- **Message**: "timeout" with timeout duration
- **Logging**: Full timeout details logged

### Restart Retry Logic

- **Trigger**: Restart commands that fail with non-zero exit code
- **Retry Count**: Configurable via `RESTART_RETRY` (default: 1)
- **Delay**: 2-second delay between retry attempts
- **Final Status**: If retry also fails, reports final failure

### Error Categories

1. **Validation Errors**: Invalid commands or unit names
2. **Execution Errors**: Command execution failures
3. **Timeout Errors**: Commands exceeding timeout limit
4. **Network Errors**: Communication failures with portal
5. **Permission Errors**: Insufficient privileges for system services

### Logging

All actions are logged with:

- **Action ID**: Unique identifier from portal
- **Command**: systemctl command being executed
- **Unit Name**: Service unit being managed
- **Duration**: Execution time in milliseconds
- **Exit Code**: Process exit code (null for timeouts)
- **Output**: Truncated stdout/stderr (max 1000 chars)
- **Status**: Final execution status

## Systemd Service

### Service Unit File

Create `/etc/systemd/system/lab-portal-agent.service`:

```ini
[Unit]
Description=Lab Portal Agent
Documentation=https://github.com/your-org/lab-portal
After=network.target
Wants=network.target

[Service]
Type=simple
User=lab-portal
Group=lab-portal
WorkingDirectory=/opt/lab-portal-agent
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=lab-portal-agent

# Environment variables
Environment=HOST_ID=web-server-01
Environment=PORTAL_BASE_URL=https://portal.example.com
Environment=AGENT_TOKEN=your-agent-token-here
Environment=POLL_INTERVAL=4000
Environment=EXEC_TIMEOUT_MS=60000
Environment=RESTART_RETRY=1
Environment=NODE_ENV=production

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/lab-portal-agent
ReadWritePaths=/var/log/lab-portal-agent

# Resource limits
LimitNOFILE=65536
MemoryMax=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

### Installation Commands

```bash
# Create user and directories
sudo useradd -r -s /bin/false lab-portal
sudo mkdir -p /opt/lab-portal-agent
sudo mkdir -p /var/log/lab-portal-agent

# Copy agent files
sudo cp -r dist/* /opt/lab-portal-agent/
sudo chown -R lab-portal:lab-portal /opt/lab-portal-agent
sudo chown -R lab-portal:lab-portal /var/log/lab-portal-agent

# Install and start service
sudo systemctl daemon-reload
sudo systemctl enable lab-portal-agent
sudo systemctl start lab-portal-agent

# Check status
sudo systemctl status lab-portal-agent
sudo journalctl -u lab-portal-agent -f
```

### Sudoers Configuration

For system service management, configure sudoers:

```bash
# /etc/sudoers.d/lab-portal-agent
lab-portal ALL=(root) NOPASSWD: /bin/systemctl start *
lab-portal ALL=(root) NOPASSWD: /bin/systemctl stop *
lab-portal ALL=(root) NOPASSWD: /bin/systemctl restart *
lab-portal ALL=(root) NOPASSWD: /bin/systemctl status *
```

## Development

### Building

```bash
npm install
npm run build
```

### Testing

```bash
npm test
npm run test:watch
```

### Development Mode

```bash
npm run dev
```

### Connection Test

```bash
npm run test-connection
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Verify `AGENT_TOKEN` is correct
   - Check token hasn't expired
   - Ensure portal URL is accessible

2. **Permission Errors**:
   - Verify sudoers configuration for system services
   - Check user has access to systemctl
   - Ensure proper file permissions

3. **Network Issues**:
   - Test portal connectivity: `curl -H "Authorization: Bearer $AGENT_TOKEN" $PORTAL_BASE_URL/api/agents/heartbeat`
   - Check firewall rules
   - Verify DNS resolution

4. **Timeout Issues**:
   - Increase `EXEC_TIMEOUT_MS` for slow services
   - Check system resource usage
   - Monitor service startup times

### Logs

- **Systemd**: `journalctl -u lab-portal-agent -f`
- **Application**: Check stdout/stderr in systemd logs
- **Portal**: Check portal logs for agent communication

### Health Checks

```bash
# Check agent status
sudo systemctl status lab-portal-agent

# Test portal connectivity
curl -H "Authorization: Bearer $AGENT_TOKEN" \
     $PORTAL_BASE_URL/api/agents/heartbeat

# Check for queued actions
curl -H "Authorization: Bearer $AGENT_TOKEN" \
     $PORTAL_BASE_URL/api/control/queue?max=1
```

## Security Considerations

- **Token Security**: Store agent tokens securely, rotate regularly
- **Network Security**: Use HTTPS for portal communication
- **Privilege Escalation**: Limit sudo access to specific systemctl commands
- **Logging**: Monitor logs for suspicious activity
- **Updates**: Keep agent updated with security patches

## API Reference

### Portal Endpoints

- `POST /api/agents/heartbeat` - Send heartbeat
- `GET /api/control/queue?max=N` - Get queued actions
- `POST /api/control/report` - Report action status

### Action Report Format

```json
{
  "actionId": "action-123",
  "status": "succeeded|failed",
  "exitCode": 0,
  "message": "Successfully executed: systemctl start nginx.service",
  "stderr": "truncated error output"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Your License Here]
