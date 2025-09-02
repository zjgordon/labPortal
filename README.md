# Lab Portal

A modern, cyberpunk-styled laboratory control panel built with Next.js 14, featuring real-time service monitoring, drag-and-drop card management, and a sleek dark theme perfect for network laboratories.

![Lab Portal](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=for-the-badge&logo=prisma)

## ✨ Features

### 🎯 Core Functionality
- **Real-time Service Monitoring** - Live status indicators for all lab tools
- **Dynamic Card Management** - Add, edit, and organize lab tool cards
- **Drag & Drop Interface** - Intuitive card reordering with instant persistence
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

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin panel routes
│   ├── api/               # API endpoints
│   └── page.tsx           # Main portal page
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── lab-card.tsx       # Lab tool card component
│   └── status-indicator.tsx # Status display component
├── lib/                    # Utilities and configurations
└── types/                  # TypeScript definitions

prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Initial data seeding
```

## 🔧 Available Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with example data

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
- **Authentication** - Secure admin access
- **XSS Protection** - Comprehensive security headers and CSP enforcement

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
- **Real-time Updates** - Status checked every 30 seconds
- **Smart Caching** - Efficient API usage with intelligent caching
- **Health Path Support** - Optional custom health check endpoints for each service
- **Enhanced Probes** - HEAD requests with GET fallback for better compatibility
- **Error Handling** - Comprehensive error detection and reporting
- **Latency Measurement** - Response time tracking for each service
- **HTTP Status Tracking** - Records last HTTP status code and response messages

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
