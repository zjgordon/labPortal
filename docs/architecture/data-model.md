# Data Model

This document describes the database schema and data models for the Lab Portal.

## Database Schema

The Lab Portal uses SQLite as its database with Prisma as the ORM. The schema is defined in `prisma/schema.prisma`.

## Core Models

### Card

Represents lab tool cards displayed on the portal homepage.

**Key Fields:**

- `id`: Unique identifier
- `title`: Card title
- `description`: Card description
- `url`: Target URL for the tool
- `isEnabled`: Whether the card is visible
- `order`: Display order within groups
- `group`: Grouping for organization

**Relationships:**

- Has one `CardStatus` (current status)
- Has many `StatusEvent` (status history)
- Has many `ManagedService` (linked services)

### CardStatus

Tracks the current status of each card.

**Key Fields:**

- `cardId`: Reference to Card
- `isUp`: Whether the service is responding
- `lastChecked`: Last status check timestamp
- `failCount`: Number of consecutive failures
- `nextCheckAt`: Scheduled next check time

### StatusEvent

Immutable history of status changes for audit and analytics.

**Key Fields:**

- `cardId`: Reference to Card
- `timestamp`: When the status was recorded
- `isUp`: Status at that time
- `http`: HTTP status code if applicable
- `latencyMs`: Response time in milliseconds

### Action

Tracks service control actions (start/stop/restart).

**Key Fields:**

- `hostId`: Target host for the action
- `serviceId`: Target service
- `kind`: Action type (start/stop/restart)
- `status`: Current status (queued/running/completed/failed)
- `idempotencyKey`: Prevents duplicate actions

### Host

Represents infrastructure hosts that can run services.

**Key Fields:**

- `name`: Host identifier
- `address`: Network address
- `agentTokenHash`: Secure token for agent communication
- `lastSeenAt`: Last agent heartbeat

### ManagedService

Systemd services that can be controlled by the portal.

**Key Fields:**

- `hostId`: Host running the service
- `unitName`: Systemd unit name
- `displayName`: Human-readable name
- `allowStart/Stop/Restart`: Permission flags

## Database Indexes

The following indexes are defined to optimize hot queries:

### Card Indexes

```prisma
@@index([isEnabled, order])
```

**Purpose**: Optimizes queries for fetching enabled cards in display order. This is a hot query used on every homepage load to show the portal cards.

### Action Indexes

```prisma
@@index([hostId, status])
```

**Purpose**: Optimizes queries for finding pending actions for specific hosts. Used by agents to efficiently poll for new work and by the admin interface to show action status.

### StatusEvent Indexes

```prisma
@@index([cardId, timestamp])
```

**Purpose**: Optimizes queries for fetching status history for specific cards. Used for generating sparkline charts and status analytics, which are frequently accessed.

## Index Strategy

These indexes are strategically placed to support the most common query patterns:

1. **Homepage Performance**: Card index ensures fast loading of the main portal interface
2. **Agent Efficiency**: Action index allows agents to quickly find pending work
3. **Analytics Performance**: StatusEvent index enables fast historical data retrieval for charts and reports

## Migration Status

All required indexes are currently implemented and the database schema is up to date. No additional migrations are needed.

## Performance Considerations

- Indexes are automatically maintained by SQLite
- Composite indexes support the most common query patterns
- StatusEvent table uses timestamp-based queries for efficient time-range filtering
- Action table supports efficient host-specific work distribution

For schema changes, run `npx prisma migrate dev` to generate and apply new migrations.
