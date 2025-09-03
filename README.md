# Lab Portal

> **Current release: v0.2.0-alpha (pre-release)** 🚧

A modern, cyberpunk-styled laboratory control panel and **control plane** built with Next.js 14, featuring real-time service monitoring, drag-and-drop card management, host and service control, and a sleek dark theme perfect for network laboratories.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma)
![NextAuth](https://img.shields.io/badge/NextAuth-4.24-000000?style=for-the-badge&logo=next.js)
![Jest](https://img.shields.io/badge/Jest-30.1-C21325?style=for-the-badge&logo=jest)

## 📁 Repository Structure

```
labPortal/
├── 📁 agent/                 # Agent system for remote execution
│   ├── 📁 src/              # TypeScript source code
│   ├── 📁 dist/             # Compiled JavaScript
│   └── 📁 install/          # Installation scripts
├── 📁 docs/                  # Comprehensive documentation
│   ├── 📁 agent/            # Agent system docs
│   ├── 📁 api/              # API reference
│   ├── 📁 architecture/     # System design docs
│   ├── 📁 dev/              # Development guides
│   └── 📁 ops/              # Operations & deployment
├── 📁 prisma/                # Database schema & migrations
│   └── 📁 migrations/       # Database migration files
├── 📁 public/                # Static assets
│   ├── 📁 icons/            # Application icons
│   └── 📁 uploads/          # User uploads
├── 📁 scripts/               # Utility scripts
├── 📁 src/                   # Main application source
│   ├── 📁 app/              # Next.js app router
│   │   ├── 📁 admin/        # Admin panel routes
│   │   ├── 📁 api/          # API endpoints
│   │   └── 📁 __tests__/    # App-level tests
│   ├── 📁 components/       # React components
│   │   └── 📁 ui/           # UI component library
│   ├── 📁 hooks/            # Custom React hooks
│   ├── 📁 lib/              # Utility libraries
│   │   ├── 📁 auth/         # Authentication logic
│   │   ├── 📁 control/      # Control plane logic
│   │   └── 📁 status/       # Status monitoring
│   └── 📁 types/            # TypeScript type definitions
├── 📁 tests/                 # Test utilities & configuration
├── 📁 .github/               # GitHub templates & workflows
│   ├── 📁 ISSUE_TEMPLATE/   # Issue templates
│   └── 📁 workflows/        # CI/CD workflows
├── 📁 .husky/                # Git hooks for pre-commit checks
└── 📁 prisma/                # Database configuration
```

## ✨ Features

### 🎯 Core Functionality

- **Real-time Service Monitoring** - Live status indicators for all lab tools with trend analysis
- **Dynamic Card Management** - Add, edit, and organize lab tool cards with drag & drop
- **Quick Service Control** - Start/stop/restart services directly from card UI (admin)
- **Host & Service Management** - Complete control plane for infrastructure management
- **Icon Management** - Upload and manage custom icons for each tool
- **Appearance Customization** - [Customize portal branding](docs/api/appearance.md) with instance names, header text, and themes
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### 🎨 Cyberpunk Aesthetic

- **Dark Theme** - Professional dark slate backgrounds
- **Neon Accents** - Emerald and cyan highlights with glowing effects
- **Smooth Animations** - Hover effects, transitions, and pulsing indicators
- **Modern UI** - Clean, space-efficient design inspired by Grafana dashboards
- **Appearance Customization** - [Instance name and header message branding](docs/api/appearance.md) ([Screenshot Guide](docs/assets/appearance-screenshot.md))

### 🔒 Security & Authentication

- **Admin Panel** - Password-protected configuration interface
- **Session Management** - Secure authentication with NextAuth.js
- **Input Validation** - Comprehensive validation and sanitization
- **Rate Limiting** - Protection against abuse and overload
- **API Key Authentication** - Secure authentication for automation and CI/CD
- **Guard Rails** - Enterprise-grade rate limiting and audit logging
- **Origin/CSRF Protection** - Strict origin validation for state-changing operations
- **Agent Separation** - Complete isolation between admin and agent endpoints

### 🎮 Control Plane & Infrastructure

- **Host Management** - Add, configure, and monitor infrastructure hosts
- **Service Management** - Configure systemd services with permissions
- **Local Execution** - Direct systemctl integration for portal host
- **Remote Agents** - Token-based agent system for distributed execution
- **Action Queue** - Comprehensive action lifecycle management
- **Health Monitoring** - Agent heartbeat and status reporting

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](docs/index.md) directory:

### 🏗️ Architecture & Design

- [System Design](docs/architecture/CONTROL_SYSTEM_FSM.md) - Control system finite state machine

### 🔌 API Reference

- [Agent API](docs/api/AGENT_API.md) - Complete agent system API
- [Appearance API](docs/api/appearance.md) - Portal appearance and branding configuration
- [Control Actions](docs/api/CONTROL_ACTIONS_API.md) - Control plane management
- [Hosts API](docs/api/HOSTS_API.md) - Host management and agent token administration
- [Public API](docs/api/PUBLIC_API.md) - Public endpoints and status
- [Queue Behavior](docs/api/QUEUE_ENDPOINT_BEHAVIOR.md) - Action queue semantics
- [Security Hardening](docs/api/AGENT_ENDPOINT_HARDENING.md) - Security guidelines

### 🤖 Agent System

- [Agent Setup](docs/agent/LOCAL_ACTION_EXECUTION.md) - Local system control
- [Agent Behavior](docs/agent/AGENT_BEHAVIOR.md) - Configuration and behavior
- [Service Configuration](docs/agent/lab-portal-agent.service) - Systemd service setup
- [Agent Code](agent/README.md) - Complete agent system implementation

### 🚀 Operations & Deployment

- [Docker Setup](docs/ops/docker-compose.yml) - Development and production
- [System Configuration](docs/ops/SUDOERS_CONFIGURATION.md) - Permissions and setup
- [Deployment Scripts](docs/ops/setup.sh) - Automated deployment

### 🧪 Development & Testing

- [Testing Guide](docs/dev/SMOKE_TESTING.md) - Comprehensive testing
- [Development Setup](docs/dev/TESTING.md) - Testing framework
- [Status Testing](docs/dev/STATUS_TESTING.md) - Status system validation
- [Testing Framework](tests/README.md) - Testing guidelines and structure

## 📋 Releases

### Current Release: v0.2.0-alpha (Pre-release)

- **[Release Notes](.github/RELEASE_0.2.0-alpha.md)** - Complete changelog and upgrade guide
- **Status**: Pre-release with experimental control plane features
- **Key Features**: Appearance customization, control plane, documentation improvements

## 📡 API Endpoints & Error Handling

### Endpoint Categories

#### Admin Endpoints (`/api/admin/*`, `/api/cards/*`, `/api/hosts/*`, `/api/services/*`)

- **Authentication**: Session-based (NextAuth.js) or API key (`x-api-key`)
- **Caching**: `Cache-Control: no-store` (no caching)
- **Error Format**: Uniform error responses with codes and messages
- **CSRF Protection**: Origin validation for state-changing operations

#### Agent Endpoints (`/api/agents/*`, `/api/control/*`)

- **Authentication**: Bearer token in `Authorization` header
- **Caching**: `Cache-Control: no-store` + `Vary: Authorization`
- **Error Format**: Uniform error responses with codes and messages
- **Security**: Reject requests with cookies, enforce token-only auth

#### Public Endpoints (`/api/public/*`, `/api/status`)

- **Authentication**: None required
- **Caching**: `Cache-Control: public, max-age=5, stale-while-revalidate=30`
- **Error Format**: Uniform error responses with codes and messages
- **Compression**: Gzip/Brotli compression for optimal performance

### Response Optimization & Caching

**Public APIs are cached for 5s; admin/agent never cached.**

- **Admin/Agent APIs**: `Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate`
- **Public Status APIs**: `Cache-Control: public, max-age=5, stale-while-revalidate=30`
- **Compression**: Automatic Gzip/Brotli compression for JSON responses
- **Content-Type**: `application/json; charset=utf-8` for all API responses
- **Vary Headers**: `Vary: Authorization` for endpoints that vary by auth token
- **Token Security**: Rotation returns the token once; only hash + prefix are stored thereafter
- **GET Protection**: GET /api/hosts/:id never returns plaintext token

### Error Response Format

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error description"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `INVALID_TOKEN` - Invalid agent token
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `INVALID_STATE_TRANSITION` - Business logic violation
- `INTERNAL_ERROR` - Server error

### Queue Long-Poll Semantics

The `/api/control/queue` endpoint supports long-polling:

- **204 No Content**: No actions available (normal for empty queues)
- **200 OK**: Actions found and returned
- **Polling**: Use `wait` parameter (0-25 seconds) for efficient waiting
- **Action Locking**: Actions are automatically marked as `running` when delivered to prevent duplicate processing

### One-Time Token System

- **Agent Authentication**: Bearer tokens for secure agent identification
- **Token Hashing**: Tokens are hashed before storage (never stored in plain text)
- **Host Binding**: Each token is bound to a specific host for isolation
- **Secure Storage**: Token hashes stored in database, original tokens never logged

### Idempotency Support

- **Idempotency Keys**: Use `Idempotency-Key` header for safe retry operations
- **Action Deduplication**: Prevents duplicate actions when retrying failed requests
- **Key Format**: UUID v4 recommended for global uniqueness
- **Expiration**: Keys expire after 90 days for automatic cleanup

## 🌐 API Endpoints

### Public Routes

- `GET /api/cards` - Get enabled lab tool cards
- `GET /api/status?cardId=...` - Check service status

### Protected Routes (Admin)

- `GET /api/cards/all` - Get all cards
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card
- `POST /api/cards/reorder` - Reorder cards
- `POST /api/cards/:id/icon` - Upload card icon

## ⚙️ Configuration

The Lab Portal uses environment variables for configuration. All required and optional variables are documented in [`.env.example`](env.example).

### Required Environment Variables

- **`ADMIN_PASSWORD`** - Password for admin panel access
- **`NEXTAUTH_SECRET`** - Secret key for NextAuth.js authentication
- **`NEXTAUTH_URL`** - Base URL for NextAuth.js (e.g., http://localhost:3000)
- **`DATABASE_URL`** - Database connection string (SQLite file path)
- **`PUBLIC_BASE_URL`** - Public-facing base URL for the portal

### Optional Environment Variables

- **`STATUS_SWEEPER_ENABLED`** - Enable/disable status monitoring (default: true)
- **`HOST_LOCAL_ID`** - Local host identifier (default: local)
- **`ALLOW_SYSTEMCTL`** - Allow systemctl commands (default: false)
- **`UNIT_ALLOWLIST_REGEX`** - Regex for allowed systemd units (default: safe pattern)
- **`EXEC_TIMEOUT_MS`** - Command execution timeout in milliseconds (default: 60000)
- **`READONLY_PUBLIC_TOKEN`** - Token for public read-only API access
- **`ADMIN_ALLOWED_ORIGINS`** - Comma-separated list of allowed admin origins
- **`ADMIN_CRON_SECRET`** - Secret for admin cron operations
- **`APPEARANCE_INSTANCE_NAME`** - Custom instance name for the portal
- **`APPEARANCE_HEADER_TEXT`** - Custom header text for the portal

For complete configuration details and examples, see [`.env.example`](env.example).

## 🔒 Security Features

- **Content Security Policy (CSP)** - Strict CSP headers preventing XSS and unauthorized resource loading
- **Input Validation** - Zod schemas for all inputs
- **File Upload Security** - Type and size validation with image processing
- **Rate Limiting** - API protection against abuse
- **Authentication** - Secure admin access with NextAuth.js
- **API Key Authentication** - Alternative authentication for automation and CI/CD
- **XSS Protection** - Comprehensive security headers and CSP enforcement
- **CSRF Protection** - Origin validation for state-changing operations

### CSRF Protection Details

- **Admin Routes**: Require NextAuth cookie + same-origin POSTs
- **Origin Validation**: Origin header is enforced against `ADMIN_ALLOWED_ORIGINS` environment variable
- **Cookie Security**: Cookies are SameSite=Lax; no CSRF tokens needed beyond Origin check
- **State-Changing Methods**: POST/PUT/PATCH/DELETE require valid Origin header
- **GET Requests**: Allow missing Origin header for read operations

### High-Security Endpoints

- **Cron/Prune Management**: `/api/control/cron` and `/api/control/prune` require both admin session AND server-side secret (`ADMIN_CRON_SECRET`)
- **Server Secret**: Must be provided via `X-Cron-Secret` header for additional security layer
- **No GET Access**: These endpoints only accept POST requests for state-changing operations

## 🛡️ Enterprise Features & Guard Rails

### Rate Limiting & Protection

- **Admin Rate Limiting** - 10 actions/minute per admin user
- **API Protection** - Comprehensive rate limiting for all endpoints
- **Abuse Prevention** - Protection against automated attacks

### Audit & Compliance

- **Action History** - Immutable 90-day retention of all control actions
- **Comprehensive Logging** - Structured logging for all system events
- **Audit Trail** - Complete tracking of who did what and when
- **No Sensitive Data** - Logs exclude passwords and sensitive information

### Automated Maintenance

- **Data Pruning** - Automated cleanup of old action history
- **Cron Management** - Scheduled maintenance and cleanup tasks
- **Background Services** - Automated status monitoring and health checks
- **Graceful Shutdown** - Proper cleanup of background processes

## 📁 File Uploads & Image Processing

The portal includes secure file upload handling with advanced image processing:

- **Supported Formats** - PNG, JPEG, and WebP images up to 2MB
- **Image Processing** - Automatic conversion to optimized PNG format using Sharp
- **Security Features** - EXIF data stripping, size validation, and type checking
- **Optimization** - Images resized to 128x128px with high compression
- **Storage** - Files stored in `/public/uploads/` with automatic cleanup
- **Icon Management** - Automatic old icon cleanup when replacing

## 📊 Status Monitoring

The portal includes a sophisticated status monitoring system:

- **Real-time Updates** - Status checked every 10 seconds with smart caching
- **Trend Analysis** - 24h/7d status history with sparkline visualization
- **Uptime Statistics** - Performance metrics and uptime percentage tracking
- **Health Path Support** - Optional custom health check endpoints for each service
- **Enhanced Probes** - HEAD requests with GET fallback for better compatibility
- **Error Handling** - Comprehensive error detection and reporting
- **Latency Measurement** - Response time tracking for each service
- **HTTP Status Tracking** - Records last HTTP status code and response messages
- **Background Monitoring** - Automated status sweeping with 45-60s intervals
- **Status Events** - Immutable status history with comprehensive logging

## 🎮 Control Plane & Infrastructure (Experimental)

**Note**: Control plane features are disabled by default until action testing is complete. Set `ENABLE_CONTROL_PLANE=true` in your environment to enable these features.

### Host Management

- **Infrastructure Control** - Add and configure hosts for service management (Experimental)
- **Token Authentication** - Secure agent tokens for remote access (Experimental)
- **Health Monitoring** - Track host availability and agent status (Experimental)
- **Service Association** - Link services to specific hosts (Experimental)

### Service Management

- **Systemd Integration** - Direct control of systemd services (Experimental)
- **Permission Control** - Configure start/stop/restart permissions (Experimental)
- **Card Linking** - Associate services with portal cards (Experimental)
- **Action History** - Track all service control operations (Experimental)

### Quick Controls

- **Card-Level Actions** - Start/stop/restart services directly from cards (Experimental)
- **Real-Time Feedback** - Toast notifications for action status (Experimental)
- **Permission Validation** - Respects service-level permissions (Experimental)
- **Rate Limiting** - 10 actions/minute per admin with guard rails (Experimental)

### Agent System

- **Remote Execution** - Pull-based architecture for distributed control (Experimental)
- **Token Security** - Secure authentication for remote agents (Experimental)
- **Health Monitoring** - Agent heartbeat and status reporting (Experimental)
- **Action Queue** - Centralized action management and distribution (Experimental)

## 🤝 Contributing

We welcome contributions! This project is designed to be contributor-friendly with comprehensive templates and guidelines.

### 🚀 Getting Started

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run pre-commit checks**:
   - `npm run typecheck` - TypeScript compilation
   - `npm run lint` - ESLint checks
   - `npm test` - Run test suite
   - `npm run format` - Check code formatting
5. **Commit your changes**: Git hooks will automatically format and lint your code
6. **Submit a pull request**

### 📋 Pull Request Guidelines

- Use the provided [Pull Request Template](.github/PULL_REQUEST_TEMPLATE.md)
- Ensure all pre-commit checks pass
- Include tests for new functionality
- Update documentation as needed
- Follow the existing code style (enforced by Prettier + ESLint)

### 🐛 Reporting Issues

- Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug.md) for bugs
- Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature.md) for new features
- Provide detailed information and reproduction steps

