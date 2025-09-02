# Status Indicator Testing Guide

This guide explains how to test the status indicator system in the Lab Portal.

## Overview

The Lab Portal now includes real-time status indicators for each lab tool card that show whether the service is currently accessible:

- 🟢 **Green dot + "Up"**: Service is running and accessible
- 🔴 **Red dot + "Down"**: Service is not accessible
- 🟡 **Yellow dot + "Loading"**: Status is being checked
- ⚫ **Gray dot + "Unknown"**: Status hasn't been determined yet

## Current Test Setup

The system includes a **Stable Diffusion** card with URL `http://localhost:7860` that can be used for testing the status indicators.

## Testing the Status Indicators

### 1. Start the Mock Service

To see a service go from "Down" to "Up":

```bash
node test-status-demo.js
```

This will start a mock Stable Diffusion service on localhost:7860.

### 2. Observe Status Changes

1. **Before starting the service**: The Stable Diffusion card should show:
   - 🔴 Red dot
   - "Down" status
   - Connection refused error message

2. **After starting the service**: The card should automatically update to show:
   - 🟢 Green dot  
   - "Up" status
   - Low latency (usually < 10ms)

3. **Stop the service** (Ctrl+C): The card should return to "Down" status

### 3. Status Update Frequency

- Status checks happen every **10 seconds**
- Initial status check happens immediately when the page loads
- Status is cached for 10 seconds to avoid excessive API calls

## API Endpoints

### Status Check
```
GET /api/status?cardId={cardId}
```

Returns:
```json
{
  "isUp": boolean,
  "lastChecked": "ISO timestamp",
  "lastHttp": number | null,
  "latencyMs": number
}
```

### Test Environment
```
GET /api/test-env?url={url}
```

Tests connectivity to any URL (defaults to localhost:7860).

## Technical Details

### Status Checking Logic

1. **URL Validation**: Automatically handles relative paths, missing protocols, and localhost URLs
2. **Connection Testing**: Uses HTTP/HTTPS requests with configurable timeouts
3. **Error Handling**: Provides specific error messages for common connection issues
4. **Caching**: Reduces API load with intelligent caching of recent status results

### Error States

- **ECONNREFUSED**: Service not running
- **ENOTFOUND**: Host not found (DNS/network issues)
- **ETIMEDOUT**: Connection timeout (service overloaded)

### Localhost Optimization

- Localhost URLs use shorter timeouts (3 seconds vs 8 seconds)
- Special error handling for common localhost connection issues

## Troubleshooting

### Status Stuck on "Unknown"

1. Check browser console for JavaScript errors
2. Verify the status API endpoint is accessible
3. Check if the card ID exists in the database

### Status Not Updating

1. Verify the polling interval (10 seconds)
2. Check network connectivity to the target service
3. Review server logs for API errors

### Icons Not Loading

1. Ensure `/public/icons/` directory exists
2. Verify SVG files are properly formatted
3. Check browser network tab for 404 errors

## Future Enhancements

- WebSocket-based real-time updates
- Service health metrics and history
- Automatic service discovery
- Alert notifications for service outages
