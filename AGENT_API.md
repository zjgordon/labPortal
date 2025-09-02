# Agent API

The Agent API allows remote hosts to authenticate, pull queued actions, and report execution results. This system enables distributed service control across multiple hosts without requiring direct admin access.

## Authentication

Agents authenticate using Bearer tokens in the Authorization header:

```bash
Authorization: Bearer <agent-token>
```

The token must match a valid `agentToken` in the Host table.

## Endpoints

### GET /api/control/queue

Get the next queued actions for the authenticated host.

**Query Parameters:**
- `max` (optional): Maximum number of actions to return (1-10, default: 1)

**Response (200 OK):**
```json
[
  {
    "id": "action-id",
    "hostId": "host-id",
    "serviceId": "service-id",
    "kind": "start",
    "status": "queued",
    "requestedBy": "admin@local",
    "requestedAt": "2025-09-02T21:30:00.000Z",
    "service": {
      "id": "service-id",
      "unitName": "nginx.service",
      "displayName": "Nginx Web Server",
      "description": "High-performance web server"
    }
  }
]
```

**Error Responses:**
- `401 Unauthorized`: Valid agent token required
- `400 Bad Request`: Invalid max parameter
- `500 Internal Server Error`: Server error

### POST /api/control/report

Report the status update for an action.

**Request Body:**
```json
{
  "actionId": "action-id",
  "status": "running" | "succeeded" | "failed",
  "exitCode": 0,
  "message": "Service started successfully"
}
```

**Status Transitions:**
- `queued` → `running`: Action is being executed
- `running` → `succeeded`: Action completed successfully
- `running` → `failed`: Action failed with error

**Response (200 OK):**
```json
{
  "id": "action-id",
  "hostId": "host-id",
  "serviceId": "service-id",
  "kind": "start",
  "status": "succeeded",
  "requestedBy": "admin@local",
  "requestedAt": "2025-09-02T21:30:00.000Z",
  "startedAt": "2025-09-02T21:30:01.000Z",
  "finishedAt": "2025-09-02T21:30:05.000Z",
  "exitCode": 0,
  "message": "Service started successfully",
  "host": { "id": "host-id", "name": "remote-host" },
  "service": { "id": "service-id", "unitName": "nginx.service", "displayName": "Nginx" }
}
```

**Error Responses:**
- `401 Unauthorized`: Valid agent token required
- `400 Bad Request`: Validation error
- `403 Forbidden`: Action does not belong to this host
- `404 Not Found`: Action not found
- `500 Internal Server Error`: Server error

### POST /api/agents/heartbeat

Update the host's last seen timestamp.

**Request Body:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Heartbeat received",
  "host": {
    "id": "host-id",
    "name": "remote-host",
    "lastSeenAt": "2025-09-02T21:35:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Valid agent token required
- `404 Not Found`: Host not found
- `500 Internal Server Error`: Server error

## Agent Workflow

### 1. Authentication
```bash
# Set the agent token for all requests
export AGENT_TOKEN="your-agent-token-here"
```

### 2. Heartbeat
```bash
# Send periodic heartbeat
curl -X POST http://portal.example.com/api/agents/heartbeat \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### 3. Poll for Actions
```bash
# Get next queued action
curl -H "Authorization: Bearer $AGENT_TOKEN" \
  "http://portal.example.com/api/control/queue?max=1"
```

### 4. Execute Action
```bash
# Parse the action response and execute the command
# Example: systemctl start nginx.service
```

### 5. Report Status
```bash
# Report action started
curl -X POST http://portal.example.com/api/control/report \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "action-id-from-queue",
    "status": "running"
  }'

# Report action completed
curl -X POST http://portal.example.com/api/control/report \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actionId": "action-id-from-queue",
    "status": "succeeded",
    "exitCode": 0,
    "message": "Service started successfully"
  }'
```

## Example Agent Implementation

### Python Agent
```python
import requests
import time
import subprocess
import json

