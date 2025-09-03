# 🚀 Lab Portal v0.2-alpha Release

## 🎉 What's New

This alpha release introduces **Appearance Customization**, **Experimental Control Plane**, and significant **Documentation & Performance Improvements**. The Lab Portal is now more professional, configurable, and ready for advanced infrastructure management.

---

## ✨ Highlights

### 🎨 **Appearance Header & Branding**

- **Instance Customization**: Set custom instance names and header text via environment variables
- **Real-time Updates**: Header changes apply instantly without page refresh
- **Professional Interface**: Clean admin form for appearance management
- **Database Persistence**: Appearance settings stored securely in database

### 🎮 **Control Plane (Experimental)**

- **Host Management**: Add and configure infrastructure hosts with agent tokens
- **Service Management**: Configure systemd services with granular permissions
- **Action Queue**: Centralized action management with status tracking
- **Remote Execution**: Token-based agent system for distributed control
- **Local Integration**: Direct systemctl integration for portal host

### 📚 **Documentation Reorganization**

- **Structured Layout**: Organized documentation into logical sections (API, Architecture, Dev, Ops)
- **Comprehensive Guides**: Complete API references with examples and best practices
- **Developer Resources**: Fresh clone checklists, security guidelines, and testing documentation
- **Visual Assets**: Screenshot guides and architectural diagrams

### ⚡ **Performance & Caching Improvements**

- **Smart Caching**: Strategic cache headers for optimal performance
- **Error Shape Consistency**: Standardized error response format across all endpoints
- **Database Indexes**: Optimized queries with strategic indexing
- **Response Optimization**: Enhanced HTTP headers and compression support

### 🔒 **Security & Authentication**

- **API Key Support**: Secure authentication for automation and CI/CD
- **Token Hashing**: Secure storage of agent tokens with rotation support
- **CSRF Protection**: Enhanced security for state-changing operations
- **Rate Limiting**: Protection against abuse with configurable limits

---

## 🗄️ Database Migrations

### New Tables Added

#### **Host** - Infrastructure Host Management

```sql
CREATE TABLE "Host" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "agentTokenHash" TEXT,
    "agentTokenPrefix" TEXT,
    "tokenRotatedAt" DATETIME,
    "lastSeenAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
```

#### **ManagedService** - Service Configuration

```sql
CREATE TABLE "ManagedService" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cardId" TEXT,
    "hostId" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "allowStart" BOOLEAN NOT NULL DEFAULT true,
    "allowStop" BOOLEAN NOT NULL DEFAULT true,
    "allowRestart" BOOLEAN NOT NULL DEFAULT true
);
```

#### **Action** - Control Action Tracking

```sql
CREATE TABLE "Action" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hostId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "requestedBy" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "exitCode" INTEGER,
    "message" TEXT,
    "idempotencyKey" TEXT UNIQUE
);
```

#### **Appearance** - Portal Branding

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

### Enhanced Tables

#### **Card** - Enhanced with Groups & Health Paths

- Added `group` field for card organization
- Added `healthPath` for custom health check endpoints
- Added `failCount` and `nextCheckAt` for smart monitoring
- Added `StatusEvent` relationship for comprehensive history

#### **CardStatus** - Improved Monitoring

- Added `failCount` for consecutive failure tracking
- Added `nextCheckAt` for adaptive polling intervals
- Enhanced with `StatusEvent` history tracking

---

## 🔧 New Environment Variables

### Control Plane Configuration

```bash
# Enable experimental control plane features
ENABLE_CONTROL_PLANE="false"

# Local host configuration for systemctl integration
HOST_LOCAL_ID="local"
ALLOW_SYSTEMCTL="false"
UNIT_ALLOWLIST_REGEX="^([a-z0-9@._-]+)\\\\.service$"
EXEC_TIMEOUT_MS="60000"
```

### Public API Access

```bash
# Token for public read-only access (Grafana integration)
READONLY_PUBLIC_TOKEN="your-public-readonly-token-here"
```

### Admin Management

```bash
# Server secret for admin cron operations
ADMIN_CRON_SECRET="your-server-secret-here"

# CSRF protection origins
ADMIN_ALLOWED_ORIGINS="http://localhost:3000,https://portal.yourdomain.com"
```

### Appearance Customization

```bash
# Portal branding and appearance
APPEARANCE_INSTANCE_NAME="Lab Portal"
APPEARANCE_HEADER_TEXT="Lab Portal"
```

### Enhanced Status Monitoring

```bash
# Enable background status monitoring
STATUS_SWEEPER_ENABLED="true"
```

---

## 🔌 API Changes

### New Endpoints

#### **Public Appearance API**

```http
GET /api/public/appearance
```

- Returns portal branding and appearance settings
- No authentication required
- Optimized caching headers

#### **Admin Appearance Management**

```http
GET /api/admin/appearance
PUT /api/admin/appearance
```

- Full CRUD operations for appearance settings
- Admin authentication required
- Real-time updates

#### **Control Plane APIs**

```http
GET /api/hosts
POST /api/hosts
GET /api/services
POST /api/services
GET /api/control/actions
POST /api/control/actions
GET /api/control/queue
POST /api/control/report
```

- Complete host and service management
- Action queue and execution tracking
- Agent integration endpoints

