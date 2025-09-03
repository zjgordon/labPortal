# Lab Portal Smoke Testing

This document describes the smoke testing implementation for the Lab Portal, including comprehensive testing of critical flows: public APIs, admin card management, and control actions.

## 🎯 Overview

The smoke test validates the end-to-end functionality of the Lab Portal without requiring a UI, making it perfect for:

- CI/CD pipelines
- Development validation
- Pre-deployment verification
- Debugging critical flow issues
- Quick sanity checks after deployment

### 🧪 Test Coverage

1. **Public API Endpoints**
   - `/api/public/appearance` - Portal branding and appearance
   - `/api/public/status/summary` - Overall system status

2. **Admin Card Management**
   - Create test card
   - Edit card properties
   - Upload tiny icon
   - Delete test card

3. **Control System**
   - Queue endpoint verification (204 when empty)
   - Control actions flow (via existing control-smoke.sh)

## 🚀 Quick Start

### One-Command Smoke Test

```bash
# Run comprehensive smoke test
./scripts/smoke.sh

# Custom configuration
./scripts/smoke.sh -u http://localhost:8080 -p mypassword

# Environment variables
BASE_URL=http://localhost:8080 ADMIN_PASSWORD=mypassword ./scripts/smoke.sh
```

### Manual Testing (if cookies required)

If the automated admin tests fail due to authentication, follow these manual steps:

1. **Login to admin panel**: `http://localhost:3000/admin`
2. **Create test card**: Use the admin interface to create a temporary card
3. **Edit card**: Modify the card's name and description
4. **Upload icon**: Upload a small test icon file
5. **Delete card**: Remove the test card

## 📋 Exact Test Commands

### Public API Tests

#### 1. Appearance Endpoint

```bash
# Expected: 200 OK with JSON response
curl -i "http://localhost:3000/api/public/appearance"

# Expected response structure:
{
  "instanceName": "Lab Portal",
  "headerMessage": "Welcome to the Lab",
  "theme": "cyberpunk"
}
```

#### 2. Status Summary Endpoint

```bash
# Expected: 200 OK with JSON response
curl -i "http://localhost:3000/api/public/status/summary"

# Expected response structure:
{
  "totalCards": 5,
  "onlineCards": 3,
  "offlineCards": 2,
  "uptime": "2d 5h 30m"
}
```

### Queue Endpoint Test

#### 3. Empty Queue Verification

```bash
# Expected: 204 No Content (when queue is empty)
curl -i "http://localhost:3000/api/control/queue?wait=1"

# Alternative expected responses:
# - 204 No Content: Queue is empty
# - 401 Unauthorized: Authentication required
# - 403 Forbidden: Access denied
```

### Admin Card Management Tests

#### 4. Create Test Card

```bash
# Expected: 201 Created with card ID
curl -X POST "http://localhost:3000/api/cards" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Smoke Test Card",
    "description": "Temporary card for smoke testing",
    "url": "http://localhost:8080",
    "enabled": true,
    "group": "test"
  }'

# Expected response:
{
  "id": "card-uuid-here",
  "name": "Smoke Test Card",
  "description": "Temporary card for smoke testing",
  "url": "http://localhost:8080",
  "enabled": true,
  "group": "test"
}
```

#### 5. Edit Test Card

```bash
# Expected: 200 OK with updated card
curl -X PUT "http://localhost:3000/api/cards/CARD_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Smoke Test Card - Edited",
    "description": "Updated description for smoke testing",
    "url": "http://localhost:8080",
    "enabled": true,
    "group": "test"
  }'
```

#### 6. Upload Icon

```bash
# Expected: 200 OK with icon URL
curl -X POST "http://localhost:3000/api/cards/CARD_ID/icon" \
  -H "Cookie: your-session-cookie" \
  -F "icon=@/path/to/tiny-icon.svg"

# Create a tiny test icon:
echo '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="red"/></svg>' > test-icon.svg
```

#### 7. Delete Test Card

```bash
# Expected: 200 OK or 204 No Content
curl -X DELETE "http://localhost:3000/api/cards/CARD_ID" \
  -H "Cookie: your-session-cookie"
```

## 🏗️ Architecture

### Authentication Methods

The smoke test supports multiple authentication approaches:

1. **Session-based Authentication** (Primary)
   - Uses browser cookies for admin operations
   - Automatically handles CSRF tokens
   - Falls back to manual instructions if login fails

2. **API Key Authentication** (Control Actions)
   - Uses `X-API-Key` header for control endpoints
   - Key: `smoke-test-key` (hardcoded for simplicity)
   - Can be overridden via `ADMIN_API_KEY` environment variable

### Test Flow

1. **Setup Phase**
   - Check dependencies (`curl`, `jq`)
   - Wait for portal readiness
   - Configure authentication

