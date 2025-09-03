# Appearance API

The Appearance API provides centralized configuration for the Lab Portal's visual identity and branding. It allows administrators to customize the portal's appearance while providing public access for external integrations.

## Overview

The Appearance system consists of:

- **Admin Endpoint**: Full CRUD operations for appearance configuration
- **Public Endpoint**: Read-only access for external integrations
- **Environment Fallbacks**: Automatic fallback to environment variables
- **Caching**: 30-second in-memory cache with 5-second public API cache

## Database Schema

```sql
model Appearance {
  id           Int      @id @default(1)
  instanceName String   @default("Lab Portal")
  headerText   String?  // short banner text shown in header center
  showClock    Boolean  @default(false) // optional: for future; leave but unused
  theme        String   @default("system") // future: "system" | "light" | "dark"
  updatedAt    DateTime @updatedAt
}
```

## Fields

### instanceName

- **Type**: `string`
- **Required**: Yes
- **Length**: 1-60 characters
- **Default**: "Lab Portal"
- **Description**: The name of the portal instance, displayed in titles and branding
- **Example**: "Home Lab Portal", "Production Lab", "Dev Environment"

### headerText

- **Type**: `string | null`
- **Required**: No
- **Length**: 0-140 characters
- **Default**: `null`
- **Description**: Short banner text displayed in the header center
- **Example**: "Welcome to the Lab", "Maintenance Mode", "Production Environment"

### theme

- **Type**: `"system" | "light" | "dark"`
- **Required**: No
- **Default**: "system"
- **Description**: Theme preference (currently placeholder for future implementation)
- **Note**: This field is stored but not yet implemented in the UI

### showClock

- **Type**: `boolean`
- **Required**: No
- **Default**: `false`
- **Description**: Optional flag for future clock display feature
- **Note**: This field is stored but not yet implemented in the UI

### updatedAt

- **Type**: `DateTime`
- **Auto-generated**: Yes
- **Description**: Timestamp of last modification

## Admin Endpoints

### GET /api/admin/appearance

Retrieves the current appearance configuration for administrators.

**Authentication**: Admin session required
**Cache Control**: `no-store, no-cache, must-revalidate, proxy-revalidate`

**Response**:

```json
{
  "success": true,
  "data": {
    "instanceName": "Home Lab Portal",
    "headerText": "Welcome to the Lab",
    "theme": "system"
  }
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized (no admin session)
- `500`: Internal server error

### PUT /api/admin/appearance

Updates the appearance configuration.

**Authentication**: Admin session required
**CSRF Protection**: Origin validation required
**Cache Control**: `no-store, no-cache, must-revalidate, proxy-revalidate`

**Request Body**:

```json
{
  "instanceName": "Updated Portal Name",
  "headerText": "New header text",
  "theme": "dark"
}
```

**Validation Rules**:

- `instanceName`: Required string, 1-60 characters, trimmed
- `headerText`: Optional string, max 140 characters, trimmed, nullable
- `theme`: Optional enum, one of: "system", "light", "dark"

**Response**:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "instanceName": "Updated Portal Name",
    "headerText": "New header text",
    "theme": "dark",
    "showClock": false,
    "updatedAt": "2025-09-03T19:00:00.000Z"
  }
}
```

**Status Codes**:

- `200`: Success
- `400`: Validation error
- `401`: Unauthorized (no admin session)
- `403`: Forbidden (invalid origin)
- `500`: Internal server error

## Public Endpoints

### GET /api/public/appearance

Provides read-only access to appearance configuration for external integrations.

**Authentication**: Bearer token required (`Authorization: Bearer <token>`)
**Cache Control**: `public, max-age=5, stale-while-revalidate=30`
**Rate Limiting**: Standard API rate limits apply

**Headers**:

```
Authorization: Bearer <your-public-token>
```

**Response**:

```json
{
  "success": true,
  "data": {
    "instanceName": "Home Lab Portal",
    "headerText": "Welcome to the Lab",
    "theme": "system"
  }
}
```

**Status Codes**:

- `200`: Success
- `401`: Unauthorized (invalid or missing token)
- `500`: Internal server error

**Note**: The public endpoint only returns the essential appearance fields (`instanceName`, `headerText`, `theme`) and does not expose internal fields like `showClock` or `updatedAt`.

## Environment Variable Fallbacks

