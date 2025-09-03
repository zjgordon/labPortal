# Lab Portal Smoke Tests - Manual Commands

This document provides exact curl commands and expected responses for manual smoke testing of critical flows.

## 🚀 Quick Start

Run the automated smoke test:

```bash
./scripts/smoke.sh
```

Or use the manual commands below for step-by-step testing.

## 📋 Test Commands

### 1. Public Appearance Endpoint

**Command:**

```bash
curl -i "http://localhost:3000/api/public/appearance"
```

**Expected Response:**

- **Status**: `200 OK`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON with portal appearance settings

**Example Response:**

```json
{
  "instanceName": "Lab Portal",
  "headerMessage": "Welcome to the Lab",
  "theme": "cyberpunk"
}
```

**Failure Cases:**

- `500 Internal Server Error` - Portal not running or database error
- `404 Not Found` - Endpoint not implemented

---

### 2. Public Status Summary Endpoint

**Command:**

```bash
curl -i "http://localhost:3000/api/public/status/summary"
```

**Expected Response:**

- **Status**: `200 OK`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON with system status summary

**Example Response:**

```json
{
  "totalCards": 5,
  "onlineCards": 3,
  "offlineCards": 2,
  "uptime": "2d 5h 30m",
  "lastUpdate": "2024-01-15T10:30:00Z"
}
```

**Failure Cases:**

- `500 Internal Server Error` - Portal not running or database error
- `404 Not Found` - Endpoint not implemented

---

### 3. Queue Endpoint (Empty Queue)

**Command:**

```bash
curl -i "http://localhost:3000/api/control/queue?wait=1"
```

**Expected Response:**

- **Status**: `204 No Content` (when queue is empty)
- **Headers**: Minimal headers, no body

**Alternative Expected Responses:**

- `401 Unauthorized` - Authentication required (normal for empty queue)
- `403 Forbidden` - Access denied (normal for empty queue)

**Failure Cases:**

- `500 Internal Server Error` - Portal not running or system error
- `404 Not Found` - Endpoint not implemented

---

### 4. Admin Card Management Tests

**Note**: These tests require admin authentication. If automated tests fail, follow the manual steps below.

#### 4.1 Create Test Card

**Command:**

```bash
curl -X POST "http://localhost:3000/api/cards" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Smoke Test Card",
    "description": "Temporary card for smoke testing",
    "url": "http://localhost:8080",
    "enabled": true,
    "group": "test"
  }'
```

**Expected Response:**

- **Status**: `201 Created`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON with created card including ID

**Example Response:**

```json
{
  "id": "card-uuid-here",
  "name": "Smoke Test Card",
  "description": "Temporary card for smoke testing",
  "url": "http://localhost:8080",
  "enabled": true,
  "group": "test",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Failure Cases:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not admin user
- `400 Bad Request` - Invalid card data
- `409 Conflict` - Card with same name exists

#### 4.2 Edit Test Card

**Command:**

```bash
curl -X PUT "http://localhost:3000/api/cards/CARD_ID" \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Smoke Test Card - Edited",
    "description": "Updated description for smoke testing",
    "url": "http://localhost:8080",
    "enabled": true,
    "group": "test"
  }'
```

**Expected Response:**

- **Status**: `200 OK`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON with updated card

**Failure Cases:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not admin user
- `404 Not Found` - Card doesn't exist
- `400 Bad Request` - Invalid card data

#### 4.3 Upload Icon

**Command:**

```bash
# First create a tiny test icon
echo '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="6" fill="red"/></svg>' > test-icon.svg

# Then upload it
curl -X POST "http://localhost:3000/api/cards/CARD_ID/icon" \
  -H "Cookie: your-session-cookie" \
  -F "icon=@test-icon.svg"
```

**Expected Response:**

- **Status**: `200 OK`
- **Headers**: `Content-Type: application/json`
- **Body**: JSON with icon URL

**Example Response:**

```json
{
  "success": true,
  "iconUrl": "/uploads/icons/card-uuid-here.svg",
  "message": "Icon uploaded successfully"
}
```

**Failure Cases:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not admin user
- `404 Not Found` - Card doesn't exist
- `400 Bad Request` - Invalid file format
- `413 Payload Too Large` - File too large

#### 4.4 Delete Test Card

**Command:**

```bash
curl -X DELETE "http://localhost:3000/api/cards/CARD_ID" \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**

- **Status**: `200 OK` or `204 No Content`
- **Headers**: Minimal headers
- **Body**: No body or success message

**Example Response:**

```json
{
  "success": true,
  "message": "Card deleted successfully"
}
```

**Failure Cases:**

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not admin user
- `404 Not Found` - Card doesn't exist

---

## 🔧 Manual Testing Steps

If automated admin tests fail due to authentication:

1. **Start the portal**: `npm run dev`
2. **Open admin panel**: `http://localhost:3000/admin`
3. **Login**: Use admin credentials from your environment
4. **Create test card**: Use the admin interface
5. **Edit card**: Modify name and description
6. **Upload icon**: Upload a small test file
7. **Delete card**: Remove the test card

## 📊 Test Results Template

Use this template to record your test results:

```markdown
## Smoke Test Results - [Date]

### Public Endpoints

- [ ] Appearance endpoint: `200 OK` / `❌ Failed`
- [ ] Status summary endpoint: `200 OK` / `❌ Failed`

### Control System

- [ ] Queue endpoint: `204 No Content` / `❌ Failed`

### Admin Management

- [ ] Create card: `201 Created` / `❌ Failed`
- [ ] Edit card: `200 OK` / `❌ Failed`
- [ ] Upload icon: `200 OK` / `❌ Failed`
- [ ] Delete card: `200 OK` / `❌ Failed`

### Overall Result

- [ ] ✅ All tests passed
- [ ] ⚠️ Some tests failed (see details above)
- [ ] ❌ Critical failures detected

### Notes

[Add any relevant observations or issues]
```

## 🚨 Troubleshooting

### Common Issues

1. **Portal not running**
   - Start with: `npm run dev`
   - Check logs for errors

2. **Authentication failures**
   - Verify admin credentials in environment
   - Check if session cookies are valid

3. **Database errors**
   - Run: `npx prisma migrate deploy`
   - Check database connection

4. **File upload issues**
   - Verify upload directory permissions
   - Check file size limits

### Getting Help

- Check the [main smoke testing guide](SMOKE_TESTING.md)
- Review [API documentation](../api/)
- Check [project status](../../PROJECT_STATUS.md)
- Open an issue with test results