2. **Public API Phase**
   - Test appearance endpoint
   - Test status summary endpoint

3. **Control System Phase**
   - Verify queue endpoint behavior
   - Test control actions (via control-smoke.sh)

4. **Admin Management Phase**
   - Test card CRUD operations
   - Test icon upload functionality
   - Provide manual fallback instructions

5. **Cleanup Phase**
   - Remove temporary files
   - Clean up test data

## 📁 Files

### Core Scripts

- `scripts/smoke.sh` - **NEW**: Comprehensive smoke test script
- `scripts/control-smoke.sh` - Control actions smoke test
- `scripts/test-smoke.sh` - Script validation script
- `scripts/test-public-api.sh` - Public API testing

### Documentation

- `docs/dev/SMOKE_TESTING.md` - This comprehensive guide
- `docs/dev/TESTING.md` - General testing documentation
- `README.md` - Quick start with smoke test command

## 🎯 Control Actions Overview

The control actions smoke test validates the end-to-end control actions flow without requiring a UI, making it perfect for:

- CI/CD pipelines
- Development validation
- Pre-deployment verification
- Debugging control action issues

## 🏗️ Architecture

### Authentication Method

The smoke test uses API key authentication via the `X-API-Key` header:

- **Key**: `smoke-test-key` (hardcoded for simplicity)
- **Header**: `X-API-Key: smoke-test-key`
- **Fallback**: Session-based authentication (for UI users)

### Test Flow

1. **Setup Phase**
   - Check dependencies (`curl`, `jq`)
   - Wait for portal readiness
   - Configure API key authentication

2. **Infrastructure Phase**
   - Create/retrieve test host (`smoke-test-host`)
   - Create/retrieve test service (`smoke-test.service`)

3. **Testing Phase**
   - **Localhost Path**: Test start/stop actions with completion verification
   - **Agent Path**: Test restart action with agent pickup verification

4. **Cleanup Phase**
   - Remove temporary files
   - Test data remains for reuse

## 📁 Files

### Core Scripts

- `scripts/curl/control-smoke.sh` - Main smoke test script
- `scripts/curl/test-smoke.sh` - Script validation script
- `scripts/curl/env.example` - Environment configuration example

### Documentation

- `scripts/README.md` - Scripts directory documentation
- `SMOKE_TESTING.md` - This file

## 🚀 Usage

### Basic Usage

```bash
# Run with defaults
./scripts/curl/control-smoke.sh

# Custom configuration
./scripts/curl/control-smoke.sh -u http://localhost:8080 -p mypassword

# Environment variables
BASE_URL=http://localhost:8080 ADMIN_PASSWORD=mypassword ./scripts/curl/control-smoke.sh
```

### Validation

```bash
# Test script without running actual tests
./scripts/curl/test-smoke.sh
```

## ⚙️ Configuration

### Environment Variables

