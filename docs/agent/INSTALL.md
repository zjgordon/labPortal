# Lab Portal Agent Installation Guide

This guide covers both interactive and command-line installation methods for the Lab Portal Agent.

## Quick Start

### Download and Install

1. **Download the agent package:**

   ```bash
   # Download from GitHub Releases (replace with latest version)
   wget https://github.com/your-org/lab-portal/releases/download/v1.0.0/agent-labportal-1.0.0.tgz
   ```

2. **Extract and install:**

   ```bash
   tar -xzf agent-labportal-1.0.0.tgz
   cd agent-labportal-1.0.0
   sudo ./packaging/install-guided.sh
   ```

3. **Or install directly with flags:**
   ```bash
   tar -xzf agent-labportal-1.0.0.tgz
   cd agent-labportal-1.0.0
   sudo ./packaging/install-guided.sh --install \
     --host-id my-host \
     --portal http://portal.local \
     --token your-agent-token-here
   ```

## Prerequisites

- **Operating System**: Linux (Ubuntu/Debian, CentOS/RHEL/Fedora)
- **Node.js**: Version 18 or higher
- **Root Access**: Required for installation and service management
- **Network**: Access to the Lab Portal server

### Installing Node.js

If Node.js is not installed, use one of these methods:

**Ubuntu/Debian:**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL/Fedora:**

```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

## Package Contents

The agent package (`agent-labportal-<version>.tgz`) includes:

- **`dist/`** - Compiled agent binaries
- **`packaging/install-guided.sh`** - Guided installer with TUI/CLI support
- **`env.example`** - Configuration template
- **`package.json`** - Package metadata and dependencies
- **`README.md`** - Agent documentation
- **`packaging/`** - Additional installation scripts

## Verifying Tarballs

For security and integrity verification, each agent tarball is accompanied by a SHA256 checksum file.

### Downloading Both Files

When downloading the agent package, ensure you get both files:

```bash
# Download the tarball
wget https://github.com/your-org/lab-portal/releases/download/v1.0.0/agent-labportal-1.0.0.tgz

# Download the corresponding checksum file
wget https://github.com/your-org/lab-portal/releases/download/v1.0.0/agent-labportal-1.0.0.tgz.sha256
```

### Verifying Integrity

Before installation, verify the tarball integrity using the checksum:

```bash
# Verify the tarball against its checksum
sha256sum -c agent-labportal-1.0.0.tgz.sha256
```

**Expected output:**

```
agent-labportal-1.0.0.tgz: OK
```

If the verification fails, the output will show:

```
agent-labportal-1.0.0.tgz: FAILED
sha256sum: WARNING: 1 computed checksum did NOT match
```

### Manual Checksum Verification

You can also manually verify the checksum:

```bash
# Generate checksum of the downloaded file
sha256sum agent-labportal-1.0.0.tgz

# Compare with the contents of the .sha256 file
cat agent-labportal-1.0.0.tgz.sha256
```

Both commands should produce the same hash value.

### Security Notes

- **Always verify checksums** before installing software
- **Never install** tarballs that fail checksum verification
- **Re-download** if checksums don't match
- **Check the source** if verification consistently fails

## GPG Signature Verification (Optional)

For enhanced security, agent tarballs may be signed with GPG. This provides cryptographic proof of authenticity and integrity.

### Downloading Signature Files

If GPG signatures are available, download both the tarball and signature:

```bash
# Download the tarball
wget https://github.com/your-org/lab-portal/releases/download/v1.0.0/agent-labportal-1.0.0.tgz

# Download the GPG signature (if available)
wget https://github.com/your-org/lab-portal/releases/download/v1.0.0/agent-labportal-1.0.0.tgz.asc
```

### Verifying GPG Signatures

To verify a GPG signature, you need the signer's public key:

```bash
# Import the public key (if not already imported)
gpg --import lab-portal-public-key.asc

