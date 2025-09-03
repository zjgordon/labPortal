# Release v0.2.0-alpha: Appearance Customization & Experimental Control Plane

## 🎯 Summary of Changes

### ✨ New Features

- **🎨 Appearance Customization**: Instance name and header message branding with real-time updates
- **🎮 Experimental Control Plane**: Host management, service control, and distributed action queue system
- **🔐 Enhanced Security**: POST token rotation with one-time reveal and secure hashed storage
- **⚡ Performance Improvements**: 5-second public API caching with stale-while-revalidate
- **📚 Documentation Overhaul**: Comprehensive API reference, architecture guides, and development docs

### 🗄️ Database Changes

- **New Tables**: `Appearance`, `Host`, `ManagedService`, `Action`
- **Prisma Indexes**: Optimized database queries for better performance

### 🔧 Configuration Updates

- **New Environment Variables**: `APPEARANCE_*`, `ENABLE_CONTROL_PLANE`, `ADMIN_ALLOWED_ORIGINS`, `READONLY_PUBLIC_TOKEN`, and more
- **API Enhancements**: Queue long-polling, 204 semantics, uniform error handling

### 🏗️ Infrastructure

- **Repository Reorganization**: Structured `/docs` directory with clear categorization
- **Agent System**: Token-based remote execution with comprehensive lifecycle management
- **Caching Strategy**: Public APIs cached (5s), admin/agent never cached

## ✅ Pre-merge Checklist

### Database & Environment

- [ ] Database migrations deploy successfully on fresh clone (`npx prisma migrate deploy`)
- [ ] `.env.example` has parity with all new environment variables
- [ ] Control plane features are flagged off by default (`ENABLE_CONTROL_PLANE=false`)

### Documentation & API

- [ ] All documentation updated to reflect current API behavior
- [ ] Cache headers verified (public: 5s, admin/agent: no-store)
- [ ] API endpoint references use correct HTTP methods (POST for token rotation)
- [ ] Release notes linked from README and PROJECT_STATUS

### Testing & Quality

- [ ] Smoke tests pass (`./scripts/smoke.sh`)
- [ ] Control plane smoke tests pass (`./scripts/control-smoke.sh`)
- [ ] Public API tests pass (`./scripts/test-public-api.sh`)
- [ ] No linting errors in modified files
- [ ] TypeScript compilation successful

### Version & Release

- [ ] Package.json version updated to `0.2.0-alpha`
- [ ] Version display updated in UI header
- [ ] Release notes comprehensive and accurate
- [ ] Breaking changes documented (none in this release)

## 🚀 Post-merge Actions

1. **Create GitHub Release**: Draft release from `.github/RELEASE_0.2.0-alpha.md`
2. **Update Documentation**: Verify all links work in production
3. **Monitor Performance**: Check public API caching effectiveness
4. **Gather Feedback**: Control plane features ready for testing

## 📋 Related Issues

<!-- Uncomment and update with actual issue numbers if applicable
Closes #XXX
Closes #YYY
-->

## 🧪 Testing Notes

This release includes experimental control plane features that are **disabled by default**. To test:

1. Set `ENABLE_CONTROL_PLANE=true` in your environment
2. Run database migrations: `npx prisma migrate deploy`
3. Configure appearance settings in admin panel
4. Test agent token generation and queue polling

**⚠️ Production Warning**: Keep `ENABLE_CONTROL_PLANE=false` in production until testing is complete.

---

**Lab Portal v0.2.0-alpha** - Ready for enhanced customization and distributed infrastructure management.