### 🛠️ Development Setup

- **Node.js**: Version 20.x (see [.nvmrc](.nvmrc))
- **Package Manager**: npm or yarn
- **Code Style**: 2 spaces, UTF-8, LF line endings (see [.editorconfig](.editorconfig))
- **Git Hooks**: Husky + lint-staged for automatic formatting and linting
- **Fresh Clone Setup**: See [Fresh Clone Checklist](docs/dev/fresh-clone-checklist.md) for step-by-step setup instructions

### 🧪 Quick Testing

- **Run smoke tests**: `./scripts/smoke.sh` - One command to sanity check critical flows
- **Control actions test**: `./scripts/control-smoke.sh` - Test control plane functionality
- **Public API test**: `./scripts/test-public-api.sh` - Test public endpoints

### 📚 Documentation

- Update relevant documentation in the `/docs` folder
- Follow the existing documentation structure
- Include code examples and use cases

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions:

- 📖 Check the [comprehensive documentation](docs/index.md)
- 🐛 [Open an issue](https://github.com/zjgordon/labPortal/issues) in the GitHub repository
- 📋 Review the [project status](PROJECT_STATUS.md) for current development status
- 🔍 Explore the [API documentation](docs/api/) for technical details

---

**Lab Portal** - Your gateway to efficient laboratory management with style. 🚀

_Built with ❤️ by the open source community_
