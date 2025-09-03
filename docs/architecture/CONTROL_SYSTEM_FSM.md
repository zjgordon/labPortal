# Control System FSM and Idempotency

## Overview

This document describes the implementation of consistent state transitions and deduplication for the Lab Portal control system. The system now includes a Finite State Machine (FSM) for safe action state transitions and idempotency support to prevent duplicate actions.

## Finite State Machine (FSM)

### Location
`src/lib/control/fsm.ts`

### Purpose
The FSM ensures that actions follow a strict, predictable lifecycle and prevents invalid state transitions that could lead to data corruption or inconsistent behavior.

### State Transitions

```
queued → running → succeeded
         ↓
         failed
```

**Valid Transitions:**
- `queued` → `running` - Action started execution
- `running` → `succeeded` - Action completed successfully  
- `running` → `failed` - Action failed during execution

**Invalid Transitions (Guarded):**
- `queued` → `succeeded` ❌
- `queued` → `failed` ❌
- `running` → `queued` ❌
- `succeeded` → `running` ❌
- `failed` → `running` ❌

### FSM Implementation

```typescript
export class ActionFSM {
  private static readonly VALID_TRANSITIONS: StateTransition[] = [
    { from: 'queued', to: 'running', description: 'Action started execution' },
    { from: 'running', to: 'succeeded', description: 'Action completed successfully' },
    { from: 'running', to: 'failed', description: 'Action failed during execution' }
  ]

  // Guard function to validate state transitions
  static guard(from: ActionStatus, to: ActionStatus): void {
    if (!this.isValidTransition(from, to)) {
      const validTargets = this.getValidTargets(from) || []
      throw new Error(
        `Invalid state transition: ${from} -> ${to}. ` +
        `Valid transitions from '${from}': ${validTargets.join(', ')}`
      )
    }
  }
}
```

### Usage Examples

```typescript
import { ActionFSM } from '@/lib/control/fsm'

// Validate a state transition
try {
  ActionFSM.guard('queued', 'running')  // ✅ Valid
  ActionFSM.guard('running', 'succeeded') // ✅ Valid
  ActionFSM.guard('queued', 'succeeded') // ❌ Throws error
} catch (error) {
  console.error('Invalid transition:', error.message)
}

// Check if transition is valid
const canStart = ActionFSM.isValidTransition('queued', 'running') // true
const canComplete = ActionFSM.isValidTransition('running', 'succeeded') // true
const invalid = ActionFSM.isValidTransition('queued', 'succeeded') // false
```

## Idempotency Support

### Location
`POST /api/control/actions`

### Purpose
Idempotency ensures that duplicate requests for the same action return the existing action instead of creating a new one. This prevents duplicate work and maintains consistency.

### Implementation

#### 1. Idempotency Key Header
Actions can include an `Idempotency-Key` header:

```bash
curl -X POST "http://localhost:3000/api/control/actions" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Idempotency-Key: start-nginx-2025-09-03" \
  -H "Content-Type: application/json" \
  -d '{
    "hostId": "host-123",
    "serviceId": "service-456", 
    "kind": "start"
  }'
```

#### 2. Database Schema
The `Action` model includes an `idempotencyKey` field:

```prisma
model Action {
  id              String   @id @default(cuid())
  hostId          String
  serviceId       String
  kind            String
  status          String   @default("queued")
  requestedBy     String?
  requestedAt     DateTime @default(now())
  startedAt       DateTime?
  finishedAt      DateTime?
  exitCode        Int?
  message         String?
  idempotencyKey  String?  @unique  // ← New field
  host            Host     @relation(fields: [hostId], references: [id])
  service         ManagedService @relation(fields: [serviceId], references: [id])
  @@index([hostId, status])
}
```

#### 3. Idempotency Logic

```typescript
// Check for idempotency key
const idempotencyKey = request.headers.get('idempotency-key')

if (idempotencyKey) {
  // Try to find existing action with this idempotency key
  const existingAction = await prisma.action.findUnique({
    where: { idempotencyKey },
    include: { host: true, service: true }
  })

  if (existingAction) {
    // Return existing action (idempotent response)
    return NextResponse.json(existingAction, { status: 200 })
  }
}

// Create new action with idempotency key
const action = await prisma.action.create({
  data: {
    hostId: validatedData.hostId,
    serviceId: validatedData.serviceId,
    kind: validatedData.kind,
    status: validatedData.status,
    requestedBy,
    idempotencyKey: idempotencyKey || null,
  },
  include: { host: true, service: true }
})
```

### Idempotency Benefits

1. **Duplicate Prevention**: Multiple identical requests return the same action
2. **Network Resilience**: Retries don't create duplicate actions
3. **Consistency**: Same request always produces same result
4. **Audit Trail**: Clear tracking of action creation vs. retrieval

