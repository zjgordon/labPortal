# Lab Portal

A modern, cyberpunk-styled laboratory control panel and **control plane** built with Next.js 14, featuring real-time service monitoring, drag-and-drop card management, host and service control, and a sleek dark theme perfect for network laboratories.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma)
![NextAuth](https://img.shields.io/badge/NextAuth-4.24-000000?style=for-the-badge&logo=next.js)
![Jest](https://img.shields.io/badge/Jest-30.1-C21325?style=for-the-badge&logo=jest)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Service Monitoring** - Live status indicators for all lab tools with trend analysis
- **Dynamic Card Management** - Add, edit, and organize lab tool cards with drag & drop
- **Quick Service Control** - Start/stop/restart services directly from card UI (admin)
- **Host & Service Management** - Complete control plane for infrastructure management
- **Icon Management** - Upload and manage custom icons for each tool
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile

### 🎨 Cyberpunk Aesthetic
- **Dark Theme** - Professional dark slate backgrounds
- **Neon Accents** - Emerald and cyan highlights with glowing effects
- **Smooth Animations** - Hover effects, transitions, and pulsing indicators
- **Modern UI** - Clean, space-efficient design inspired by Grafana dashboards

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
- **Caching**: `Cache-Control: max-age=5, stale-while-revalidate=30`
- **Error Format**: Uniform error responses with codes and messages

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

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd labPortal
chmod +x setup.sh
./setup.sh
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Manual Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Admin Access
ADMIN_PASSWORD="your-admin-password"

# Portal Configuration
PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development
```bash
npm run dev
```

## 📱 Usage

### Main Portal
- **View Lab Tools** - See all available services with real-time status
- **Quick Access** - Click any card to open the service in a new tab
- **Status Monitoring** - Live indicators show if services are up/down

### Admin Panel
- **Access**: Navigate to `/admin/login` and enter your admin password
- **Manage Cards**: Add, edit, delete, and reorder lab tool cards
- **Upload Icons**: Customize each tool with unique icons
- **Enable/Disable**: Control which tools are visible to users
- **Import/Export**: Bulk import and export card configurations as JSON
- **Host Management**: Configure and monitor infrastructure hosts
- **Service Management**: Set up and control systemd services
- **Quick Controls**: Start/stop/restart services directly from cards
- **Action History**: View and manage control action history

## 🎨 Customization

### Adding New Lab Tools
1. Log into the admin panel
2. Click "Manage Lab Tools"
3. Click "Add New Card"
4. Fill in:
   - **Title**: Display name for the tool
   - **Description**: Brief description of the tool
   - **URL**: Service endpoint (http://, https://, or relative paths)
   - **Health Path**: Optional health check endpoint (e.g., /health, /status, /api/health)
   - **Icon**: Upload a custom icon (PNG/JPEG/WebP, max 2MB)

### Bulk Import/Export
The admin panel supports bulk import and export of card configurations:

#### Export Cards
- Click "Export Cards" to download all current cards as a JSON file
- The export excludes timestamps and status data for clean portability
- Use this to backup your configuration or share with other instances

#### Import Cards
- Click "Import Cards" to upload a JSON file with card configurations
- Cards are matched by ID first, then by title for upsert operations
- New cards are created, existing ones are updated
- Import results show counts of created/updated/skipped cards

#### Import Format
```json
{
  "cards": [
    {
      "title": "Service Name",
      "description": "Service description",
      "url": "http://service.local",
      "iconPath": null,
      "order": 1,
      "isEnabled": true,
      "group": "Service Group",
      "healthPath": "/health"
    }
  ]
}
```

**Note**: The `iconPath` field is ignored during import for security reasons. Icons must be uploaded separately through the admin interface.

### Styling
The application uses Tailwind CSS with a custom cyberpunk theme:
- **Primary Colors**: Emerald (`emerald-400`) and Cyan (`cyan-400`)
- **Backgrounds**: Dark slate (`slate-900`, `slate-800`)
- **Accents**: Neon glows and pulsing indicators
- **Responsive**: Mobile-first design with breakpoint optimizations

## 🐳 Docker Deployment

### Development
```bash
docker-compose up --build
```

### Production
```bash
# Build production image
docker build -f Dockerfile.prod -t lab-portal .

# Run with environment variables
docker run -d \
  --name lab-portal \
  -p 3000:3000 \
  -e DATABASE_URL="your-database-url" \
  -e NEXTAUTH_SECRET="your-secret" \
  -e ADMIN_PASSWORD="your-admin-password" \
  -e NEXTAUTH_URL="http://your-domain.com" \
  -e PUBLIC_BASE_URL="http://your-domain.com" \
  -v ./uploads:/app/public/uploads \
  lab-portal
```

## 🔌 API Reference

### Card Management Endpoints

#### GET `/api/cards/export`
Export all cards as JSON (admin only)
- **Response**: Array of card objects (excludes timestamps and status)
- **Use Case**: Backup configurations, share between instances

#### POST `/api/cards/import`
Import cards from JSON (admin only)
- **Body**: `{ "cards": [...] }` array of card objects
- **Response**: Import results with counts and any errors
- **Features**: Upsert by ID or title, skips icon binary data

#### GET `/api/cards/all`
Get all cards with status (admin only)
- **Response**: Array of cards with full details including status

#### POST `/api/cards`
Create new card (admin only)
- **Body**: Card object with required fields

#### PUT `/api/cards/:id`
Update existing card (admin only)
- **Body**: Partial card object with fields to update

#### DELETE `/api/cards/:id`
Delete card (admin only)

#### POST `/api/cards/reorder`
Reorder cards (admin only)
- **Body**: `{ "cards": [{ "id": "...", "order": 1, "group": "..." }] }`

### Status Endpoints

#### GET `/api/status?cardId=...`
Check status of a specific card
- **Response**: Current status with health check results
- **Caching**: Results cached for 30 seconds

#### GET `/api/status/history?cardId=...`
Get status history for trend analysis
- **Response**: Historical status data with timestamps
- **Features**: 24h/7d trend data with sparkline visualization

#### GET `/api/status/summary?cardId=...`
Get uptime statistics and performance metrics
- **Response**: Uptime percentage and performance data

### Control Plane Endpoints

#### Host Management
- `GET /api/hosts` - List all hosts (admin)
- `POST /api/hosts` - Create new host (admin)
- `PUT /api/hosts/:id` - Update host (admin)
- `DELETE /api/hosts/:id` - Delete host (admin)
- `GET /api/hosts/:id/token` - Generate host token (admin)

#### Service Management
- `GET /api/services` - List all services (admin)
- `POST /api/services` - Create new service (admin)
- `PUT /api/services/:id` - Update service (admin)
- `DELETE /api/services/:id` - Delete service (admin)

#### Control Actions
- `POST /api/control/actions` - Create control action (admin)
- `GET /api/control/actions/:id` - Get action status (admin)
- `GET /api/control/queue` - Agent action polling
- `POST /api/control/report` - Agent status reporting
- `GET /api/control/cron` - Cron job management (admin)
- `POST /api/control/prune` - Manual data pruning (admin)

#### Agent System
- `POST /api/agents/heartbeat` - Agent health monitoring

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel routes
│   ├── api/               # API endpoints
│   │   ├── auth/          # NextAuth authentication
│   │   ├── cards/         # Card management
│   │   ├── status/        # Status monitoring & history
│   │   ├── control/       # Control plane APIs
│   │   ├── hosts/         # Host management
│   │   ├── services/      # Service management
│   │   ├── agents/        # Agent health monitoring
│   │   └── test-env/      # Test environment API
│   └── page.tsx           # Main portal page
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── lab-card.tsx       # Lab tool card with quick controls
│   ├── status-indicator.tsx # Status display component
│   ├── sparkline.tsx      # Trend visualization
│   └── card-edit-dialog.tsx # Card editing dialog
├── lib/                    # Utilities and configurations
│   ├── auth.ts            # Authentication & authorization
│   ├── probe.ts           # URL health checking
│   ├── status-sweeper.ts  # Background status monitoring
│   ├── systemctl-executor.ts # Local action execution
│   ├── action-pruner.ts   # Action history management
│   ├── cron-manager.ts    # Cron job management
│   └── logger.ts          # Structured logging
└── types/                  # TypeScript definitions

prisma/
├── schema.prisma          # Database schema (Cards, Status, Hosts, Services, Actions)
└── seed.ts                # Initial data with managed services

scripts/
└── curl/                  # Smoke testing scripts
```

## 🔧 Available Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with example data

## 🧪 Testing

### Manual Smoke Testing

The project includes a comprehensive smoke test script for validating the control actions flow without UI:

```bash
# Run smoke test with defaults (localhost:3000, admin123 password)
./scripts/curl/control-smoke.sh

# Custom URL and password
./scripts/curl/control-smoke.sh -u http://localhost:8080 -p mypassword

# Using environment variables
BASE_URL=http://localhost:8080 ADMIN_PASSWORD=mypassword ./scripts/curl/control-smoke.sh

# Show help
./scripts/curl/control-smoke.sh --help
```

**What the smoke test validates:**
- ✅ Portal readiness and connectivity
- ✅ Admin authentication
- ✅ Host and service creation/retrieval
- ✅ Control action enqueuing (start/stop/restart)
- ✅ Localhost path completion (systemctl executor)
- ✅ Agent path pickup verification

**Requirements:**
- `curl` - HTTP client for API calls
- `jq` - JSON processor for response parsing
- Portal running and accessible
- API key authentication configured (see `scripts/curl/env.example`)

**Test Flow:**
1. Creates test host (`smoke-test-host`) and service (`smoke-test.service`)
2. Enqueues start/stop actions and verifies localhost completion
3. Enqueues restart action and verifies agent pickup
4. Cleans up temporary files automatically

**Documentation:**
- [Comprehensive Smoke Testing Guide](SMOKE_TESTING.md)
- [Scripts Directory](scripts/README.md)
- [Control Actions API](CONTROL_ACTIONS_API.md)
- [Agent System API](AGENT_API.md)
- [Local Action Execution](LOCAL_ACTION_EXECUTION.md)
- [Project Status](PROJECT_STATUS.md)

### Testing Framework
- **Jest Integration** - Full testing framework with coverage reporting
- **Component Testing** - React component testing with React Testing Library
- **API Testing** - Comprehensive API endpoint testing
- **Smoke Testing** - End-to-end validation without UI dependencies
- **CI/CD Ready** - Automated testing for deployment pipelines

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

## 🔒 Security Features

- **Content Security Policy (CSP)** - Strict CSP headers preventing XSS and unauthorized resource loading
- **Input Validation** - Zod schemas for all inputs
- **File Upload Security** - Type and size validation with image processing
- **Rate Limiting** - API protection against abuse
- **Authentication** - Secure admin access with NextAuth.js
- **API Key Authentication** - Alternative authentication for automation and CI/CD
- **XSS Protection** - Comprehensive security headers and CSP enforcement

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

## 🎮 Control Plane & Infrastructure

### Host Management
- **Infrastructure Control** - Add and configure hosts for service management
- **Token Authentication** - Secure agent tokens for remote access
- **Health Monitoring** - Track host availability and agent status
- **Service Association** - Link services to specific hosts

### Service Management
- **Systemd Integration** - Direct control of systemd services
- **Permission Control** - Configure start/stop/restart permissions
- **Card Linking** - Associate services with portal cards
- **Action History** - Track all service control operations

### Quick Controls
- **Card-Level Actions** - Start/stop/restart services directly from cards
- **Real-Time Feedback** - Toast notifications for action status
- **Permission Validation** - Respects service-level permissions
- **Rate Limiting** - 10 actions/minute per admin with guard rails

### Agent System
- **Remote Execution** - Pull-based architecture for distributed control
- **Token Security** - Secure authentication for remote agents
- **Health Monitoring** - Agent heartbeat and status reporting
- **Action Queue** - Centralized action management and distribution

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support or questions:
- Open an issue in the GitHub repository
- Check the project documentation
- Review the implementation summaries in the docs folder

---

**Lab Portal** - Your gateway to efficient laboratory management with style. 🚀
