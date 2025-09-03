# Agent Endpoint Hardening Implementation

## Overview

This document describes the implementation of agent endpoint hardening for the Lab Portal application. The hardening ensures that agent endpoints are properly secured and isolated from admin/session-based authentication.

## Implemented Security Measures

### 1. Agent Middleware Hardening

The middleware (`src/middleware.ts`) now includes specific hardening for agent endpoints:

- **Cookie Rejection**: All requests to agent endpoints with cookies are rejected with a 400 status
- **Authorization Header Requirement**: All agent endpoints require a valid `Authorization: Bearer <token>` header
- **Early Rejection**: Invalid requests are rejected at the middleware level before reaching the route handlers

### 2. Protected Endpoints

The following endpoints are now hardened:

- `/api/agents/*` - All agent-related endpoints
- `/api/control/queue` - Action queue endpoint (enhanced with polling and action locking)
- `/api/control/report` - Action reporting endpoint

### 3. Authentication Flow

1. **Middleware Check**: Rejects cookies and validates Authorization header format
2. **Principal Validation**: Uses `withAgentAuth` wrapper to validate the Bearer token
3. **Host Lookup**: Token hash is validated against the `Host.agentTokenHash` field
4. **Principal Attachment**: Valid requests receive a principal with `{type: 'agent', hostId}`

### 4. Response Headers

All agent responses include:
- `Cache-Control: no-store` - Prevents caching of sensitive data
- `Vary: Authorization` - Ensures proper cache key generation

## Enhanced Queue Endpoint

The `/api/control/queue` endpoint has been significantly enhanced to provide good wire behavior for agents:

### Features

- **Polling Support**: Configurable wait time (0-25 seconds) with intelligent polling every ~500ms
- **Action Locking**: Actions are automatically locked (status=running, startedAt=now()) when returned
- **Proper HTTP Status Codes**: 200 for actions, 204 for no content, 400 for invalid parameters
- **Connection Keep-Alive**: Maintains persistent connections for efficient agent communication

### Parameters

- `max`: Number of actions to return (1-10, default: 1)
- `wait`: Seconds to poll for actions (0-25, default: 0)

### Response Behavior

- **Immediate Response**: Returns actions immediately if available
- **Polling**: If no actions and wait > 0, polls database until actions found or timeout
- **Action Locking**: Uses database transactions to atomically lock actions
- **Host Isolation**: Only returns actions for the authenticated host

For detailed documentation, see [QUEUE_ENDPOINT_BEHAVIOR.md](QUEUE_ENDPOINT_BEHAVIOR.md).

## Implementation Details

### Middleware Updates

```typescript
// Check if this is an agent endpoint that needs hardening
const isAgentEndpoint = pathname.startsWith('/api/agents') || 
                       pathname === '/api/control/queue' || 
                       pathname === '/api/control/report'

// Agent endpoint hardening
if (isAgentEndpoint) {
  // Reject requests with cookies
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    return new NextResponse(
      JSON.stringify({ error: 'Cookies not allowed for agent endpoints' }),
      { status: 400, headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization' } }
    )
  }
  
  // Require Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ error: 'Authorization header with Bearer token required' }),
      { status: 401, headers: { 'Cache-Control': 'no-store', 'Vary': 'Authorization' } }
    )
  }
}
```

### Route Handler Updates

All agent routes now use the modern `withAgentAuth` wrapper:

```typescript
export const GET = withAgentAuth(async (request: NextRequest, principal: Principal) => {
  // The principal is already validated and contains the hostId
  if (principal.type !== 'agent') {
    throw new Error('Expected agent principal')
  }
  const { hostId } = principal
  
  // Route logic here...
})
```

### Authentication Wrapper Updates

The `withAgentAuth` wrapper ensures proper headers:

```typescript
export function withAgentAuth(handler: RouteHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const principal = await getPrincipal(req, { require: 'agent' })
      const response = await handler(req, principal)
      
      // Ensure Cache-Control: no-store and Vary: Authorization are set
      response.headers.set('Cache-Control', 'no-store')
      response.headers.set('Vary', 'Authorization')
      
      return response
    } catch (error) {
      // Error handling with proper headers...
    }
  }
}
```

## Security Benefits

1. **Isolation**: Agent endpoints cannot be accessed via session cookies
2. **Token Validation**: All agent requests must provide valid Bearer tokens
3. **Host Binding**: Each token is bound to a specific host
4. **No Caching**: Sensitive agent data is never cached
5. **Proper Vary Headers**: Cache keys properly account for authorization
6. **Action Locking**: Prevents race conditions when multiple agents might process the same action

## Testing

A comprehensive test suite validates:

- ✅ Cookie rejection (400 status)
- ✅ Missing Authorization header rejection (401 status)
- ✅ Invalid Authorization format rejection (401 status)
- ✅ Valid Authorization format processing (passes middleware)
- ✅ Control endpoint protection
- ✅ Security header presence
- ✅ Enhanced queue endpoint behavior

## Migration Notes

- Legacy authentication functions (`requireAgentAuth`, `getHostFromToken`) are deprecated
- All new agent routes should use `withAgentAuth` wrapper
- The middleware automatically protects specified endpoints
- No changes required to existing admin routes

## Future Enhancements

1. **Rate Limiting**: Add rate limiting specific to agent endpoints
2. **Token Rotation**: Implement automatic token rotation for enhanced security
3. **Audit Logging**: Add comprehensive logging of agent authentication attempts
4. **IP Whitelisting**: Consider IP-based restrictions for agent endpoints
5. **Adaptive Polling**: Adjust poll interval based on queue activity
6. **Priority Queuing**: Support for action priorities
7. **Webhook Support**: Push notifications for new actions
