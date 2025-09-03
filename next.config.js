/** @type {import('next').NextConfig} */

// Validate environment variables at build time
if (typeof window === 'undefined') {
  // Only run on server side - validate basic required variables
  const requiredVars = [
    'ADMIN_PASSWORD',
    'NEXTAUTH_SECRET', 
    'DATABASE_URL',
    'PUBLIC_BASE_URL'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
  
  console.log('✅ Required environment variables validated successfully')
}

const nextConfig = {
  output: 'standalone',
  images: {
    domains: [],
  },
}

module.exports = nextConfig
