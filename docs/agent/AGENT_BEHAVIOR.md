# Lab Portal Agent - Predictable Behavior

This document describes the enhanced behavior of the Lab Portal Agent, focusing on predictable execution patterns and improved status reporting.

## Overview

The agent now provides predictable, configurable behavior with enhanced status reporting, timeout handling, and restart retry logic. This ensures consistent operation across different environments and better visibility into action execution.

## Key Features

### 1. Configurable Timeouts
- **EXEC_TIMEOUT_MS**: Configurable command execution timeout (default: 60000ms)
- **RESTART_RETRY**: Number of retry attempts for restart failures (default: 1)
- **POLL_INTERVAL**: Heartbeat and action polling frequency (default: 4000ms)

### 2. Enhanced Status Reporting
- **Running Status**: Reports "running" when starting work
- **Final Status**: Reports completion with exitCode and stderr
- **Timeout Handling**: Special handling for timeout cases
- **Message Capping**: Prevents overly long status reports

### 3. Restart Retry Logic
- Automatically retries failed restart commands
- Configurable retry count
- Small delay between retry attempts
- Logs retry attempts and results

## Environment Configuration

```bash
# Required Configuration
HOST_ID=your-host-name
PORTAL_BASE_URL=http://localhost:3000
AGENT_TOKEN=your-agent-token-here

# Timing Configuration
POLL_INTERVAL=4000                    # 4 seconds
EXEC_TIMEOUT_MS=60000                 # 60 seconds
RESTART_RETRY=1                       # 1 retry attempt

# Environment
NODE_ENV=production
```

## Behavior Patterns

### Action Execution Flow

1. **Action Discovery**: Agent polls for queued actions
2. **Status Report**: Reports "running" status to portal
3. **Command Execution**: Executes systemctl command with timeout
4. **Result Processing**: Handles success, failure, or timeout
5. **Final Report**: Reports final status with details
6. **Retry Logic**: Optionally retries restart failures

### Status Reporting

#### Starting Work
```json
{
  "actionId": "action-123",
  "status": "running"
}
```

#### Successful Completion
```json
{
  "actionId": "action-123",
  "status": "succeeded",
  "exitCode": 0,
  "message": "Successfully executed: systemctl start nginx.service",
  "stderr": ""
}
```

#### Failed Execution
```json
{
  "actionId": "action-123",
  "status": "failed",
  "exitCode": 1,
  "message": "Failed to execute: systemctl start nginx.service. Error: Unit not found",
  "stderr": "Unit nginx.service not found"
}
```

#### Timeout Case
```json
{
  "actionId": "action-123",
  "status": "failed",
  "exitCode": null,
  "message": "timeout",
  "stderr": "Command output truncated..."
}
```

### Restart Retry Logic

When a restart command fails with a non-zero exit code (and is not a timeout):

1. **Log Retry**: Agent logs the failure and retry attempt
2. **Wait Delay**: Waits 2 seconds before retry
3. **Execute Retry**: Attempts the restart command again
4. **Report Result**: Reports the final result (success or failure)

#### Retry Example
```
[INFO] Executing: systemctl restart nginx.service (timeout: 60000ms)
[INFO] Restart failed with exit code 1, retrying once after delay...
[INFO] Restart retry succeeded
```

## Configuration Validation

The agent validates configuration on startup:

- **Required Fields**: HOST_ID, PORTAL_BASE_URL, AGENT_TOKEN
- **Numeric Validation**: POLL_INTERVAL, EXEC_TIMEOUT_MS, RESTART_RETRY
- **Range Validation**: Ensures positive values for timing fields

### Configuration Errors

```bash
# Missing required field
❌ AGENT_TOKEN environment variable is required

# Invalid numeric value
❌ POLL_INTERVAL must be greater than 0
❌ EXEC_TIMEOUT_MS must be greater than 0
❌ RESTART_RETRY must be 0 or greater
```

## Timeout Handling

### Timeout Detection
- **ETIMEDOUT**: Command execution exceeds timeout
- **SIGTERM**: Process terminated due to timeout
- **Exit Code**: Set to `null` for timeout cases

### Timeout Behavior
1. **Command Termination**: Long-running commands are killed
2. **Status Report**: Reports "failed" with "timeout" message
3. **Exit Code**: Set to `null` to distinguish from other failures
4. **Stderr**: Includes truncated command output

### Timeout Configuration

