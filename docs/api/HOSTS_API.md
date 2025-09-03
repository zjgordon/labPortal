# Hosts API

The Hosts API provides endpoints for managing infrastructure hosts, including agent token management and health monitoring.

## Overview

Hosts represent infrastructure nodes that can run services and execute control actions. Each host has:

- **Basic Information**: Name, description, and connection details
- **Agent Authentication**: Secure token-based authentication for remote control
- **Health Monitoring**: Last seen timestamp and agent status
- **Service Association**: Links to managed services on the host

## Endpoints

### Host Management

#### GET /api/hosts

Retrieves all hosts with sanitized token information.

**Authentication**: Admin session required
**Method**: GET
**Cache**: No caching (admin data)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "host-id",
      "name": "production-server",
      "description": "Production web server",
      "agentTokenPrefix": "prod_",
      "tokenRotatedAt": "2025-09-03T06:00:00.000Z",
      "lastSeenAt": "2025-09-03T05:55:00.000Z",
      "createdAt": "2025-09-02T10:00:00.000Z",
      "updatedAt": "2025-09-03T06:00:00.000Z"
    }
  ]
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized (no session)
- `500`: Internal server error

**Security Note**: Only token prefixes and rotation timestamps are returned. Full tokens are never exposed.

#### POST /api/hosts

Creates a new host.

**Authentication**: Admin session required
**Method**: POST
**Origin Validation**: Required for state-changing operations

**Request Body**:

```json
{
  "name": "new-host",
  "description": "New infrastructure host"
}
```

**Validation Rules**:

- `name`: Required string, 1-100 characters, trimmed
- `description`: Optional string, max 500 characters

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "new-host-id",
    "name": "new-host",
    "description": "New infrastructure host",
    "agentTokenPrefix": null,
    "tokenRotatedAt": null,
    "lastSeenAt": null,
    "createdAt": "2025-09-03T06:00:00.000Z",
    "updatedAt": "2025-09-03T06:00:00.000Z"
  }
}
```

**Status Codes**:

- `201`: Created
- `400`: Validation error
- `401`: Unauthorized (no session)
- `403`: Forbidden (invalid origin)
- `500`: Internal server error

#### GET /api/hosts/:id

Retrieves a specific host by ID.

**Authentication**: Admin session required
**Method**: GET
**Cache**: No caching (admin data)

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "host-id",
    "name": "production-server",
    "description": "Production web server",
    "agentTokenPrefix": "prod_",
    "tokenRotatedAt": "2025-09-03T06:00:00.000Z",
    "lastSeenAt": "2025-09-03T05:55:00.000Z",
    "createdAt": "2025-09-02T10:00:00.000Z",
    "updatedAt": "2025-09-03T06:00:00.000Z"
  }
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized (no session)
- `404`: Host not found
- `500`: Internal server error

**Security Note**: Only token prefix and rotation date are returned. Full tokens are never exposed. **GET /api/hosts/:id never returns plaintext token.**

#### PUT /api/hosts/:id

Updates a host.

**Authentication**: Admin session required
**Method**: PUT
**Origin Validation**: Required for state-changing operations

**Request Body**:

```json
{
  "name": "updated-host-name",
  "description": "Updated host description"
}
```

**Validation Rules**:

- `name`: Required string, 1-100 characters, trimmed
- `description`: Optional string, max 500 characters

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "host-id",
    "name": "updated-host-name",
    "description": "Updated host description",
    "agentTokenPrefix": "prod_",
    "tokenRotatedAt": "2025-09-03T06:00:00.000Z",
    "lastSeenAt": "2025-09-03T05:55:00.000Z",
    "createdAt": "2025-09-02T10:00:00.000Z",
    "updatedAt": "2025-09-03T06:00:00.000Z"
  }
}
```

**Status Codes**:

- `200`: Success
- `400`: Validation error
- `401`: Unauthorized (no session)
- `403`: Forbidden (invalid origin)
- `404`: Host not found
- `500`: Internal server error

#### DELETE /api/hosts/:id

Deletes a host.

**Authentication**: Admin session required
**Method**: DELETE
**Origin Validation**: Required for state-changing operations

**Response**:

