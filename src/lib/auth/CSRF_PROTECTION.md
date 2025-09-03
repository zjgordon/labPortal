# CSRF Protection System

This document describes the CSRF (Cross-Site Request Forgery) protection system implemented for admin routes.

## Overview

The CSRF protection system prevents unauthorized cross-origin requests to state-changing admin endpoints by verifying the `Origin` header against a configurable allowlist.

## Configuration

### Environment Variables

```bash
# Comma-separated list of allowed origins for admin routes
ADMIN_ALLOWED_ORIGINS="http://localhost:3000,https://portal.local"
```

**Default value**: `"http://localhost:3000,https://portal.local"`

## How It Works

### Origin Verification

1. **GET requests**: Missing `Origin` header is allowed (read-only operations)
2. **State-changing methods** (POST/PUT/PATCH/DELETE): Valid `Origin` header is required
3. **Origin validation**: Exact match against the allowlist (no wildcards or partial matches)

### CORS Headers

- **Allowed origins**: Set `Access-Control-Allow-Origin` to the specific origin
- **Unknown origins**: Omit `Access-Control-Allow-Origin` to prevent cross-origin requests
- **Methods**: Support GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Headers**: Allow Content-Type, Authorization, X-API-Key
- **Credentials**: Support cookies and authentication headers

## Implementation

### Core Functions

```typescript
import { verifyOrigin, getAdminCorsHeaders, createCsrfErrorResponse } from '@/lib/auth/csrf-protection'

// Verify origin before processing state-changing requests
if (!verifyOrigin(request)) {
  return NextResponse.json(
    { error: 'CSRF protection: Invalid origin' },
    { status: 403 }
  )
}

// Get appropriate CORS headers
const corsHeaders = getAdminCorsHeaders(request)
```

### Route Protection

All admin routes with state-changing methods now include CSRF protection:

- `POST /api/hosts` - Create host
- `PUT /api/hosts/:id` - Update host  
- `DELETE /api/hosts/:id` - Delete host
- `POST /api/hosts/:id/token` - Rotate agent token
- `POST /api/cards` - Create card
- And more...

### Middleware Integration

The middleware automatically adds CORS headers for admin routes:

```typescript
// Add CORS headers for admin routes
if (pathname.startsWith('/api/hosts') || 
    pathname.startsWith('/api/cards') || 
    pathname.startsWith('/api/services') ||
    pathname.startsWith('/api/control')) {
  const corsHeaders = getAdminCorsHeaders(req)
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
}
```

## Security Features

### Origin Validation

- **Exact matching**: No wildcard or partial origin matching
- **Configurable allowlist**: Environment-based origin configuration
- **Method-specific**: Different rules for read vs. write operations

### CORS Strategy

- **Same-origin support**: Full CORS headers for allowed origins
- **Cross-origin prevention**: Omit headers for unknown origins
- **No wildcards**: Never use `Access-Control-Allow-Origin: *`

### Logging

- **Warning logs**: Record CSRF protection failures
- **Request details**: Include method, URL, origin, and user agent
- **Audit trail**: Track all origin validation attempts

## Usage Examples

### Protecting a POST Route

```typescript
export async function POST(request: NextRequest) {
  try {
    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return NextResponse.json(
        { error: 'CSRF protection: Invalid origin' },
        { status: 403 }
      )
    }
    
    // Process the request...
    const body = await request.json()
    // ... rest of the logic
  } catch (error) {
    // Error handling
  }
}
```

### Adding CORS Headers

```typescript
const response = NextResponse.json(data)
const corsHeaders = getAdminCorsHeaders(request)
Object.entries(corsHeaders).forEach(([key, value]) => {
  response.headers.set(key, value)
})
return response
```

## Testing

### Valid Requests

```bash
# Same-origin request (should work)
curl -X POST http://localhost:3000/api/hosts \
  -H "Origin: http://localhost:3000" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-host"}'

# Allowed origin request (should work)
curl -X POST https://portal.local/api/hosts \
  -H "Origin: https://portal.local" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-host"}'
```

### Invalid Requests

```bash
# Missing Origin header for POST (should fail)
curl -X POST http://localhost:3000/api/hosts \
  -H "Content-Type: application/json" \
  -d '{"name":"test-host"}'

# Unauthorized origin (should fail)
curl -X POST http://localhost:3000/api/hosts \
  -H "Origin: https://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"name":"test-host"}'
```

## Troubleshooting

### Common Issues

1. **403 CSRF errors**: Check if the origin is in `ADMIN_ALLOWED_ORIGINS`
2. **Missing CORS headers**: Verify the route is covered by middleware
3. **Origin validation failures**: Check environment variable format

### Debug Mode

Enable detailed logging by checking the console for CSRF protection warnings:

```
CSRF Protection: Missing Origin header for state-changing method
CSRF Protection: Origin not in allowlist
```

## Best Practices

1. **Always verify origin** for state-changing methods
2. **Use exact origin matching** (no wildcards)
3. **Log CSRF failures** for security monitoring
4. **Test with different origins** to verify protection
5. **Keep allowlist minimal** - only include necessary origins
