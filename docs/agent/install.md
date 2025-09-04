# Lab Portal Agent Installation Guide

This guide provides step-by-step instructions for installing the Lab Portal Agent on remote hosts.

## Prerequisites

- Linux system with systemd
- Node.js 18+ installed
- SSH access to the target host
- Sudo privileges on the target host

## Quick Installation

### Using Make (Recommended)

From the Lab Portal project root:

```bash
# Build and package the agent
make agent-build
make agent-package

# Install on remote host
make agent-install HOST=your-host.example.com
```

### Manual Installation

1. **Download the agent package:**

   ```bash
   # The package is created in dist-artifacts/ after running make agent-package
   scp dist-artifacts/agent-labportal-1.0.0.tgz user@host:/tmp/
   ```

2. **Extract and install:**

   ```bash
   ssh user@host
   cd /tmp
   tar -xzf agent-labportal-1.0.0.tgz
   cd agent-labportal-1.0.0

   # Copy env.example to .env and configure
   cp env.example .env
   nano .env

   # Run installation script
   chmod +x packaging/install.sh
   ./packaging/install.sh
   ```

## Configuration

### Environment Variables

The agent uses a `.env` file for configuration. Copy `env.example` to `.env` and configure:

```bash
# Required settings
HOST_ID=your-host-name
PORTAL_BASE_URL=http://your-portal-server:3000
AGENT_TOKEN=your-agent-token

# Optional settings
POLL_INTERVAL=4000
EXEC_TIMEOUT_MS=60000
RESTART_RETRY=1
NODE_ENV=production
```

### Configuration Commands

After installation, use the configuration script:

```bash
# Show current configuration
sudo -u lab-portal /opt/lab-portal-agent/packaging/configure.sh show

# Interactive configuration
sudo -u lab-portal /opt/lab-portal-agent/packaging/configure.sh interactive

# Edit configuration file
sudo -u lab-portal /opt/lab-portal-agent/packaging/configure.sh edit

# Validate configuration
sudo -u lab-portal /opt/lab-portal-agent/packaging/configure.sh validate
```

## Service Management

### Basic Commands

```bash
# Check service status
sudo systemctl status lab-portal-agent

# Start/stop/restart service
sudo systemctl start lab-portal-agent
sudo systemctl stop lab-portal-agent
sudo systemctl restart lab-portal-agent

# Enable/disable auto-start
sudo systemctl enable lab-portal-agent
sudo systemctl disable lab-portal-agent
```

### Viewing Logs

```bash
# View recent logs
sudo journalctl -u lab-portal-agent

# Follow logs in real-time
sudo journalctl -u lab-portal-agent -f

# View logs from specific time
sudo journalctl -u lab-portal-agent --since "1 hour ago"
```

## Uninstallation

### Using Make

```bash
make agent-uninstall HOST=your-host.example.com
```

### Manual Uninstallation

```bash
# Copy uninstall script to host
scp agent/packaging/uninstall.sh user@host:/tmp/

# Run uninstall script
ssh user@host
chmod +x /tmp/uninstall.sh
/tmp/uninstall.sh
```

## Troubleshooting

### Common Issues

1. **Service fails to start:**

   ```bash
   # Check service status
   sudo systemctl status lab-portal-agent

   # Check logs
   sudo journalctl -u lab-portal-agent -n 50
   ```

2. **Configuration errors:**

   ```bash
   # Validate configuration
   sudo -u lab-portal /opt/lab-portal-agent/packaging/configure.sh validate
   ```

3. **Permission issues:**

   ```bash
   # Check file ownership
   ls -la /opt/lab-portal-agent/

   # Fix ownership if needed
   sudo chown -R lab-portal:lab-portal /opt/lab-portal-agent/
   ```

4. **Network connectivity:**
   ```bash
   # Test connection to portal
   curl -v http://your-portal-server:3000/api/public/status/summary
   ```

### Log Analysis

The agent logs important events. Look for:

- `Action queued` - Actions received from portal
- `Action started` - Actions beginning execution
- `Action completed` - Successful action completion
- `Action failed` - Failed actions with error details
- `Rate limit exceeded` - Too many requests

### Security Considerations

- The agent runs as a dedicated `lab-portal` user
- Service files are protected with systemd security settings
- Environment files have restricted permissions (644)
- No shell access for the agent user

## Advanced Configuration

### Custom Service Settings

The systemd service file is located at `/etc/systemd/system/lab-portal-agent.service`. You can modify:

- Resource limits (memory, CPU)
- Security settings
- Restart behavior
- Logging configuration

After changes, reload systemd:

```bash
sudo systemctl daemon-reload
sudo systemctl restart lab-portal-agent
```

### Multiple Agents on Same Host

To run multiple agents on the same host:

1. Modify the service name and user in the installation scripts
2. Use different installation directories
3. Ensure unique HOST_ID values
4. Use different systemd service names

### Firewall Configuration

Ensure the agent can reach the portal server:

```bash
# Allow outbound HTTPS/HTTP
sudo ufw allow out 80
sudo ufw allow out 443

# Or for specific portal server
sudo ufw allow out to <portal-server-ip> port 3000
```

## Support

For issues and questions:

1. Check the logs: `sudo journalctl -u lab-portal-agent -f`
2. Validate configuration: `./packaging/configure.sh validate`
3. Review this documentation
4. Check the main Lab Portal documentation