```json
{
  "success": true,
  "message": "Host deleted successfully"
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized (no session)
- `403`: Forbidden (invalid origin)
- `404`: Host not found
- `500`: Internal server error

### Agent Token Management

#### POST /api/hosts/:id/token

**Rotates the agent token for a host.** This is the only way to manage host tokens.

**Authentication**: Admin session required
**Method**: POST
**Origin Validation**: Required for state-changing operations

**Important**: **Rotation returns the token once; only prefix + timestamps stored.** This endpoint returns the plaintext token only once. After rotation, only the token prefix and rotation timestamp are stored.

**Response**:

```json
{
  "message": "Agent token rotated successfully",
  "token": "new-plaintext-token-here",
  "host": {
    "id": "host-id",
    "name": "production-server",
    "tokenPrefix": "prod_",
    "tokenRotatedAt": "2025-09-03T06:00:00.000Z"
  }
}
```

**Status Codes**:

- `200`: Success
- `400`: Validation error
- `401`: Unauthorized (no session)
- `403`: Forbidden (invalid origin)
- `404`: Host not found
- `500`: Internal server error

**Security Features**:

- **One-time Return**: Plaintext token is returned only once during rotation
- **Hash Storage**: Only token hash is stored in database
- **Prefix Tracking**: Token prefix for identification without exposing full token
- **Rotation Timestamp**: Audit trail of when tokens were last rotated

## Token Security Model

### How Tokens Work

1. **Generation**: Admin generates new token via POST `/api/hosts/:id/token`
2. **One-time Return**: Plaintext token returned immediately for agent configuration
3. **Secure Storage**: Only token hash and prefix stored in database
4. **Agent Use**: Agent uses plaintext token for authentication
5. **Validation**: Portal validates tokens against stored hashes

### What's Stored vs. What's Returned

**Stored in Database:**

- `agentTokenHash`: Cryptographic hash of the token
- `agentTokenPrefix`: First few characters for identification
- `tokenRotatedAt`: Timestamp of last rotation

**Never Stored:**

- Plaintext token
- Full token value
- Decryptable token data

**Returned Once:**

- Plaintext token (only during rotation)

**Key Security Principle**: **Rotation returns the token once; only prefix + timestamps stored.**

## Usage Examples

### Create a New Host

```bash
curl -X POST http://localhost:3000/api/hosts \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "web-server-01",
    "description": "Primary web server"
  }'
```

### Rotate Agent Token

```bash
curl -X POST http://localhost:3000/api/hosts/host-id/token \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie"
```

### Update Host Information

```bash
curl -X PUT http://localhost:3000/api/hosts/host-id \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "web-server-01-updated",
    "description": "Updated web server description"
  }'
```

### JavaScript/TypeScript

```typescript
// Create host
const createHost = async (data: HostCreate) => {
  const response = await fetch('/api/hosts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Rotate token
const rotateToken = async (hostId: string) => {
  const response = await fetch(`/api/hosts/${hostId}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.json();
};

// Update host
const updateHost = async (hostId: string, data: HostUpdate) => {
  const response = await fetch(`/api/hosts/${hostId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};
```

## Database Schema

Hosts are stored in the `Host` table:

```sql
CREATE TABLE "Host" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agentTokenHash" TEXT,
    "agentTokenPrefix" TEXT,
    "tokenRotatedAt" DATETIME,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## Security Considerations

### Admin Endpoints

- **Session Authentication**: Requires valid admin session
- **Origin Validation**: Restricted to configured admin origins
- **Input Validation**: Strict Zod schema validation
- **CSRF Protection**: Origin validation prevents cross-site requests

### Token Security

- **One-time Exposure**: Plaintext tokens only returned during rotation
- **Hash Storage**: Cryptographic hashing prevents token recovery
- **Prefix Tracking**: Minimal identification without security risk
- **Rotation Tracking**: Audit trail of token changes

### Data Exposure

- **No Plaintext Tokens**: GET endpoints never return full tokens
- **Minimal Information**: Only necessary identification data exposed
- **Audit Trail**: Comprehensive logging of all operations

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description"
}
```

Common error scenarios:

- **Validation Errors**: Invalid input data format or constraints
- **Authentication Errors**: Missing or invalid credentials
- **Authorization Errors**: Insufficient permissions or invalid origin
- **Not Found**: Host doesn't exist
- **Server Errors**: Internal processing failures

## Integration Notes

### Agent Configuration

After rotating a token:

1. **Immediate Use**: Use the returned plaintext token immediately
2. **Agent Update**: Update agent configuration with new token
3. **Secure Storage**: Store token securely on agent (environment variable, config file)
4. **No Retrieval**: Cannot retrieve plaintext token later

### Monitoring

- **Health Checks**: Monitor `lastSeenAt` for agent connectivity
- **Token Rotation**: Track `tokenRotatedAt` for security compliance
- **Prefix Changes**: Monitor `agentTokenPrefix` for identification

### Best Practices

- **Regular Rotation**: Rotate tokens periodically for security
- **Secure Storage**: Store tokens securely on agents
- **Audit Logging**: Monitor token rotation events
- **Access Control**: Limit admin access to token management