class PortalAgent:
    def __init__(self, portal_url, agent_token):
        self.portal_url = portal_url
        self.headers = {
            'Authorization': f'Bearer {agent_token}',
            'Content-Type': 'application/json'
        }
    
    def heartbeat(self):
        """Send heartbeat to portal"""
        try:
            response = requests.post(
                f"{self.portal_url}/api/agents/heartbeat",
                headers=self.headers,
                json={}
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Heartbeat failed: {e}")
            return False
    
    def get_next_action(self):
        """Get next queued action"""
        try:
            response = requests.get(
                f"{self.portal_url}/api/control/queue?max=1",
                headers=self.headers
            )
            if response.status_code == 200:
                actions = response.json()
                return actions[0] if actions else None
            return None
        except Exception as e:
            print(f"Failed to get action: {e}")
            return None
    
    def report_status(self, action_id, status, exit_code=None, message=None):
        """Report action status"""
        try:
            data = {
                'actionId': action_id,
                'status': status
            }
            if exit_code is not None:
                data['exitCode'] = exit_code
            if message:
                data['message'] = message
            
            response = requests.post(
                f"{self.portal_url}/api/control/report",
                headers=self.headers,
                json=data
            )
            return response.status_code == 200
        except Exception as e:
            print(f"Failed to report status: {e}")
            return False
    
    def execute_action(self, action):
        """Execute a systemctl action"""
        try:
            # Report action started
            self.report_status(action['id'], 'running')
            
            # Execute the command
            cmd = f"systemctl {action['kind']} {action['service']['unitName']}"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            # Report result
            if result.returncode == 0:
                self.report_status(
                    action['id'], 
                    'succeeded', 
                    result.returncode,
                    f"Successfully {action['kind']}ed {action['service']['unitName']}"
                )
            else:
                self.report_status(
                    action['id'], 
                    'failed', 
                    result.returncode,
                    f"Failed to {action['kind']} {action['service']['unitName']}: {result.stderr}"
                )
                
        except Exception as e:
            self.report_status(
                action['id'], 
                'failed', 
                -1,
                f"Exception during execution: {str(e)}"
            )
    
    def run(self):
        """Main agent loop"""
        print("Portal Agent started")
        
        while True:
            try:
                # Send heartbeat
                if not self.heartbeat():
                    print("Heartbeat failed, retrying in 30 seconds...")
                    time.sleep(30)
                    continue
                
                # Get next action
                action = self.get_next_action()
                if action:
                    print(f"Executing action: {action['kind']} {action['service']['unitName']}")
                    self.execute_action(action)
                else:
                    print("No actions in queue")
                
                # Wait before next poll
                time.sleep(10)
                
            except KeyboardInterrupt:
                print("Agent stopped by user")
                break
            except Exception as e:
                print(f"Agent error: {e}")
                time.sleep(30)

# Usage
if __name__ == "__main__":
    agent = PortalAgent(
        portal_url="http://portal.example.com",
        agent_token="your-agent-token"
    )
    agent.run()
```

### Bash Agent
```bash
#!/bin/bash

PORTAL_URL="http://portal.example.com"
AGENT_TOKEN="your-agent-token"
HOST_ID="remote-host-id"

# Send heartbeat
heartbeat() {
    curl -s -X POST "$PORTAL_URL/api/agents/heartbeat" \
        -H "Authorization: Bearer $AGENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{}' > /dev/null
}

# Get next action
get_action() {
    curl -s -H "Authorization: Bearer $AGENT_TOKEN" \
        "$PORTAL_URL/api/control/queue?max=1"
}

# Report status
report_status() {
    local action_id="$1"
    local status="$2"
    local exit_code="$3"
    local message="$4"
    
    local data="{\"actionId\":\"$action_id\",\"status\":\"$status\""
    if [ -n "$exit_code" ]; then
        data="$data,\"exitCode\":$exit_code"
    fi
    if [ -n "$message" ]; then
        data="$data,\"message\":\"$message\""
    fi
    data="$data}"
    
    curl -s -X POST "$PORTAL_URL/api/control/report" \
        -H "Authorization: Bearer $AGENT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$data" > /dev/null
}

# Execute action
execute_action() {
    local action_json="$1"
    local action_id=$(echo "$action_json" | jq -r '.id')
    local kind=$(echo "$action_json" | jq -r '.kind')
    local unit_name=$(echo "$action_json" | jq -r '.service.unitName')
    
    echo "Executing: systemctl $kind $unit_name"
    
    # Report started
    report_status "$action_id" "running"
    
    # Execute command
    if systemctl "$kind" "$unit_name"; then
        report_status "$action_id" "succeeded" 0 "Successfully ${kind}ed $unit_name"
    else
        local exit_code=$?
        report_status "$action_id" "failed" "$exit_code" "Failed to $kind $unit_name"
    fi
}

# Main loop
main() {
    echo "Portal Agent started"
    
    while true; do
        # Send heartbeat
        if ! heartbeat; then
            echo "Heartbeat failed, retrying in 30 seconds..."
            sleep 30
            continue
        fi
        
        # Get next action
        action=$(get_action)
        if [ "$(echo "$action" | jq length)" -gt 0 ]; then
            echo "Processing action..."
            execute_action "$action"
        else
            echo "No actions in queue"
        fi
        
        # Wait before next poll
        sleep 10
    done
}

main
```

## Security Features

### Token-Based Authentication
- Each host has a unique agent token
- Tokens are validated against the database
- No session management required

### Host Isolation
- Agents can only access actions for their own host
- Cross-host access is prevented
- Token rotation is supported

### Input Validation
- All inputs are validated using Zod schemas
- Status transitions are controlled
- Message length is limited

## Error Handling

### Network Issues
- Implement exponential backoff for failed requests
- Continue operation after temporary failures
- Log all errors for debugging

### Invalid Actions
- Report failed status with error details
- Continue processing other actions
- Maintain agent uptime

### Token Issues
- Stop processing if token becomes invalid
- Log authentication failures
- Contact administrator for new token

## Monitoring

### Host Status
- `lastSeenAt` tracks agent activity
- Monitor for hosts that haven't reported recently
- Set up alerts for offline agents

### Action Processing
- Track action completion times
- Monitor success/failure rates
- Identify problematic services

### Agent Health
- Heartbeat frequency indicates agent health
- Monitor for agents that stop responding
- Track agent uptime and reliability

## Best Practices

### Token Management
- Rotate agent tokens regularly
- Use strong, random tokens
- Store tokens securely on agents

### Error Handling
- Implement comprehensive error handling
- Log all failures with context
- Provide meaningful error messages

### Performance
- Poll at reasonable intervals (10-30 seconds)
- Implement connection pooling
- Use appropriate timeouts

### Security
- Use HTTPS for all communications
- Validate all inputs on both sides
- Monitor for suspicious activity
