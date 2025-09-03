# Public API Documentation

This document describes the public API endpoints available for Grafana and other read-only integrations.

## Authentication

All public endpoints require authentication using one of these methods:

1. **Query Parameter**: `?token=YOUR_PUBLIC_TOKEN`
2. **Authorization Header**: `Authorization: Bearer YOUR_PUBLIC_TOKEN`

The token is configured via the `READONLY_PUBLIC_TOKEN` environment variable.

## Security Features

- **No Cookies**: Public endpoints reject requests with cookies for security
- **Token Validation**: All requests must include a valid public token
- **Read-Only**: No admin or control operations are available
- **Safe Data**: Sensitive information (like raw URLs) is excluded from responses

## Caching

All public endpoints use optimized caching for performance:

- **Cache-Control**: `public, max-age=5, stale-while-revalidate=30`
- **Purpose**: 5-second cache with 30-second stale-while-revalidate for external integrations
- **Benefits**: Reduced server load while maintaining near real-time data

## Endpoints

### GET /api/public/cards

Returns a list of all enabled cards with safe information only.

**Response:**

```json
[
  {
    "id": "card_id",
    "title": "Service Name",
    "description": "Service description",
    "group": "General",
    "status": {
      "isUp": true,
      "lastChecked": "2024-01-01T12:00:00.000Z",
      "latencyMs": 150,
      "message": "OK"
    }
  }
]
```

**Note:** The `url` field is excluded for security reasons.

### GET /api/public/status/summary

Returns an overall status summary for all enabled cards.

**Response:**

```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "overall": {
    "totalCards": 5,
    "upCards": 4,
    "downCards": 1,
    "uptime24h": 95.5,
    "uptime7d": 92.3
  },
  "cards": [
    {
      "id": "card_id",
      "title": "Service Name",
      "group": "General",
      "currentStatus": {
        "isUp": true,
        "lastChecked": "2024-01-01T12:00:00.000Z",
        "latencyMs": 150,
        "message": "OK"
      },
      "uptime": {
        "24h": 95.5,
        "7d": 92.3
      },
      "metrics": {
        "totalChecks24h": 1440,
        "totalChecks7d": 10080,
        "avgLatency24h": 145
      }
    }
  ]
}
```

### GET /api/public/status/history?cardId=...&range=24h|7d

Returns status history for a specific card.

**Parameters:**

- `cardId` (required): The ID of the card
- `range` (required): Either `24h` or `7d`

**Response:**

```json
{
  "cardId": "card_id",
  "range": "24h",
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-01-01T12:00:00.000Z",
  "totalEvents": 1440,
  "uptimePercentage": 95.5,
  "avgLatency": 145,
  "events": [
    {
      "timestamp": "2024-01-01T00:00:00.000Z",
      "isUp": true,
      "http": 200,
      "latencyMs": 150,
      "message": "OK"
    }
  ]
}
```

**Note:** Events are downsampled to a maximum of 500 points for efficient charting.

## Usage Examples

### cURL Examples

```bash
# Get all cards
curl "http://localhost:3000/api/public/cards?token=YOUR_TOKEN"

# Get status summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:3000/api/public/status/summary"

# Get 24h history for a specific card
curl "http://localhost:3000/api/public/status/history?token=YOUR_TOKEN&cardId=CARD_ID&range=24h"
```

### Grafana Integration

For Grafana, you can use the query parameter method:

```
http://localhost:3000/api/public/status/summary?token=YOUR_TOKEN
```

### JavaScript/Fetch Example

```javascript
const token = 'YOUR_PUBLIC_TOKEN';
const baseUrl = 'http://localhost:3000';

// Get cards
const cards = await fetch(`${baseUrl}/api/public/cards?token=${token}`).then(
  (res) => res.json()
);

// Get summary with Authorization header
const summary = await fetch(`${baseUrl}/api/public/status/summary`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
}).then((res) => res.json());
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200`: Success
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (invalid or missing token)
- `404`: Not Found (card not found)
- `500`: Internal Server Error

Error responses include a JSON body with an `error` field:

```json
{
  "error": "Invalid or missing public token"
}
```

## Rate Limiting

Public endpoints are subject to the same rate limiting as other API endpoints. If you exceed the rate limit, you'll receive a `429` status code with a `Retry-After` header.

## Testing

Use the provided test script to verify the endpoints work correctly:

```bash
./scripts/test-public-api.sh [base_url] [token]
```

Example:

```bash
./scripts/test-public-api.sh http://localhost:3000 your-token-here
```