# Verify the signature
gpg --verify agent-labportal-1.0.0.tgz.asc agent-labportal-1.0.0.tgz
```

**Expected output for valid signature:**

```
gpg: Signature made Mon Jan 15 12:00:00 2024 UTC
gpg:                using RSA key 1234567890ABCDEF
gpg: Good signature from "Lab Portal Team <team@lab-portal.org>"
```

**Expected output for invalid signature:**

```
gpg: Signature made Mon Jan 15 12:00:00 2024 UTC
gpg:                using RSA key 1234567890ABCDEF
gpg: BAD signature from "Lab Portal Team <team@lab-portal.org>"
```

### Getting the Public Key

The Lab Portal team's public key can be obtained from:

- **GitHub Releases**: Attached to release notes
- **Key Server**: `gpg --keyserver keyserver.ubuntu.com --recv-keys KEY_ID`
- **Direct Download**: From the project's security documentation

### Security Notes

- **GPG signatures are optional** - SHA256 checksums are sufficient for most use cases
- **Always verify signatures** when available for maximum security
- **Never install** tarballs with invalid GPG signatures
- **Keep public keys updated** to ensure signature validity

## Installation Methods

### 1. Interactive Installation (Recommended)

The guided installer provides a user-friendly interface with automatic TUI detection.

```bash
sudo ./packaging/install-guided.sh
```

**Features:**

- Automatic TUI detection (whiptail > dialog > text fallback)
- Step-by-step configuration collection
- Real-time validation and error checking
- Complete lifecycle management (install, upgrade, uninstall, logs)

**Interactive Menu Options:**

1. **Install (new)** - Full installation with systemd service
2. **Upgrade** - Replace binaries, preserve configuration
3. **Uninstall** - Remove service, optional directory cleanup
4. **View Logs** - Real-time service log monitoring
5. **Exit** - Exit the installer

### 2. Command-Line Installation (Advanced Users)

For automation and scripting, use command-line flags to bypass the interactive interface.

#### Basic Headless Installation

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id my-host \
  --portal http://portal.local \
  --token your-agent-token-here
```

#### Full Configuration Example

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id production-server-01 \
  --portal https://portal.example.com \
  --token your-secret-agent-token-here \
  --install-dir /opt/lab-portal-agent \
  --user labagent \
  --exec-timeout 60000 \
  --restart-retry 3 \
  --assume-yes
```

## Command-Line Options

### Actions

| Option        | Description                   |
| ------------- | ----------------------------- |
| `--install`   | Install Lab Portal Agent      |
| `--upgrade`   | Upgrade existing installation |
| `--uninstall` | Uninstall Lab Portal Agent    |
| `--logs`      | View service logs             |

### Configuration Options

| Option              | Description               | Required          | Default                 |
| ------------------- | ------------------------- | ----------------- | ----------------------- |
| `--host-id ID`      | Host identifier           | Yes (for install) | -                       |
| `--portal URL`      | Portal base URL           | Yes (for install) | -                       |
| `--token TOKEN`     | Agent token               | Yes (for install) | -                       |
| `--install-dir DIR` | Installation directory    | No                | `/opt/lab-portal-agent` |
| `--user USER`       | Agent username            | No                | `labagent`              |
| `--exec-timeout MS` | Execution timeout (ms)    | No                | `60000`                 |
| `--restart-retry N` | Restart retry count       | No                | `1`                     |
| `--assume-yes`      | Skip confirmation prompts | No                | `false`                 |

### Utility Options

| Option         | Description            |
| -------------- | ---------------------- |
| `--help`, `-h` | Show usage information |

## Usage Examples

### Installation Examples

**Interactive mode (default):**

```bash
sudo ./packaging/install-guided.sh
```

**Headless install with minimal config:**

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id my-host \
  --portal http://portal.local \
  --token my-token
```

**Install with custom settings:**

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id production-server \
  --portal https://portal.company.com \
  --token my-secret-token \
  --install-dir /opt/my-agent \
  --user myagent \
  --exec-timeout 120000 \
  --restart-retry 5
```

**Install with auto-confirmation:**

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id my-host \
  --portal http://portal.local \
  --token my-token \
  --assume-yes
```

### Management Examples

**Upgrade existing installation:**

```bash
sudo ./packaging/install-guided.sh --upgrade
```

