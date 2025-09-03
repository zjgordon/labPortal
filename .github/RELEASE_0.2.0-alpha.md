# Lab Portal v0.2.0-alpha Release Notes

**Release Date**: TBD  
**Version**: 0.2.0-alpha (Pre-release)

## 🎯 Release Highlights

### 🎨 Appearance Customization

- **Instance Name & Header Message**: Customize your portal with instance-specific branding
- **Dynamic Header Display**: Real-time appearance updates without page refresh
- **Professional Branding**: Perfect for multi-environment deployments

### 🎮 Experimental Control Plane

- **Host Management**: Add and configure infrastructure hosts for distributed control
- **Service Management**: Configure systemd services with granular permissions
- **Action Queue System**: Centralized action management with comprehensive lifecycle tracking
- **Agent System**: Token-based remote execution with secure authentication
- **POST Token Rotation**: One-time token reveal with secure hashed storage
- **Queue Semantics**: Efficient 204 No Content responses for empty queues

### 📚 Repository & Documentation Reorganization

- **Comprehensive Documentation**: Restructured `/docs` directory with clear categorization
- **API Reference**: Complete endpoint documentation with examples
- **Architecture Guides**: System design and finite state machine documentation
- **Development Guides**: Testing, security, and deployment best practices

### ⚡ Performance & Reliability Improvements

- **Response Caching**: Public APIs cached for 5 seconds with stale-while-revalidate
- **Prisma Indexes**: Optimized database queries with strategic indexing
- **Uniform Error Handling**: Consistent error response format across all endpoints
- **Rate Limiting**: Enhanced protection with comprehensive guard rails

## 🗄️ Database Migrations

This release introduces several new database tables. **Migration is required**.

### New Tables

- **`Appearance`**: Portal branding and customization settings
- **`Host`**: Infrastructure host management and agent configuration
- **`ManagedService`**: Systemd service definitions with permission controls
- **`Action`**: Control plane action tracking and lifecycle management

### Migration Command

```bash
npx prisma migrate deploy
```

## 🔧 New Environment Variables

Update your `.env` file with these new configuration options:

- **`ADMIN_ALLOWED_ORIGINS`**: Comma-separated list of allowed admin origins for CSRF protection
- **`READONLY_PUBLIC_TOKEN`**: Token for public read-only API access
- **`APPEARANCE_INSTANCE_NAME`**: Custom instance name displayed in portal header
- **`APPEARANCE_HEADER_TEXT`**: Custom header message for portal branding
- **`ENABLE_CONTROL_PLANE`**: Enable experimental control plane features (default: false)
- **`HOST_LOCAL_ID`**: Local host identifier for control operations (default: "local")
- **`ALLOW_SYSTEMCTL`**: Allow systemctl command execution (default: false)
- **`UNIT_ALLOWLIST_REGEX`**: Regex pattern for allowed systemd units
- **`EXEC_TIMEOUT_MS`**: Command execution timeout in milliseconds (default: 60000)
- **`ADMIN_CRON_SECRET`**: Secret for admin cron operations security

## 🔌 API Changes

### New Endpoints

- **`POST /api/hosts/:id/token`**: Generate new agent token (one-time reveal, hashed storage)
- **`GET /api/public/appearance`**: Fetch portal appearance configuration
- **`GET /api/control/queue`**: Agent action queue with long-polling support

### Caching Updates

- **Public APIs** (`/api/public/*`): Now cached for 5 seconds with `stale-while-revalidate=30`
- **Admin/Agent APIs**: Maintain `Cache-Control: no-store` for security

### Queue Behavior

- **Long-polling Support**: `wait` parameter (0-25 seconds) for efficient polling
- **204 No Content**: Returned when no actions are available (normal for empty queues)
- **Action Locking**: Actions automatically marked as `running` when delivered

### Security Enhancements

- **Token Security**: Plaintext tokens only revealed once during generation
- **Hash Storage**: Only token hashes stored in database for security
- **Origin Validation**: Strict CSRF protection for admin endpoints

## ⚠️ Known Limitations

### Control Plane (Experimental)

- **Actions Workflow**: Currently in testing phase - use with caution in production
- **Feature Stability**: Control plane features may change in future releases

### Infrastructure

- **Docker Hardening**: Additional security hardening for containerized deployments pending
- **Health Endpoints**: Enhanced health check endpoints for services coming in future release

### Testing

- **Integration Testing**: Expanded test coverage for control plane features in development

## 📋 Upgrade Notes

### Required Steps

1. **Database Migration**: Run `npx prisma migrate deploy` to apply new schema
2. **Environment Variables**: Verify your `.env` against the updated `.env.example`
3. **Dependencies**: Run `npm ci` to ensure all dependencies are current

### Optional Configuration

- **Control Plane**: Set `ENABLE_CONTROL_PLANE=false` to disable experimental features (recommended for production)
- **Appearance**: Configure `APPEARANCE_INSTANCE_NAME` and `APPEARANCE_HEADER_TEXT` for custom branding
- **Security**: Set `ADMIN_ALLOWED_ORIGINS` for enhanced CSRF protection

### Breaking Changes

- **None**: This release maintains backward compatibility with existing configurations

## 🧪 Testing

### Smoke Tests

```bash
# Run comprehensive smoke tests
./scripts/smoke.sh

# Test control plane functionality
./scripts/control-smoke.sh

# Test public API endpoints
./scripts/test-public-api.sh
```

### Manual Testing

- Verify appearance customization in admin panel
- Test agent token generation and rotation
- Validate queue polling behavior
- Confirm caching headers on public endpoints

## 📚 Documentation Updates

- **[API Documentation](../docs/api/)**: Complete endpoint reference with examples
- **[Agent System](../docs/agent/)**: Comprehensive agent setup and behavior guides
- **[Architecture](../docs/architecture/)**: System design and control plane FSM documentation
- **[Development](../docs/dev/)**: Updated testing and security guidelines
- **[Operations](../docs/ops/)**: Docker and deployment configuration

## 🤝 Contributing

This release includes enhanced contributor documentation:

- **[Fresh Clone Checklist](../docs/dev/fresh-clone-checklist.md)**: Step-by-step setup guide
- **[Security Checklist](../docs/dev/security-checklist.md)**: Security best practices
- **[Testing Guide](../docs/dev/SMOKE_TESTING.md)**: Comprehensive testing procedures

## 🆘 Support

For issues or questions about this release:

- 📖 Check the [documentation](../docs/index.md)
- 🐛 [Open an issue](https://github.com/zjgordon/labPortal/issues)
- 📋 Review the [project status](../PROJECT_STATUS.md)

---

**Lab Portal v0.2.0-alpha** - Enhanced customization, experimental control plane, and comprehensive documentation improvements.

_Built with ❤️ by the open source community_
