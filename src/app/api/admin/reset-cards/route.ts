import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify origin for CSRF protection
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && !origin.includes(host || '')) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Invalid origin' },
        { status: 403 }
      );
    }

    // Clear existing data in the correct order
    await prisma.action.deleteMany();
    await prisma.managedService.deleteMany();
    await prisma.statusEvent.deleteMany();
    await prisma.cardStatus.deleteMany();
    await prisma.card.deleteMany();

    // Create the eight seed cards
    const cards = await Promise.all([
      // AI Tools Category
      prisma.card.create({
        data: {
          title: 'ComfyUI',
          description:
            'Advanced AI image generation interface with node-based workflow editor',
          url: 'http://comfyui.example.com:8188',
          healthPath: '/system_stats',
          group: 'AI Tools',
          iconPath: '/icons/comfyui.svg',
          order: 1,
          isEnabled: true,
        },
      }),
      prisma.card.create({
        data: {
          title: 'SD Forge',
          description:
            'Stable Diffusion Webui Forge - Advanced AI image generation with enhanced features',
          url: 'http://sd-forge.example.com:7860',
          healthPath: '/api/v1/model',
          group: 'AI Tools',
          iconPath: '/icons/sd-forge.svg',
          order: 2,
          isEnabled: true,
        },
      }),
      prisma.card.create({
        data: {
          title: 'OogaBooga',
          description:
            'Text generation AI interface for running large language models locally',
          url: 'http://oogabooga.example.com:7860',
          healthPath: '/api/v1/model',
          group: 'AI Tools',
          iconPath: '/icons/oogabooga.svg',
          order: 3,
          isEnabled: true,
        },
      }),
      prisma.card.create({
        data: {
          title: 'SillyTavern',
          description:
            'Advanced AI character chat interface with extensive customization options',
          url: 'http://sillytavern.example.com:8000',
          healthPath: '/api/status',
          group: 'AI Tools',
          iconPath: '/icons/sillytavern.svg',
          order: 4,
          isEnabled: true,
        },
      }),
      // Laboratory Tools Category
      prisma.card.create({
        data: {
          title: 'Grafana',
          description:
            'Monitoring and observability platform for metrics, logs, and dashboards',
          url: 'http://grafana.example.com:3000',
          healthPath: '/api/health',
          group: 'Laboratory Tools',
          iconPath: '/icons/grafana.svg',
          order: 1,
          isEnabled: true,
        },
      }),
      prisma.card.create({
        data: {
          title: 'Portainer',
          description:
            'Lightweight Docker management UI for container orchestration',
          url: 'http://portainer.example.com:9000',
          healthPath: '/api/status',
          group: 'Laboratory Tools',
          iconPath: '/icons/portainer.svg',
          order: 2,
          isEnabled: true,
        },
      }),
      prisma.card.create({
        data: {
          title: 'Gitea',
          description:
            'Self-hosted Git service for code management and collaboration',
          url: 'http://gitea.example.com:3000',
          healthPath: '/api/v1/version',
          group: 'Laboratory Tools',
          iconPath: '/icons/git.svg',
          order: 3,
          isEnabled: true,
        },
      }),
      prisma.card.create({
        data: {
          title: 'OwnCloud',
          description:
            'Self-hosted file sync and share platform for secure data management',
          url: 'http://owncloud.example.com:8080',
          healthPath: '/status.php',
          group: 'Laboratory Tools',
          iconPath: '/icons/owncloud.svg',
          order: 4,
          isEnabled: true,
        },
      }),
    ]);

    // Create initial status records for each card
    await Promise.all(
      cards.map((card) =>
        prisma.cardStatus.create({
          data: {
            cardId: card.id,
            isUp: false,
            lastChecked: null,
            lastHttp: null,
            latencyMs: null,
            message: 'Not yet checked',
            failCount: 0,
            nextCheckAt: null,
          },
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Cards reset to seed data successfully',
      data: {
        cardsCreated: cards.length,
        categories: ['AI Tools', 'Laboratory Tools'],
      },
    });
  } catch (error) {
    console.error('Error resetting cards:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to reset cards to seed data',
      },
      { status: 500 }
    );
  }
}