## State Transition Validation

### Where Applied

#### 1. Action Creation (Local Execution)
```typescript
// Validate state transition: queued -> running
ActionFSM.guard(action.status as any, 'running')

// Update status to running
await prisma.action.update({
  where: { id: action.id },
  data: { 
    status: 'running',
    startedAt: new Date(),
  },
})

// Later: validate state transition: running -> succeeded|failed
ActionFSM.guard('running', finalStatus as any)
```

#### 2. Agent Reporting
```typescript
// Validate state transition using FSM
try {
  ActionFSM.guard(action.status as any, validatedData.status)
} catch (fsmError) {
  return NextResponse.json(
    { 
      error: 'Invalid state transition',
      details: fsmError instanceof Error ? fsmError.message : 'Unknown FSM error',
      currentStatus: action.status,
      requestedStatus: validatedData.status
    },
    { status: 400 }
  )
}
```

#### 3. Queue Action Locking
```typescript
// Validate state transitions using FSM before locking
for (const action of queuedActions) {
  try {
    ActionFSM.guard(action.status as any, 'running')
  } catch (fsmError) {
    throw new Error(`Cannot lock action ${action.id}: ${fsmError instanceof Error ? fsmError.message : 'Invalid state transition'}`)
  }
}
```

### Error Handling

When invalid transitions are attempted, the system returns clear error messages:

```json
{
  "error": "Invalid state transition",
  "details": "Invalid state transition: queued -> succeeded. Valid transitions from 'queued': running",
  "currentStatus": "queued",
  "requestedStatus": "succeeded"
}
```

## Utility Functions

### ActionStateUtils

```typescript
export const ActionStateUtils = {
  // Check if action can be started
  canStart: (currentStatus: ActionStatus): boolean => 
    ActionFSM.isValidTransition(currentStatus, 'running'),

  // Check if action can be completed
  canComplete: (currentStatus: ActionStatus): boolean => 
    currentStatus === 'running',

  // Check if state is final
  isFinal: (status: ActionStatus): boolean => 
    ActionFSM.isTerminal(status),

  // Check if state is active
  isActive: (status: ActionStatus): boolean => 
    !ActionFSM.isTerminal(status),

  // Get next possible states
  getNextStates: (currentStatus: ActionStatus): ActionStatus[] => 
    ActionFSM.getValidTargets(currentStatus)
}
```

### Usage Examples

```typescript
import { ActionStateUtils } from '@/lib/control/fsm'

// Check action capabilities
const canStart = ActionStateUtils.canStart('queued') // true
const canComplete = ActionStateUtils.canComplete('running') // true
const isFinal = ActionStateUtils.isFinal('succeeded') // true

// Get next possible states
const nextStates = ActionStateUtils.getNextStates('running') // ['succeeded', 'failed']
```

## Testing

### Test Coverage
Comprehensive unit tests validate:

- ✅ Valid state transitions
- ✅ Invalid state transition rejection
- ✅ State utility functions
- ✅ Sequence validation
- ✅ Edge case handling
- ✅ Error message clarity

### Running Tests
```bash
npm test -- src/lib/control/__tests__/fsm.test.ts
```

## Migration and Deployment

### Database Migration
The idempotency key field requires a database migration:

```sql
-- Add idempotencyKey field to Action table
ALTER TABLE "Action" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Action_idempotencyKey_key" ON "Action"("idempotencyKey");
```

### Prisma Client Regeneration
After schema changes:
```bash
npx prisma generate
```

## Best Practices

### For Developers

1. **Always Use FSM Guards**: Never update action status without FSM validation
2. **Include Idempotency Keys**: Use meaningful keys for important actions
3. **Handle FSM Errors**: Provide clear error messages for invalid transitions
4. **Test State Transitions**: Validate all possible state sequences

### For Administrators

1. **Monitor Invalid Transitions**: Log and alert on FSM validation failures
2. **Use Idempotency Keys**: Implement consistent key generation strategies
3. **Audit Action History**: Track action creation vs. idempotent retrieval

### For Agents

1. **Respect State Transitions**: Only report valid status changes
2. **Handle FSM Errors**: Implement proper error handling for invalid transitions
3. **Use Consistent Reporting**: Maintain proper action lifecycle

## Future Enhancements

1. **State Machine Visualization**: Web UI for viewing valid transitions
2. **Transition History**: Track all state changes with timestamps
3. **Custom State Machines**: Support for different action types
4. **State Machine Validation**: Runtime validation of state machine definitions
5. **Transition Hooks**: Pre/post transition callbacks
6. **State Machine Persistence**: Save and restore state machine state
