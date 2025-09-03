# API Headers & Cache Behavior

This document describes the standardized headers and cache behavior for all Lab Portal API endpoints.

## Standardized Response Headers

All API responses include standardized headers for consistent behavior and security:

- **Content-Type**: `application/json; charset=utf-8`
- **Cache-Control**: Varies by route type (see below)

## Cache Control by Route Type

### Public Routes

**Cache-Control**: `public, max-age=5, stale-while-revalidate=30`

- **Purpose**: Allow caching for 5 seconds with 30 seconds of stale-while-revalidate
- **Use Case**: Status information, appearance settings, public card data
- **Routes**: `/api/public/*`

### Admin Routes

**Cache-Control**: `no-store, no-cache, must-revalidate, proxy-revalidate`

- **Purpose**: Prevent any caching of sensitive admin data
- **Use Case**: Admin configuration, user management, sensitive operations
- **Routes**: `/api/admin/*`

### Agent/Control Routes

**Cache-Control**: `no-store, no-cache, must-revalidate, proxy-revalidate`

- **Purpose**: Prevent caching of control actions and agent communications
- **Use Case**: Action queue, service control, agent status
- **Routes**: `/api/control/*`, `/api/agents/*`

## Testing with curl

Use these curl commands to verify the headers are set correctly:

### Public Routes (Should Cache)

#### Status Summary

```bash
curl -i "http://localhost:3000/api/public/status/summary?token=your-token"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=5, stale-while-revalidate=30
```

#### Status History

```bash
curl -i "http://localhost:3000/api/public/status/history?cardId=card-id&range=24h&token=your-token"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=5, stale-while-revalidate=30
```

#### Public Cards

```bash
curl -i "http://localhost:3000/api/public/cards?token=your-token"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=5, stale-while-revalidate=30
```

#### Public Appearance

```bash
curl -i -H "Authorization: Bearer your-token" "http://localhost:3000/api/public/appearance"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: public, max-age=5, stale-while-revalidate=30
```

### Admin Routes (No Cache)

#### Admin Appearance

```bash
curl -i -H "Cookie: your-session-cookie" "http://localhost:3000/api/admin/appearance"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

### Agent/Control Routes (No Cache)

#### Control Queue

```bash
curl -i -H "Authorization: Bearer agent-token" "http://localhost:3000/api/control/queue"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

#### Control Actions

```bash
curl -i -H "Cookie: your-session-cookie" "http://localhost:3000/api/control/actions"
```

**Expected Headers:**

```
Content-Type: application/json; charset=utf-8
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
```

## Implementation Details

The standardized headers are implemented using the `ResponseHelper` class in `src/lib/response-helper.ts`:

```typescript
import { ResponseHelper } from '@/lib/response-helper';

// For public routes
return ResponseHelper.success(data, 'public');

// For admin routes
return ResponseHelper.success(data, 'admin');

// For agent routes
return ResponseHelper.success(data, 'agent');

// For errors
return ResponseHelper.error('Error message', 'public', 400);
```

## Benefits

1. **Consistent Behavior**: All API endpoints follow the same header patterns
2. **Security**: Admin and control routes are never cached
3. **Performance**: Public routes benefit from short-term caching
4. **Maintainability**: Centralized header management
5. **Compliance**: Proper cache control for different data sensitivity levels

## Troubleshooting

If headers are not set correctly:

1. **Check Route Type**: Ensure the correct route type is passed to ResponseHelper
2. **Verify Import**: Confirm ResponseHelper is imported and used
3. **Test with curl**: Use the examples above to verify headers
4. **Check Middleware**: Ensure no middleware is overriding the headers

## Migration Notes

Routes that previously used `NextResponse.json()` directly should be updated to use `ResponseHelper`:

```typescript
// Before
return NextResponse.json(data, { status: 200 });

// After
return ResponseHelper.success(data, 'admin', 200);
```

This ensures consistent headers and cache behavior across all endpoints.