**Upgrade with auto-confirmation:**

```bash
sudo ./packaging/install-guided.sh --upgrade --assume-yes
```

**Uninstall with confirmation:**

```bash
sudo ./packaging/install-guided.sh --uninstall
```

**Uninstall without confirmation:**

```bash
sudo ./packaging/install-guided.sh --uninstall --assume-yes
```

**View service logs:**

```bash
sudo ./packaging/install-guided.sh --logs
```

## Validation and Safety Checks

The installer includes comprehensive validation:

### URL Validation

- Must be valid HTTP/HTTPS URL format
- Examples: `http://portal.local`, `https://portal.example.com:3000`

### Token Validation

- Minimum 24 characters required
- No format restrictions (can contain letters, numbers, symbols)

### Node.js Validation

- Checks for Node.js installation
- Validates version 18+ requirement
- Provides installation instructions if missing

### System Validation

- Root privilege verification
- systemctl availability check
- OS detection for package manager selection

## Exit Codes

| Code | Description                                                 |
| ---- | ----------------------------------------------------------- |
| `0`  | Success                                                     |
| `1`  | General error (invalid arguments, validation failure, etc.) |
| `2`  | Service operation failed                                    |
| `3`  | Configuration error                                         |

## Service Management

After installation, the agent runs as a systemd service:

**Check status:**

```bash
sudo systemctl status lab-portal-agent
```

**View logs:**

```bash
sudo journalctl -u lab-portal-agent -f
```

**Manual control:**

```bash
sudo systemctl start lab-portal-agent
sudo systemctl stop lab-portal-agent
sudo systemctl restart lab-portal-agent
```

## Configuration

The agent configuration is stored in `/opt/lab-portal-agent/.env`:

```bash
# Lab Portal Agent Configuration
HOST_ID="my-host"
PORTAL_BASE_URL="http://portal.local"
AGENT_TOKEN="your-agent-token-here"
POLL_INTERVAL=4000
EXEC_TIMEOUT_MS=60000
RESTART_RETRY=1
NODE_ENV=production
```

## Troubleshooting

### Common Issues

**"Node.js is not installed"**

- Install Node.js 18+ using the provided instructions
- Verify with `node --version`

**"Invalid URL format"**

- Ensure URL includes protocol (http:// or https://)
- Check for typos in the URL

**"Token too short"**

- Agent tokens must be at least 24 characters
- Generate a new token from the portal if needed

**"Service failed to start"**

- Check logs: `sudo journalctl -u lab-portal-agent -n 50`
- Verify configuration in `/opt/lab-portal-agent/.env`
- Ensure portal is accessible from the agent host

### Log Analysis

**View recent logs:**

```bash
sudo journalctl -u lab-portal-agent -n 100
```

**Follow live logs:**

```bash
sudo journalctl -u lab-portal-agent -f
```

**Check service status:**

```bash
sudo systemctl status lab-portal-agent --no-pager
```

## Security Considerations

- The agent runs as a dedicated system user (`labagent` by default)
- Configuration files have restricted permissions (640)
- Optional sudoers helper can be created for limited privilege escalation
- All network communication uses the configured portal URL

## Support

For additional support:

1. Check the service logs for error messages
2. Verify network connectivity to the portal
3. Ensure all prerequisites are met
4. Review the configuration file for correctness

## Advanced Features

### Sudoers Helper

During installation, you can optionally create a sudoers helper that allows the agent user to manage system services:

```bash
# This is created automatically during installation if you choose to enable it
# Location: /etc/sudoers.d/lab-portal-agent
```

The helper allows the agent to:

- Manage its own service (start/stop/restart/status)
- Read system information (ps, df, free)
- Manage other services (customizable)

### Custom Installation Directory

You can install the agent to a custom directory:

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id my-host \
  --portal http://portal.local \
  --token my-token \
  --install-dir /custom/path/agent
```

### Custom User

You can specify a custom user for the agent:

```bash
sudo ./packaging/install-guided.sh --install \
  --host-id my-host \
  --portal http://portal.local \
  --token my-token \
  --user myagent
```

The installer will create the user if it doesn't exist.
