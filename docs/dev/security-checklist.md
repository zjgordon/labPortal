# Security Checklist

This document provides a security checklist for the Lab Portal, including manual testing procedures and security validations.

## Token Security Testing

### Agent Token Rotation Security

**Objective**: Verify that token rotation is POST-only and tokens are never exposed via GET endpoints.

#### Manual Testing Checklist

1. **Token Rotation Endpoint Security**
   - [ ] `POST /api/hosts/:id/token` returns plaintext token only once
   - [ ] `GET /api/hosts/:id/token` returns 405 Method Not Allowed
   - [ ] `PUT /api/hosts/:id/token` returns 405 Method Not Allowed
   - [ ] `DELETE /api/hosts/:id/token` returns 405 Method Not Allowed

2. **GET Endpoint Token Protection**
   - [ ] `GET /api/hosts/:id` returns only token prefix + rotation date
   - [ ] `GET /api/hosts/:id` never returns plaintext token
   - [ ] `GET /api/hosts` returns only token prefixes, never full tokens

3. **Database Security**
   - [ ] Only `agentTokenHash` and `agentTokenPrefix` stored in database
   - [ ] Plaintext tokens never persisted
   - [ ] Token rotation timestamps are tracked

#### Test Commands

```bash
# Test token rotation (should work)
curl -X POST http://localhost:3000/api/hosts/host-id/token \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"

# Test GET on token endpoint (should fail - only POST is allowed)
curl -X GET http://localhost:3000/api/hosts/host-id/token \
  -H "Cookie: your-session-cookie"

# Test GET on host endpoint (should return only prefix)
curl -X GET http://localhost:3000/api/hosts/host-id \
  -H "Cookie: your-session-cookie"

# Verify response contains only:
# - agentTokenPrefix (not full token)
# - tokenRotatedAt timestamp
# - NO plaintext token field
```

#### Expected Results

**Token Rotation (POST):**

```json
{
  "message": "Agent token rotated successfully",
  "token": "new-plaintext-token-here", // Only returned once
  "host": {
    "id": "host-id",
    "name": "host-name",
    "tokenPrefix": "prefix_",
    "tokenRotatedAt": "2025-09-03T..."
  }
}
```

**Host GET Response:**

```json
{
  "success": true,
  "data": {
    "id": "host-id",
    "name": "host-name",
    "agentTokenPrefix": "prefix_", // Only prefix, never full token
    "tokenRotatedAt": "2025-09-03T..."
    // ... other fields
  }
}
```

## Authentication Security

### Admin Route Protection

- [ ] Admin routes require valid session cookies
- [ ] Admin routes reject Bearer tokens
- [ ] CSRF protection enabled for state-changing operations
- [ ] Origin validation for admin endpoints

### Agent Route Protection

- [ ] Agent routes require valid Bearer tokens
- [ ] Agent routes reject session cookies
- [ ] Token validation against stored hashes
- [ ] Rate limiting on agent endpoints

### Public Route Security

- [ ] Public routes require valid public token
- [ ] No sensitive data exposed
- [ ] Appropriate caching headers set
- [ ] Rate limiting enabled

## Data Security

### Database Security

- [ ] Sensitive fields hashed (passwords, tokens)
- [ ] No plaintext secrets stored
- [ ] Audit trails for sensitive operations
- [ ] Database access properly restricted

### API Security

- [ ] Input validation on all endpoints
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CORS properly configured

## Monitoring & Logging

### Security Events

- [ ] Failed authentication attempts logged
- [ ] Token rotation events logged
- [ ] Admin actions audited
- [ ] Error responses don't leak sensitive info

### Rate Limiting

- [ ] API rate limiting enabled
- [ ] Brute force protection
- [ ] Appropriate limits for different endpoints
- [ ] Rate limit headers returned

## Regular Security Reviews

### Weekly Checks

- [ ] Review failed authentication logs
- [ ] Check for unusual access patterns
- [ ] Verify token rotation compliance
- [ ] Review admin action logs

### Monthly Reviews

- [ ] Audit user permissions
- [ ] Review API access patterns
- [ ] Check for unused tokens/accounts
- [ ] Update security documentation

## Incident Response

### Token Compromise

1. **Immediate Actions**
   - [ ] Rotate compromised token immediately
   - [ ] Investigate access logs
   - [ ] Check for unauthorized actions
   - [ ] Notify relevant stakeholders

2. **Recovery Steps**
   - [ ] Generate new secure token
   - [ ] Update agent configuration
   - [ ] Monitor for suspicious activity
   - [ ] Document incident and lessons learned

### Security Breach

1. **Containment**
   - [ ] Isolate affected systems
   - [ ] Preserve evidence
   - [ ] Assess scope of compromise

2. **Recovery**
   - [ ] Patch vulnerabilities
   - [ ] Restore from clean backups
   - [ ] Implement additional security measures
   - [ ] Conduct post-incident review

## Compliance Notes

- **Token Rotation**: Required for security compliance
- **Audit Logging**: Essential for compliance and incident response
- **Access Control**: Principle of least privilege
- **Data Protection**: No sensitive data in logs or error messages

## Resources

- [HOSTS_API.md](../api/HOSTS_API.md) - Complete host management API documentation
- [AGENT_ENDPOINT_HARDENING.md](../api/AGENT_ENDPOINT_HARDENING.md) - Security hardening guidelines
- [API Headers](api-headers.md) - Cache control and security headers
- [Fresh Clone Checklist](fresh-clone-checklist.md) - Secure setup procedures
