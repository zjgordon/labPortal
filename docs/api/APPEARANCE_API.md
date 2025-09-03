# Appearance API

The Appearance API provides endpoints for managing and retrieving portal appearance settings. This includes instance branding, header text, and theme preferences.

## Endpoints

### Admin Endpoints

#### PUT /api/admin/appearance

Updates the portal appearance configuration. Requires admin authentication and origin validation.

**Authentication**: Admin session required
**Origin Validation**: Restricted to allowed admin origins
**Method**: PUT

**Request Body**:
```json
{
  "instanceName": "My Lab Portal",
  "headerText": "Welcome to the Home Lab",
  "theme": "system"
}
```

**Validation Rules**:
- `instanceName`: Required string, 1-60 characters, trimmed
- `headerText`: Optional string, max 140 characters, trimmed, nullable
- `theme`: Optional enum, values: "system", "light", "dark"

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "instanceName": "My Lab Portal",
    "headerText": "Welcome to the Home Lab",
    "theme": "system",
    "showClock": false,
    "updatedAt": "2025-09-03T06:00:00.000Z"
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Validation error
- `401`: Unauthorized (no session)
- `403`: Forbidden (invalid origin)
- `500`: Internal server error

**Features**:
- Automatically invalidates in-memory cache
- Uses upsert operation (creates if doesn't exist, updates if it does)
- Maintains audit trail with `updatedAt` timestamp

### Public Endpoints

#### GET /api/public/appearance

Retrieves public appearance settings. Requires valid public token authentication.

**Authentication**: `READONLY_PUBLIC_TOKEN` in Authorization header
**Method**: GET
**Cache**: Public, max-age=5, stale-while-revalidate=30

**Headers**:
```
Authorization: Bearer your-public-token-here
```

**Response**:
```json
{
  "success": true,
  "data": {
    "instanceName": "My Lab Portal",
    "headerText": "Welcome to the Home Lab",
    "theme": "system"
  }
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized (invalid or missing token)
- `500`: Internal server error

**Cache Behavior**:
- **max-age=5**: Fresh for 5 seconds
- **stale-while-revalidate=30**: Can serve stale content for up to 30 seconds while revalidating in background

## Usage Examples

### Update Appearance (Admin)

```bash
curl -X PUT http://localhost:3000/api/admin/appearance \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "instanceName": "Production Lab",
    "headerText": "Welcome to Production Environment",
    "theme": "dark"
  }'
```

### Get Public Appearance

```bash
curl http://localhost:3000/api/public/appearance \
  -H "Authorization: Bearer your-public-token"
```

### JavaScript/TypeScript

```typescript
// Admin update
const updateAppearance = async (data: AppearanceUpdate) => {
  const response = await fetch('/api/admin/appearance', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  return response.json()
}

// Public fetch
const getPublicAppearance = async (token: string) => {
  const response = await fetch('/api/public/appearance', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return response.json()
}
```

## Configuration

### Environment Variables

```bash
# Required for public endpoint
READONLY_PUBLIC_TOKEN="your-public-readonly-token-here"

# Optional fallbacks for appearance
APPEARANCE_INSTANCE_NAME="Lab Portal"
APPEARANCE_HEADER_TEXT="Welcome to the Lab"
```

### Database Schema

The appearance configuration is stored in the `Appearance` table:

```sql
CREATE TABLE "Appearance" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "instanceName" TEXT NOT NULL DEFAULT 'Lab Portal',
    "headerText" TEXT,
    "showClock" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "updatedAt" DATETIME NOT NULL
);
```

## Security Considerations

### Admin Endpoints
- **Session Authentication**: Requires valid admin session
- **Origin Validation**: Restricted to configured admin origins
- **Input Validation**: Strict Zod schema validation
- **CSRF Protection**: Origin validation prevents cross-site requests

### Public Endpoints
- **Token Authentication**: Bearer token in Authorization header
- **No Cookies**: Stateless authentication for external systems
- **Limited Data**: Only returns public appearance fields
- **Rate Limiting**: Subject to global rate limiting policies

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error description",
  "details": "Additional error details (if available)"
}
```

Common error scenarios:
- **Validation Errors**: Invalid input data format or constraints
- **Authentication Errors**: Missing or invalid credentials
- **Authorization Errors**: Insufficient permissions or invalid origin
- **Server Errors**: Internal processing failures

## Integration Notes

### Cache Invalidation
The admin update endpoint automatically invalidates the in-memory cache, ensuring immediate consistency across all consumers.

### Fallback Strategy
If the database is unavailable, the system falls back to environment variables, ensuring graceful degradation.

### Future Extensibility
The API is designed to support future features like:
- Theme switching (light/dark/system)
- Clock display preferences
- Additional branding options
- Multi-tenant configurations
