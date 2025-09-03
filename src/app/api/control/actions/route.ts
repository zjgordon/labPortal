import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdminAuth, rejectAgentTokens } from '@/lib/auth';
import { createActionSchema } from '@/lib/validation';
import { getServerSession } from 'next-auth';
import { env } from '@/lib/env';
import { SystemctlExecutor } from '@/lib/control/systemctl-executor';
import { controlActionsRateLimiter } from '@/lib/rate-limiter';
import { logger } from '@/lib/logger';
import { ActionFSM } from '@/lib/control/fsm';
import {
  verifyOrigin,
  createCsrfErrorResponse,
} from '@/lib/auth/csrf-protection';
import { ResponseHelper } from '@/lib/response-helper';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const agentRejection = await rejectAgentTokens(request);
    if (agentRejection) return agentRejection;

    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    const actions = await prisma.action.findMany({
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            displayName: true,
            unitName: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    return ResponseHelper.success(actions, 'admin');
  } catch (error) {
    console.error('Failed to fetch actions:', error);
    return ResponseHelper.error('Failed to fetch actions', 'admin', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const agentRejection = await rejectAgentTokens(request);
    if (agentRejection) return agentRejection;

    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    // CSRF protection for state-changing methods
    if (!verifyOrigin(request)) {
      return createCsrfErrorResponse(request);
    }

    // Get the session to identify who requested the action
    const session = await getServerSession();
    const requestedBy = session?.user?.email || 'unknown';
    const userId = session?.user?.id || 'unknown';

    // Rate limiting check - 10 actions per minute per admin
    const rateLimitKey = `admin:${requestedBy}`;
    if (!controlActionsRateLimiter.isAllowed(rateLimitKey)) {
      const remainingTime =
        controlActionsRateLimiter.getRemainingTime(rateLimitKey);

      logger.rateLimitExceeded(rateLimitKey, '/api/control/actions', 10);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Too many control actions.',
          retryAfter: Math.ceil(remainingTime / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(remainingTime / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              Date.now() + remainingTime
            ).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const validatedData = createActionSchema.parse(body);

    // Check for idempotency key
    const idempotencyKey = request.headers.get('idempotency-key');

    if (idempotencyKey) {
      // Try to find existing action with this idempotency key
      const existingAction = await prisma.action.findUnique({
        where: { idempotencyKey },
        include: {
          host: {
            select: {
              id: true,
              name: true,
            },
          },
          service: {
            select: {
              id: true,
              displayName: true,
              unitName: true,
            },
          },
        },
      });

      if (existingAction) {
        // Return existing action (idempotent response)
        logger.securityEvent({
          event: 'action_idempotent_return',
          userId,
          userEmail: requestedBy,
          resource: 'action',
          action: 'create_action',
          success: true,
          message: `Idempotent action returned: ${existingAction.id}`,
        });

        return ResponseHelper.success(existingAction, 'admin', 200);
      }
    }

    // Verify the host exists
    const host = await prisma.host.findUnique({
      where: { id: validatedData.hostId },
    });
    if (!host) {
      logger.securityEvent({
        event: 'action_creation_failed',
        userId,
        userEmail: requestedBy,
        resource: 'host',
        action: 'create_action',
        success: false,
        message: `Host not found: ${validatedData.hostId}`,
      });

      return ResponseHelper.error('Host not found', 'admin', 404);
    }

    // Verify the service exists and belongs to the host
    const service = await prisma.managedService.findUnique({
      where: { id: validatedData.serviceId },
    });
    if (!service) {
      logger.securityEvent({
        event: 'action_creation_failed',
        userId,
        userEmail: requestedBy,
        resource: 'service',
        action: 'create_action',
        success: false,
        message: `Service not found: ${validatedData.serviceId}`,
      });

      return ResponseHelper.error('Service not found', 'admin', 404);
    }
    if (service.hostId !== validatedData.hostId) {
      logger.securityEvent({
        event: 'action_creation_failed',
        userId,
        userEmail: requestedBy,
        resource: 'service',
        action: 'create_action',
        success: false,
        message: `Service ${validatedData.serviceId} does not belong to host ${validatedData.hostId}`,
      });

      return ResponseHelper.error(
        'Service does not belong to the specified host',
        'admin',
        400
      );
    }

    // Check if the service allows this action
    const actionKey =
      `allow${validatedData.kind.charAt(0).toUpperCase() + validatedData.kind.slice(1)}` as keyof typeof service;
    if (!service[actionKey]) {
      logger.securityEvent({
        event: 'action_creation_failed',
        userId,
        userEmail: requestedBy,
        resource: 'service',
        action: 'create_action',
        success: false,
        message: `${validatedData.kind} action not allowed for service ${service.displayName}`,
      });

      return ResponseHelper.error(
        `${validatedData.kind} action not allowed for this service`,
        'admin',
        400
      );
    }

    // Create the action with idempotency key if provided
    const action = await prisma.action.create({
      data: {
        hostId: validatedData.hostId,
        serviceId: validatedData.serviceId,
        kind: validatedData.kind,
        status: validatedData.status,
        requestedBy,
        idempotencyKey: idempotencyKey || null,
      },
      include: {
        host: {
          select: {
            id: true,
            name: true,
          },
        },
        service: {
          select: {
            id: true,
            displayName: true,
            unitName: true,
          },
        },
      },
    });

    // Log action creation
    logger.actionQueued({
      actionId: action.id,
      hostId: action.hostId,
      hostName: action.host.name,
      serviceId: action.serviceId,
      serviceName: action.service.displayName,
      action: action.kind,
      status: action.status,
      requestedBy: action.requestedBy || 'unknown',
    });

    // Log security event
    logger.securityEvent({
      event: 'action_created',
      userId,
      userEmail: requestedBy,
      resource: 'action',
      action: 'create_action',
      success: true,
      message: `Action ${action.kind} created for service ${action.service.displayName} on host ${action.host.name}`,
    });

    // If this is a local action, execute it immediately
    if (validatedData.hostId === env.HOST_LOCAL_ID) {
      const startTime = Date.now();

      try {
        // Validate state transition: queued -> running
        ActionFSM.guard(action.status as any, 'running');

        // Update status to running
        await prisma.action.update({
          where: { id: action.id },
          data: {
            status: 'running',
            startedAt: new Date(),
          },
        });

        // Log action started
        logger.actionStarted({
          actionId: action.id,
          hostId: action.hostId,
          hostName: action.host.name,
          serviceId: action.serviceId,
          serviceName: action.service.displayName,
          action: action.kind,
          status: 'running',
          requestedBy: action.requestedBy || 'unknown',
        });

        // Execute the command
        const result = await SystemctlExecutor.execute(
          validatedData.kind as any,
          service.unitName,
          env.ALLOW_SYSTEMCTL
        );

        // Use the duration from the executor result, fallback to calculated duration
        const durationMs = result.durationMs || Date.now() - startTime;
        const finalStatus = result.success ? 'succeeded' : 'failed';

        // Validate state transition: running -> succeeded|failed
        ActionFSM.guard('running', finalStatus as any);

        // Update with results
        await prisma.action.update({
          where: { id: action.id },
          data: {
            status: finalStatus,
            finishedAt: new Date(),
            exitCode: result.exitCode,
            message: result.message,
          },
        });

        // Log action completion
        if (result.success) {
          logger.actionCompleted({
            actionId: action.id,
            hostId: action.hostId,
            hostName: action.host.name,
            serviceId: action.serviceId,
            serviceName: action.service.displayName,
            action: action.kind,
            status: finalStatus,
            exitCode: result.exitCode,
            durationMs,
            message: result.message,
            requestedBy: action.requestedBy || 'unknown',
          });
        } else {
          logger.actionFailed({
            actionId: action.id,
            hostId: action.hostId,
            hostName: action.host.name,
            serviceId: action.serviceId,
            serviceName: action.service.displayName,
            action: action.kind,
            status: finalStatus,
            exitCode: result.exitCode,
            durationMs,
            message: result.message,
            requestedBy: action.requestedBy || 'unknown',
          });
        }

        // Return the updated action
        const updatedAction = await prisma.action.findUnique({
          where: { id: action.id },
          include: {
            host: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                displayName: true,
                unitName: true,
              },
            },
          },
        });

        return ResponseHelper.success(updatedAction, 'admin', 201);
      } catch (executionError) {
        const durationMs = Date.now() - startTime;

        console.error('Local action execution failed:', executionError);

        // Validate state transition: running -> failed
        ActionFSM.guard('running', 'failed');

        // Update action as failed
        await prisma.action.update({
          where: { id: action.id },
          data: {
            status: 'failed',
            finishedAt: new Date(),
            exitCode: -1,
            message: `Local execution failed: ${executionError instanceof Error ? executionError.message : String(executionError)}`,
          },
        });

        // Log action failure
        logger.actionFailed({
          actionId: action.id,
          hostId: action.hostId,
          hostName: action.host.name,
          serviceId: action.serviceId,
          serviceName: action.service.displayName,
          action: action.kind,
          status: 'failed',
          exitCode: -1,
          durationMs,
          message: `Local execution failed: ${executionError instanceof Error ? executionError.message : String(executionError)}`,
          requestedBy: action.requestedBy || 'unknown',
        });

        // Return the failed action
        const failedAction = await prisma.action.findUnique({
          where: { id: action.id },
          include: {
            host: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                displayName: true,
                unitName: true,
              },
            },
          },
        });

        return ResponseHelper.success(failedAction, 'admin', 201);
      }
    }

    return ResponseHelper.success(action, 'admin', 201);
  } catch (error) {
    console.error('Failed to create action:', error);

    if (error instanceof Error && error.message.includes('validation')) {
      return ResponseHelper.error(error.message, 'admin', 400);
    }

    return ResponseHelper.error('Failed to create action', 'admin', 500);
  }
}
