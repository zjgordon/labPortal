# Fresh Clone Setup Checklist

This checklist ensures a brand-new checkout of the Lab Portal project can boot cleanly without any issues.

## Prerequisites

- **Node.js**: Version 20.x (see [.nvmrc](../../.nvmrc) if available)
- **npm**: Version 8.x or higher
- **Git**: For cloning the repository

## Step-by-Step Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd labPortal
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit .env with minimal required values
# At minimum, you need:
# - DATABASE_URL (SQLite file path)
# - NEXTAUTH_SECRET (any random string)
# - ADMIN_PASSWORD (your admin password)
```

**Minimal .env example:**

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
ADMIN_PASSWORD="your-admin-password"
PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Clean Installation

```bash
# Run the reset:clean script to ensure clean state
npm run reset:clean
```

This script will:

- Remove `node_modules/` directory
- Remove `prisma/dev.db` (SQLite database)
- Run `npm ci` for clean dependency installation
- Generate Prisma client with `npx prisma generate`
- Deploy database migrations with `npx prisma migrate deploy`

### 4. Verify Installation

```bash
# Check if everything is working
npm run typecheck
npm run lint
npm test
```

### 5. Start Development Server

```bash
npm run dev
```

The application should now be accessible at `http://localhost:3000`

## Troubleshooting

### Common Issues

#### Database Connection Errors

- Ensure `DATABASE_URL` in `.env` points to a valid path
- Check that the `prisma/` directory exists
- Verify migrations are present in `prisma/migrations/`

#### Prisma Generation Issues

- Ensure all dependencies are properly installed
- Check that `@prisma/client` is in package.json
- Verify Prisma schema file exists at `prisma/schema.prisma`

#### Environment Variable Issues

- Ensure `.env` file exists in the root directory
- Check that all required variables are set
- Verify no extra spaces or quotes around values

#### Node Modules Issues

- Delete `node_modules/` and `package-lock.json`
- Run `npm install` or `npm ci`
- Check for Node.js version compatibility

### Reset Commands

If you encounter issues, you can reset to a clean state:

```bash
# Full reset (removes everything and reinstalls)
npm run reset:clean

# Partial reset (just reinstall dependencies)
rm -rf node_modules package-lock.json
npm install

# Database reset only
rm -f prisma/dev.db
npx prisma migrate deploy
```

## Verification Checklist

- [ ] Repository cloned successfully
- [ ] `.env` file created from `env.example`
- [ ] Required environment variables set
- [ ] `npm run reset:clean` completes without errors
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run dev` starts successfully
- [ ] Application accessible at `http://localhost:3000`
- [ ] Admin panel accessible with configured password

## Next Steps

After successful setup:

1. **Configure Services**: Add your lab tools and services
2. **Set Up Hosts**: Configure infrastructure hosts if using remote agents
3. **Customize Appearance**: Modify instance name and header text
4. **Review Security**: Ensure proper authentication and access controls

## Support

If you encounter issues not covered in this checklist:

- Check the [main documentation](../index.md)
- Review [API documentation](../api/)
- Open an issue in the GitHub repository
- Check the [project status](../../PROJECT_STATUS.md) for known issues
