# Lab Portal Scripts

This directory contains utility scripts for testing and managing the Lab Portal.

## 📁 Scripts

### `curl/control-smoke.sh`

**Purpose**: Comprehensive smoke test for the control actions flow without UI

**What it tests**:
- Portal readiness and connectivity
- Admin authentication
- Host and service creation/retrieval
- Control action enqueuing (start/stop/restart)
- Localhost path completion (systemctl executor)
- Agent path pickup verification

**Usage**:
```bash
# Run with defaults (localhost:3000, admin123 password)
./scripts/curl/control-smoke.sh

# Custom URL and password
./scripts/curl/control-smoke.sh -u http://localhost:8080 -p mypassword

# Using environment variables
BASE_URL=http://localhost:8080 ADMIN_PASSWORD=mypassword ./scripts/curl/control-smoke.sh

# Show help
./scripts/curl/control-smoke.sh --help
```

**Requirements**:
- `curl` - HTTP client for API calls
- `jq` - JSON processor for response parsing
- Portal running and accessible
- Valid admin credentials

### `curl/test-smoke.sh`

**Purpose**: Validates the smoke test script without running actual tests

**What it validates**:
- Script existence and permissions
- Help functionality
- Syntax correctness
- Required function implementations

**Usage**:
```bash
./scripts/curl/test-smoke.sh
```

## 🚀 Quick Start

1. **Ensure dependencies are installed**:
   ```bash
   # On Ubuntu/Debian
   sudo apt-get install curl jq
   
   # On macOS with Homebrew
   brew install curl jq
   
   # On CentOS/RHEL
   sudo yum install curl jq
   ```

2. **Make scripts executable**:
   ```bash
   chmod +x scripts/curl/*.sh
   ```

3. **Run the smoke test**:
   ```bash
   ./scripts/curl/control-smoke.sh
   ```

## 🔧 Configuration

The scripts support configuration through:

- **Command line arguments**: `-u` for URL, `-p` for password
- **Environment variables**: `BASE_URL`, `ADMIN_PASSWORD`
- **Defaults**: `http://localhost:3000` and `admin123`

## 📊 Test Flow

The smoke test follows this sequence:

1. **Setup**: Check dependencies, wait for portal, authenticate
2. **Infrastructure**: Create/retrieve test host and service
3. **Localhost Testing**: Enqueue start/stop actions, verify completion
4. **Agent Testing**: Enqueue restart action, verify agent pickup
5. **Cleanup**: Remove temporary files

## 🐛 Troubleshooting

**Common Issues**:

- **Portal not accessible**: Ensure the portal is running and accessible at the specified URL
- **Authentication failed**: Verify admin credentials in `.env.local`
- **Dependencies missing**: Install `curl` and `jq` packages
- **Permission denied**: Make scripts executable with `chmod +x`

**Debug Mode**:
```bash
./scripts/curl/control-smoke.sh -v
```

## 🔒 Security Notes

- The smoke test creates temporary test data (hosts/services)
- Admin credentials are required for all operations
- Temporary cookie files are automatically cleaned up
- No sensitive data is logged or stored

## 📝 Integration

These scripts are designed for:
- **CI/CD pipelines**: Automated testing of control actions
- **Development**: Quick validation of changes
- **Deployment**: Pre-deployment verification
- **Debugging**: Isolating control action issues
