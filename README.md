# Lab Portal

A Next.js 14 application with App Router, TypeScript, Tailwind CSS, shadcn/ui components, Prisma ORM, and NextAuth authentication.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** components (Button, Card, Input, Label, Dialog, Form, Toast)
- **Prisma ORM** with SQLite database
- **NextAuth.js** with Credentials provider
- **Docker** support
- **Environment variables** support

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional)

## Setup

### Quick Setup (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd labPortal
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Manual Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd labPortal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"
   
   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
   
   # Generate a secret key with: openssl rand -base64 32
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed the database with initial data
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:seed` - Seed database with initial data
- `npm run prisma:studio` - Open Prisma Studio

### Docker Commands

- `docker-compose up --build` - Start development environment
- `docker-compose -f docker-compose.prod.yaml up -d` - Start production environment
- `docker build -f Dockerfile.prod -t lab-portal .` - Build production image

### Database Seeding

After setting up the database, seed it with initial data:

```bash
# Generate Prisma client first
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed with example lab tools
npm run prisma:seed
```

The seed script creates:
- 3 example lab tool cards (Router, NAS, Git)
- Associated status records
- Admin user setup

## Database

The application uses SQLite with Prisma ORM. The database file (`dev.db`) will be created automatically when you run the first migration.

### Default User
After seeding the database, you can log in with:
- Email: `demo@example.com`
- Password: `password`

## Environment Variables

### Required Variables

Create a `.env.local` file for development or `.env` for production:

```env
# Database Configuration
DATABASE_URL="file:./dev.db"                    # SQLite for dev
# DATABASE_URL="postgresql://user:pass@localhost:5432/labportal"  # PostgreSQL for prod

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"            # Your domain in production
NEXTAUTH_SECRET="your-secret-key-here"          # Generate with: openssl rand -base64 32

# Admin Authentication
ADMIN_PASSWORD="admin123"                        # Set strong password in production
```

### Optional Variables

```env
# Production Settings
NODE_ENV="production"
PORT="3000"
HOSTNAME="0.0.0.0"

# Rate Limiting
STATUS_RATE_LIMIT="30"                           # Requests per minute for status API
AUTH_RATE_LIMIT="5"                              # Login attempts per 15 minutes
```

## Docker

### Development (SQLite)

```bash
docker-compose up --build
```

### Production Deployment

#### Using Production Dockerfile

1. **Build the production image:**
   ```bash
   docker build -f Dockerfile.prod -t lab-portal .
   ```

2. **Run with environment variables:**
   ```bash
   docker run -d \
     --name lab-portal \
     -p 3000:3000 \
     -e DATABASE_URL="your-database-url" \
     -e NEXTAUTH_SECRET="your-secret" \
     -e ADMIN_PASSWORD="your-admin-password" \
     -e NEXTAUTH_URL="http://your-domain.com" \
     -v ./uploads:/app/public/uploads \
     lab-portal
   ```

#### Using Production Docker Compose

1. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your production values
   ```

2. **Start the service:**
   ```bash
   docker-compose -f docker-compose.prod.yaml up -d
   ```

### Production Considerations

- **Database**: Use PostgreSQL or MySQL for production
- **File Storage**: Mount `./uploads` volume for persistent icon storage
- **Reverse Proxy**: Configure Nginx/Apache for SSL termination
- **Environment**: Set `NODE_ENV=production` for optimizations

## Reverse Proxy Configuration

### Nginx Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Serve uploaded icons directly
    location /uploads/ {
        alias /path/to/your/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Apache Example

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    Redirect permanent / https://your-domain.com/
</VirtualHost>

<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /var/www/html
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    ProxyPreserveHost On
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
    
    # Serve uploaded icons
    Alias /uploads /path/to/your/uploads
    <Directory /path/to/your/uploads>
        Require all granted
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
    </Directory>
</VirtualHost>
```

## Icon Storage and File Management

### Storage Paths

- **Development**: Icons stored in `public/uploads/`
- **Production**: Mount volume to `/app/public/uploads` in container
- **URL Access**: Icons accessible at `/uploads/filename.png`

### File Validation

- **Supported Formats**: PNG, JPEG, JPG
- **Size Limit**: 2MB maximum
- **Storage**: Persistent across container restarts
- **Security**: File type validation and sanitization

### Backup Considerations

- **Database**: Regular backups of your database
- **Icons**: Backup the `uploads` directory
- **Environment**: Document all environment variables

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── auth/          # NextAuth routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
│   └── ui/                # shadcn/ui components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions
└── types/                  # TypeScript type definitions

prisma/
├── schema.prisma          # Database schema
└── seed.ts                # Database seed script
```

## Authentication

The application uses NextAuth.js with a Credentials provider. Users can sign in with email and password. The authentication is configured to work with Prisma and includes:

- Session management
- JWT tokens
- User accounts and sessions
- Protected routes (can be implemented as needed)

## Styling

The application uses Tailwind CSS with a custom design system that includes:

- CSS variables for theming
- Dark mode support
- Responsive design utilities
- Component-specific styles

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository.