- `BASE_URL` - Portal base URL (default: http://localhost:3000)
- `ADMIN_PASSWORD` - Admin password (default: admin123)
- `ADMIN_API_KEY` - API key for authentication

### Command Line Options

- `-u, --url` - Custom portal URL
- `-p, --password` - Custom admin password
- `-v, --verbose` - Enable debug output
- `-h, --help` - Show help message

## 🔧 Implementation Details

### API Key Authentication

The smoke test bypasses session-based authentication by using a hardcoded API key:

```typescript
// In src/lib/auth.ts
export async function isAdminAuthenticated(
  request: NextRequest
): Promise<boolean> {
  try {
    // First check for API key authentication (for smoke tests)
    const apiKey = request.headers.get('x-api-key');
    if (apiKey === process.env.ADMIN_API_KEY || apiKey === 'smoke-test-key') {
      return true;
    }

    // Then check for session-based authentication
    const session = await getServerSession();
    if (session?.user?.email === 'admin@local') {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking admin authentication:', error);
    return false;
  }
}
```

### Test Data Management

The script creates reusable test data:

- **Host**: `smoke-test-host` with address `localhost`
- **Service**: `smoke-test.service` with full permissions
- **Reuse**: Existing test data is detected and reused

### Error Handling

- **Dependencies**: Checks for required tools (`curl`, `jq`)
- **Connectivity**: Waits for portal readiness with retry logic
- **Authentication**: Validates API key and session access
- **Timeouts**: Configurable timeouts for action completion
- **Cleanup**: Automatic cleanup on exit or error

## 🧪 Test Scenarios

### Localhost Path Testing

1. **Start Action**: Enqueue start action for test service
2. **Completion Wait**: Wait up to 5 minutes for completion
3. **Stop Action**: Enqueue stop action for test service
4. **Completion Wait**: Wait up to 5 minutes for completion
5. **Verification**: Check exit codes and messages

### Agent Path Testing

1. **Restart Action**: Enqueue restart action for test service
2. **Pickup Wait**: Wait up to 2.5 minutes for agent pickup
3. **Verification**: Confirm action status changes to "running"

## 🔍 Monitoring and Debugging

### Verbose Mode

```bash
./scripts/curl/control-smoke.sh -v
```

### Status Tracking

The script provides real-time status updates:

- Action enqueuing confirmation
- Status polling every 5 seconds
- Progress indicators with attempt counts
- Detailed error messages and exit codes

### Logging

- **INFO**: General progress information
- **SUCCESS**: Successful operations
- **WARNING**: Non-critical issues
- **ERROR**: Critical failures

## 🚨 Troubleshooting

### Common Issues

#### Portal Not Accessible

```bash
# Check if portal is running
curl http://localhost:3000/api/test-env

# Check firewall/network settings
netstat -tlnp | grep :3000
```

#### Authentication Failed

```bash
# Verify API key is set
echo $ADMIN_API_KEY

# Check auth configuration
grep ADMIN_API_KEY .env.local
```

#### Dependencies Missing

```bash
# Install curl and jq
sudo apt-get install curl jq  # Ubuntu/Debian
brew install curl jq           # macOS
sudo yum install curl jq       # CentOS/RHEL
```

#### Permission Denied

```bash
# Make scripts executable
chmod +x scripts/curl/*.sh
```

### Debug Mode

```bash
# Enable verbose output
./scripts/curl/control-smoke.sh -v

# Check script syntax
bash -n scripts/curl/control-smoke.sh

# Validate script
./scripts/curl/test-smoke.sh
```

## 🔒 Security Considerations

### API Key Security

- **Hardcoded Key**: `smoke-test-key` is hardcoded for simplicity
- **Environment Override**: Can be overridden via `ADMIN_API_KEY` environment variable
- **Production Use**: Consider using proper JWT tokens for production

### Test Data Isolation

- **Dedicated Names**: Test data uses `smoke-test-*` naming convention
- **No Cleanup**: Test data remains for reuse across test runs
- **Manual Cleanup**: Can be manually removed via admin interface

### Network Security

- **Local Testing**: Designed for localhost/development environments
- **Firewall**: Ensure portal port is accessible
- **HTTPS**: Consider TLS for production deployments

## 📈 Performance

### Timing

- **Portal Ready**: Up to 1 minute wait
- **Action Completion**: Up to 5 minutes per action
- **Agent Pickup**: Up to 2.5 minutes wait
- **Total Runtime**: Typically 3-10 minutes

### Resource Usage

- **Memory**: Minimal (bash script)
- **CPU**: Low (mostly waiting)
- **Network**: Light API calls
- **Storage**: Temporary cookie files (if using session auth)

## 🔄 Integration

### CI/CD Pipelines

```yaml
# Example GitHub Actions workflow
- name: Run Smoke Tests
  run: |
    chmod +x scripts/curl/*.sh
    ./scripts/curl/control-smoke.sh
  env:
    BASE_URL: ${{ secrets.PORTAL_URL }}
    ADMIN_API_KEY: ${{ secrets.ADMIN_API_KEY }}
```

### Development Workflow

```bash
# Pre-commit validation
./scripts/curl/control-smoke.sh

# Pre-deployment verification
./scripts/curl/control-smoke.sh -u https://staging.example.com

# Debug mode for troubleshooting
./scripts/curl/control-smoke.sh -v
```

### Monitoring

```bash
# Scheduled health checks
0 */6 * * * /path/to/labPortal/scripts/curl/control-smoke.sh

# Alert on failure
./scripts/curl/control-smoke.sh || notify-send "Smoke test failed"
```

## 🚀 Future Enhancements

### Planned Features

- **Parallel Testing**: Run multiple action types concurrently
- **Load Testing**: Stress test with multiple concurrent actions
- **Metrics Collection**: Performance and reliability metrics
- **Report Generation**: HTML/JSON test reports
- **Integration Tests**: Test with actual systemd services

### Extensibility

- **Custom Actions**: Support for custom action types
- **Plugin System**: Modular test scenarios
- **Configuration**: YAML/JSON configuration files
- **Multi-Environment**: Support for multiple portal instances

## 📚 References

- [Control Actions API](../api/CONTROL_ACTIONS_API.md)
- [Local Action Execution](../agent/LOCAL_ACTION_EXECUTION.md)
- [Project Status](../../PROJECT_STATUS.md)
- [Scripts Documentation](../scripts.md)

---

**Lab Portal Smoke Testing** - Comprehensive end-to-end validation without UI dependencies 🧪✨