### Enhanced Endpoints

#### **Queue Endpoint Semantics**

```http
GET /api/control/queue?wait=1
```

- **204 No Content**: Queue is empty (expected behavior)
- **401 Unauthorized**: Authentication required
- **200 OK**: Actions available with action data

#### **Token Rotation Support**

- **POST** operations now support token rotation
- Enhanced security with hashed token storage
- Automatic token prefix tracking

### Response Improvements

#### **Standardized Error Format**

```json
{
  "error": "Descriptive error message",
  "details": "Additional context if available",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### **Enhanced Caching Headers**

- Public endpoints: `Cache-Control: public, max-age=5, stale-while-revalidate=30`
- Admin endpoints: `Cache-Control: no-store, no-cache, must-revalidate`
- Status endpoints: Optimized for real-time monitoring

---

## 🚨 Known Limitations

### **Control Plane Actions Workflow**

- **Status**: Still in testing phase
- **Impact**: Actions may not complete successfully in all environments
- **Workaround**: Use manual systemctl commands for critical services
- **Timeline**: Full testing completion expected in v0.3

### **Docker Hardening**

- **Status**: Pending implementation
- **Impact**: Production deployments should use additional security measures
- **Workaround**: Deploy behind reverse proxy with proper firewall rules
- **Timeline**: Security hardening planned for v0.3

### **Agent System**

- **Status**: Experimental
- **Impact**: Remote execution may be unstable
- **Workaround**: Use local systemctl integration for now
- **Timeline**: Agent stability improvements in v0.3

---

## 🧪 Testing & Validation

### **Smoke Tests**

```bash
# Comprehensive testing of critical flows
./scripts/smoke.sh

# Control plane specific testing
./scripts/control-smoke.sh

# Public API validation
./scripts/test-public-api.sh
```

### **Test Coverage**

- ✅ Public appearance and status endpoints
- ✅ Admin card management (CRUD + icon upload)
- ✅ Queue endpoint behavior verification
- ✅ Control plane functionality (when enabled)
- ✅ Authentication and authorization flows

---

## 🚀 Getting Started

### **Quick Start**

```bash
# Clone and setup
git clone https://github.com/zjgordon/labPortal.git
cd labPortal

# Install dependencies
npm install

# Setup environment
cp env.example .env.local
# Edit .env.local with your configuration

# Setup database
npx prisma migrate deploy
npx prisma generate

# Start development server
npm run dev
```

### **Enable Control Plane**

```bash
# Add to .env.local
ENABLE_CONTROL_PLANE="true"
ALLOW_SYSTEMCTL="true"
```

### **Customize Appearance**

```bash
# Add to .env.local
APPEARANCE_INSTANCE_NAME="My Lab Portal"
APPEARANCE_HEADER_TEXT="Welcome to the Network Lab"
```

---

## 📚 Documentation

### **New Documentation**

- [Appearance API](docs/api/appearance.md) - Complete appearance management guide
- [Control Actions API](docs/api/CONTROL_ACTIONS_API.md) - Control plane management
- [Agent API](docs/api/AGENT_API.md) - Remote agent integration
- [Smoke Testing](docs/dev/SMOKE_TESTING.md) - Testing and validation guide

### **Enhanced Guides**

- [Fresh Clone Checklist](docs/dev/fresh-clone-checklist.md) - Step-by-step setup
- [Security Checklist](docs/dev/security-checklist.md) - Security best practices
- [API Headers](docs/dev/api-headers.md) - HTTP header optimization

---

## 🔄 Migration Guide

### **From v0.1**

1. **Database**: Run `npx prisma migrate deploy` to apply new migrations
2. **Environment**: Add new environment variables from `env.example`
3. **Control Plane**: Set `ENABLE_CONTROL_PLANE="true"` if desired
4. **Appearance**: Customize portal branding via environment variables

### **Breaking Changes**

- **None**: This is a backward-compatible release
- **New Features**: All new functionality is opt-in via environment variables

---

## 🎯 What's Next

### **v0.3 Roadmap**

- **Control Plane Stability**: Complete action workflow testing
- **Docker Security**: Production-ready containerization
- **Agent Reliability**: Stable remote execution system
- **Performance**: Additional caching and optimization
- **Monitoring**: Enhanced metrics and alerting

### **Long-term Vision**

- **Multi-tenant Support**: Organization and user management
- **Advanced Monitoring**: Custom dashboards and alerting
- **Plugin System**: Extensible functionality
- **Enterprise Features**: SSO, audit logging, compliance

---

## 🤝 Contributing

We welcome contributions! This release includes:

- **Comprehensive Testing**: Automated smoke tests and validation
- **Documentation**: Complete API references and guides
- **Code Quality**: TypeScript, ESLint, and Prettier integration
- **Git Hooks**: Automated formatting and validation

### **Getting Started**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🆘 Support

- 📖 [Documentation](docs/index.md)
- 🐛 [Issue Tracker](https://github.com/zjgordon/labPortal/issues)
- 📋 [Project Status](PROJECT_STATUS.md)
- 🔍 [API Reference](docs/api/)

---

**Lab Portal v0.2-alpha** - Your gateway to professional laboratory management with style. 🚀

_Built with ❤️ by the open source community_
