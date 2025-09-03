# Lab Portal Agent

A lightweight Node.js agent for executing service control actions from the Lab Portal. This agent runs on remote hosts and communicates with the portal to receive and execute `systemctl` commands.

## Features

- 🔐 **Secure Authentication** - Token-based authentication with the portal
- 🚀 **Lightweight** - Minimal dependencies, runs efficiently on any Linux system
- 🔄 **Auto-restart** - Automatically restarts on failure with configurable backoff
- 📊 **Comprehensive Logging** - Detailed logging with timestamps and log levels
- 🛡️ **Safe Execution** - Validates commands and unit names before execution
- ⚡ **Smart Service Detection** - Automatically tries user services first, then system services

## Requirements

- **Node.js** 18+ (for native `fetch` support)
- **Linux** system with `systemctl` available
- **sudo** access (for system service management)
- **Network access** to the Lab Portal

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd agent-skeleton
npm install
npm run build
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `HOST_ID` - Your host identifier (must match portal configuration)
- `PORTAL_BASE_URL` - Base URL of the Lab Portal
- `AGENT_TOKEN` - Authentication token from the portal
- `POLL_INTERVAL` - Polling interval in milliseconds (default: 4000)

### 3. Test the Agent

```bash
# Test connection to portal
npm run dev

# Or run the built version
npm start
```

## Installation as System Service

### 1. Create System User

```bash
sudo useradd -r -s /bin/false labportal
sudo groupadd labportal
sudo usermod -a -G labportal labportal
```

### 2. Install Agent

```bash
sudo mkdir -p /opt/lab-portal-agent
sudo cp -r dist/* /opt/lab-portal-agent/
sudo cp .env /opt/lab-portal-agent/
sudo chown -R labportal:labportal /opt/lab-portal-agent
sudo chmod 755 /opt/lab-portal-agent
```

### 3. Install Systemd Service

```bash
sudo cp install/lab-portal-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable lab-portal-agent
sudo systemctl start lab-portal-agent
```

### 4. Check Status

```bash
sudo systemctl status lab-portal-agent
sudo journalctl -u lab-portal-agent -f
```

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `HOST_ID` | Host identifier in the portal | - | ✅ |
| `PORTAL_BASE_URL` | Portal base URL | - | ✅ |
| `AGENT_TOKEN` | Authentication token | - | ✅ |
| `POLL_INTERVAL` | Polling interval (ms) | 4000 | ❌ |
| `NODE_ENV` | Environment mode | production | ❌ |

### Portal Configuration

1. **Add Host** in the portal admin interface
2. **Generate Agent Token** for the host
3. **Add Managed Services** that the host can control
4. **Configure Service Permissions** (start/stop/restart)

## Usage

### Manual Execution

```bash
# Development mode with live reload
npm run dev

# Production mode
npm start

# Build TypeScript
npm run build

# Watch mode for development
npm run watch
```

### Service Management

```bash
# Start the service
sudo systemctl start lab-portal-agent

# Stop the service
sudo systemctl stop lab-portal-agent

# Restart the service
sudo systemctl restart lab-portal-agent

# View logs
sudo journalctl -u lab-portal-agent -f

# Check status
sudo systemctl status lab-portal-agent
```

## How It Works

### 1. Authentication
- Agent authenticates with the portal using its token
- Token is validated on every request

### 2. Polling Loop
- Agent sends heartbeat every `POLL_INTERVAL` milliseconds
- Checks for queued actions from the portal
- Processes one action at a time

### 3. Action Execution
- Receives action details (command, service unit)
- Validates command and unit name for security
- Executes `systemctl` command (user service first, then system)
- Reports results back to the portal

### 4. Error Handling
- Automatic retry with exponential backoff
- Comprehensive error logging
- Graceful degradation on failures

## Security Features

- **Command Validation** - Only allows safe systemctl commands
- **Unit Name Validation** - Regex-based unit name validation
- **Output Sanitization** - Removes sensitive information from logs
- **User Isolation** - Runs as dedicated system user
- **Systemd Security** - Uses systemd security features
- **Network Isolation** - Minimal network access requirements

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check `AGENT_TOKEN` in `.env`
   - Verify token is valid in the portal
   - Ensure host ID matches portal configuration

2. **Connection Refused**
   - Check `PORTAL_BASE_URL` is correct
   - Verify network connectivity
   - Check firewall settings

3. **Permission Denied**
   - Ensure agent user has sudo access
   - Check systemd service user configuration
   - Verify working directory permissions

4. **Service Not Found**
   - Check unit name exists on the system
   - Verify service permissions in portal
   - Check systemd unit status

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your `.env` file.

### Log Locations

- **Systemd logs**: `sudo journalctl -u lab-portal-agent`
- **Application logs**: Check console output or systemd journal
- **Error logs**: Same as above, look for ❌ symbols

## Development

### Project Structure

```
agent-skeleton/
├── src/
│   ├── index.ts          # Main entry point
│   ├── agent.ts          # Main agent logic
│   ├── portal-client.ts  # Portal API client
│   ├── action-executor.ts # Systemctl command executor
│   └── logger.ts         # Logging utility
├── install/               # Installation files
├── dist/                 # Built JavaScript (after npm run build)
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### Building

```bash
# Development build
npm run build

# Watch mode
npm run watch

# Production build
npm run build
NODE_ENV=production npm run build
```

### Testing

```bash
# Test connection to portal
npm run dev

# Check logs for any errors
# Verify portal receives heartbeats
# Test with a simple action from the portal
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the portal logs for errors
- Check agent logs with `journalctl -u lab-portal-agent`
- Open an issue in the repository