```bash
# Short timeout for development
EXEC_TIMEOUT_MS=30000    # 30 seconds

# Standard timeout for production
EXEC_TIMEOUT_MS=60000    # 60 seconds

# Long timeout for slow services
EXEC_TIMEOUT_MS=120000   # 2 minutes
```

## Message and Output Capping

### Length Limits
- **Message**: Capped at 500 characters
- **Stderr**: Capped at 1000 characters
- **Truncation**: Adds "..." suffix when capped

### Capping Example
```bash
# Original message (600 characters)
"Very long message that exceeds the maximum allowed length..."

# Capped message (500 characters)
"Very long message that exceeds the maximum allowed length... (truncated)"
```

## Error Handling

### Execution Errors
- **Command Not Found**: systemctl not available
- **Permission Denied**: Insufficient privileges
- **Unit Not Found**: Service doesn't exist
- **Service Failure**: Service-specific errors

### Network Errors
- **Connection Failed**: Portal unreachable
- **Authentication Failed**: Invalid token
- **Rate Limited**: Too many requests

### Recovery Behavior
- **Automatic Retry**: For restart commands
- **Error Logging**: Detailed error information
- **Status Reporting**: Always reports final status
- **Graceful Degradation**: Continues operation on errors

## Monitoring and Debugging

### Log Levels
- **INFO**: Normal operation and status changes
- **DEBUG**: Detailed execution information
- **WARN**: Retry attempts and non-critical issues
- **ERROR**: Failures and critical errors

### Key Log Messages
```
[INFO] Agent started, beginning main loop...
[INFO] Found 1 queued action(s)
[INFO] Executing action abc-123: start nginx.service (timeout: 60000ms)
[INFO] Command completed in 1250ms with exit code 0
[INFO] Action abc-123 completed with status: succeeded
```

### Debug Information
- **Execution Duration**: Time taken for each command
- **Exit Codes**: Detailed exit code information
- **Retry Attempts**: Logs retry logic decisions
- **Configuration**: Shows loaded configuration values

## Best Practices

### Production Configuration
```bash
# Conservative timeouts
EXEC_TIMEOUT_MS=120000   # 2 minutes
RESTART_RETRY=1          # Single retry
POLL_INTERVAL=5000       # 5 second polling

# Environment
NODE_ENV=production
```

### Development Configuration
```bash
# Faster feedback
EXEC_TIMEOUT_MS=30000    # 30 seconds
RESTART_RETRY=1          # Single retry
POLL_INTERVAL=2000       # 2 second polling

# Environment
NODE_ENV=development
```

### Monitoring Configuration
```bash
# Aggressive monitoring
EXEC_TIMEOUT_MS=30000    # 30 seconds
RESTART_RETRY=2          # Multiple retries
POLL_INTERVAL=1000       # 1 second polling

# Environment
NODE_ENV=production
```

## Troubleshooting

### Common Issues

#### Timeout Errors
```bash
# Check timeout configuration
echo $EXEC_TIMEOUT_MS

# Increase timeout for slow services
export EXEC_TIMEOUT_MS=120000
```

#### Retry Not Working
```bash
# Check retry configuration
echo $RESTART_RETRY

# Enable retries
export RESTART_RETRY=1
```

#### Status Not Reporting
```bash
# Check portal connectivity
curl -H "Authorization: Bearer $AGENT_TOKEN" \
     "$PORTAL_BASE_URL/api/agents/heartbeat"

# Verify token validity
# Check portal logs for authentication errors
```

### Debug Mode
```bash
# Enable debug logging
export NODE_ENV=development

# Check configuration
node -e "console.log(require('./dist/config').loadConfig())"
```

## Integration Notes

### Portal API Compatibility
- **Status Values**: running, succeeded, failed
- **Exit Codes**: number or null (for timeouts)
- **Message Length**: Capped at 500 characters
- **Stderr Length**: Capped at 1000 characters

### Action Lifecycle
1. **Queued**: Action created in portal
2. **Running**: Agent reports "running" status
3. **Completed**: Agent reports final status
4. **Archived**: Portal stores action history

### Error Recovery
- **Network Issues**: Automatic retry on next poll cycle
- **Command Failures**: Immediate retry for restart commands
- **Timeout Issues**: No retry, reports timeout status
- **Configuration Errors**: Fails fast with clear error messages

This predictable behavior ensures consistent operation and better visibility into agent performance across all environments.
