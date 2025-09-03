# Unified Authentication System

This directory contains the new unified authentication system that provides consistent authentication checks and principal resolution across all API routes.

## Overview

The new system unifies authentication by:
1. **Principal-based authentication**: Each request gets a validated principal object
2. **Role separation**: Admin routes only accept session-based auth, agent routes only accept Bearer tokens
3. **Automatic Cache-Control**: All API responses automatically get `Cache-Control: no-store`
4. **Wrapper functions**: Easy-to-use wrappers for protecting routes

## Principal Types

### AdminPrincipal
```typescript
{
  type: 'admin'
  email: string
  sub: string
}
```

### AgentPrincipal
```typescript
{
  type: 'agent'
  hostId: string
}
```

## Usage

### Protecting Admin Routes

```typescript
import { withAdminAuth, Principal } from '@/lib/auth/wrappers'

export const POST = withAdminAuth(async (request: NextRequest, principal: Principal) => {
  // principal is guaranteed to be AdminPrincipal
  const { email, sub } = principal
  
  // Your route logic here
  return NextResponse.json({ success: true })
})
```

### Protecting Agent Routes

```typescript
import { withAgentAuth, Principal } from '@/lib/auth/wrappers'

export const POST = withAgentAuth(async (request: NextRequest, principal: Principal) => {
  // principal is guaranteed to be AgentPrincipal
  const { hostId } = principal
  
  // Your route logic here
  return NextResponse.json({ success: true })
})
```

### Public Routes with No-Cache

```typescript
import { withNoCache } from '@/lib/auth/wrappers'

export const GET = withNoCache(async (request: NextRequest) => {
  // Your route logic here
  return NextResponse.json({ data: 'public' })
})
```

## Security Features

### Role Separation
- **Admin routes**: Cannot accept Bearer tokens, only session cookies or API keys
- **Agent routes**: Cannot accept session cookies, only Bearer tokens
- **Mixed auth**: Automatically rejected with 403 Forbidden

### Automatic Headers
- All API responses get `Cache-Control: no-store`
- Proper error responses with appropriate HTTP status codes
- Consistent error message format

## Migration from Old System

The old authentication functions are still available for backward compatibility:

```typescript
// Old way (deprecated)
import { requireAdminAuth, requireAgentAuth } from '@/lib/auth'

// New way (recommended)
import { withAdminAuth, withAgentAuth } from '@/lib/auth/wrappers'
```

## Error Handling

The system automatically handles authentication errors:

- **401 Unauthorized**: Invalid or missing credentials
- **403 Forbidden**: Valid credentials but wrong route type (e.g., agent token on admin route)
- **500 Internal Server Error**: Unexpected errors during authentication

## Examples

See the following files for complete examples:
- `src/app/api/cards/route.ts` - Mixed public/admin routes
- `src/app/api/hosts/route.ts` - Admin-only routes
- `src/app/api/agents/heartbeat/route.ts` - Agent-only routes
- `src/app/api/status/route.ts` - Public route with no-cache

## Token Management

### Secure Token Generation
The system now uses cryptographically secure token generation with hashing:

- **Token Generation**: Uses `crypto.randomBytes(32)` for 256-bit entropy
- **Token Hashing**: SHA-256 hashing for secure storage
- **Token Prefix**: First 8 characters for identification (never the full token)
- **One-time Reveal**: Plaintext tokens are only returned once during rotation

### Token Rotation
- **POST** `/api/hosts/:id/token` - Generate new token (admin only)
- **GET** `/api/hosts/:id` - Returns only token prefix + rotation date
- **Security**: Plaintext tokens are never stored or returned after initial generation

### Migration Notes
- Old `agentToken` field has been replaced with `agentTokenHash`, `agentTokenPrefix`, and `tokenRotatedAt`
- Existing tokens should be rotated after migration for security
- Use the new `generateAgentToken()` from `@/lib/auth/token-utils` for new implementations
