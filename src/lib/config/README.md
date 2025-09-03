# Appearance Configuration

This module provides a singleton appearance configuration system for the Lab Portal with environment variable fallbacks and in-memory caching.

## Features

- **Singleton Configuration**: Single source of truth for appearance settings
- **Database Storage**: Persistent configuration stored in Prisma database
- **Environment Fallbacks**: Graceful fallback to environment variables if database is unavailable
- **In-Memory Caching**: 30-second cache with manual invalidation support
- **Type Safety**: Full TypeScript support with proper interfaces

## Usage

### Basic Usage

```typescript
import { getAppearance } from '@/lib/config/appearance'

// Get current appearance configuration
const appearance = await getAppearance()

// Access configuration values
console.log(appearance.instanceName)    // "Lab Portal" or custom value
console.log(appearance.headerText)      // null or custom header text
console.log(appearance.theme)           // "system", "light", or "dark"
console.log(appearance.showClock)       // boolean for future clock feature
```

### Force Refresh

```typescript
// Force refresh from database (bypass cache)
const freshAppearance = await getAppearance(true)
```

### Clear Cache

```typescript
import { clearAppearanceCache } from '@/lib/config/appearance'

// Clear the in-memory cache
clearAppearanceCache()
```

## Configuration Options

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `instanceName` | string | "Lab Portal" | Display name for the portal instance |
| `headerText` | string \| null | null | Optional banner text shown in header |
| `showClock` | boolean | false | Future feature flag for clock display |
| `theme` | string | "system" | Theme preference (system/light/dark) |

## Environment Variables

The system will fall back to these environment variables if the database is unavailable:

```bash
APPEARANCE_INSTANCE_NAME="My Lab"
APPEARANCE_HEADER_TEXT="Welcome to the Home Lab"
```

## Database Schema

The configuration is stored in the `Appearance` table with a single row (id=1):

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

## Integration Example

Here's how to integrate the appearance config into a React component:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getAppearance, type AppearanceConfig } from '@/lib/config/appearance'

export function PortalHeader() {
  const [appearance, setAppearance] = useState<AppearanceConfig | null>(null)

  useEffect(() => {
    const loadAppearance = async () => {
      const config = await getAppearance()
      setAppearance(config)
    }
    
    loadAppearance()
  }, [])

  if (!appearance) return <div>Loading...</div>

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              {appearance.instanceName}
            </span>
            {appearance.headerText && (
              <span className="text-sm text-gray-600 ml-4">
                {appearance.headerText}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
```

## Caching Behavior

- **Cache Duration**: 30 seconds
- **Cache Invalidation**: Manual via `clearAppearanceCache()` or `getAppearance(true)`
- **Fallback Strategy**: Database → Environment Variables → Defaults
- **Error Handling**: Graceful degradation with console warnings

## Testing

Run the test suite to verify functionality:

```bash
npm test -- src/lib/config/__tests__/appearance.test.ts
```

The tests cover:
- Caching behavior
- Force refresh functionality
- Environment variable fallbacks
- Default value handling
- Database error scenarios