The Appearance system automatically falls back to environment variables when the database is unavailable or empty:

### Environment Variables

```bash
# Instance branding
APPEARANCE_INSTANCE_NAME="Lab Portal"
APPEARANCE_HEADER_TEXT="Welcome to the Lab Portal"

# Default values if not set
APPEARANCE_INSTANCE_NAME defaults to "Lab Portal"
APPEARANCE_HEADER_TEXT defaults to null
```

### Fallback Behavior

1. **Primary**: Database configuration (if available)
2. **Fallback**: Environment variables
3. **Cache**: 30-second in-memory cache for performance
4. **Auto-recovery**: Automatically switches back to database when available

## Caching Strategy

### Admin API

- **Cache Control**: `no-store, no-cache, must-revalidate, proxy-revalidate`
- **Purpose**: Ensure administrators always see the latest configuration
- **Implementation**: No caching, always fresh data

### Public API

- **Cache Control**: `public, max-age=5, stale-while-revalidate=30`
- **Purpose**: Optimize performance for external integrations
- **Implementation**: 5-second cache with 30-second stale-while-revalidate

### Internal Cache

- **Duration**: 30 seconds
- **Purpose**: Reduce database queries for repeated requests
- **Invalidation**: Automatic on updates, manual via `getAppearance(true)`

## Usage Examples

### Update Portal Branding

```bash
curl -X PUT http://localhost:3000/api/admin/appearance \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "instanceName": "Production Lab Portal",
    "headerText": "Production Environment - Use with Care",
    "theme": "dark"
  }'
```

### Retrieve Public Appearance

```bash
curl -H "Authorization: Bearer your-public-token" \
  http://localhost:3000/api/public/appearance
```

### JavaScript Integration

```javascript
// Fetch appearance for external dashboard
const response = await fetch('/api/public/appearance', {
  headers: {
    Authorization: 'Bearer your-public-token',
  },
});

const appearance = await response.json();
console.log(`Portal: ${appearance.data.instanceName}`);
console.log(`Header: ${appearance.data.headerText}`);
```

## Error Handling

### Validation Errors

```json
{
  "error": "Validation failed",
  "details": "instanceName: String must contain at least 1 character(s)"
}
```

### Authentication Errors

```json
{
  "error": "Unauthorized"
}
```

### Origin Validation Errors

```json
{
  "error": "Invalid origin",
  "details": "Request origin not in allowed list"
}
```

## Security Features

- **Admin Authentication**: Session-based authentication required for modifications
- **CSRF Protection**: Origin validation for state-changing operations
- **Input Validation**: Zod schema validation with length limits
- **Rate Limiting**: Standard API rate limiting applies
- **Token Authentication**: Bearer token required for public access

## Performance Considerations

- **Database Queries**: Minimized through 30-second caching
- **Public API**: 5-second cache for external integrations
- **Memory Usage**: Lightweight in-memory cache
- **Auto-invalidation**: Cache automatically refreshed on updates

## Future Enhancements

- **Theme Implementation**: Full theme switching (light/dark/system)
- **Clock Display**: Optional clock widget in header
- **Custom CSS**: User-defined CSS for advanced customization
- **Branding Assets**: Logo and favicon management
- **Multi-tenant**: Support for multiple portal instances

## Integration Notes

- **Grafana Dashboards**: Use public endpoint for portal branding
- **Monitoring Tools**: Include appearance data in status endpoints
- **External Portals**: Embed appearance data in iframe integrations
- **API Clients**: Cache appearance data locally with 5-second TTL

## Troubleshooting

### Common Issues

1. **Cache Stale**: Force refresh with `getAppearance(true)`
2. **Validation Errors**: Check field length limits and required fields
3. **Authentication**: Ensure valid admin session or public token
4. **Origin Issues**: Verify request origin is in allowed list

### Debug Endpoints

- **Admin**: `/api/admin/appearance` for full configuration
- **Public**: `/api/public/appearance` for external access
- **Database**: Check `Appearance` table directly if needed

## Related Documentation

- [API Headers](../dev/api-headers.md) - Cache control and security headers
- [Admin Authentication](../auth/README.md) - Admin route protection
- [CSRF Protection](../auth/CSRF_PROTECTION.md) - Origin validation
- [Environment Configuration](../dev/fresh-clone-checklist.md) - Setup and configuration
