import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create a demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  console.log({ user })

  // Clear existing cards and statuses
  await prisma.cardStatus.deleteMany()
  await prisma.card.deleteMany()

  // Create example lab tool cards
  const cards = await Promise.all([
    // Laboratory Tools Category
    prisma.card.create({
      data: {
        title: 'Grafana',
        description: 'Monitoring and observability platform for metrics, logs, and dashboards',
        url: 'http://grafana.example.com:3000',
        healthPath: '/api/health',
        group: 'Laboratory Tools',
        iconPath: '/icons/ai.svg',
        order: 1,
        isEnabled: true,
      },
    }),
    prisma.card.create({
      data: {
        title: 'Gitea',
        description: 'Self-hosted Git service for code management and collaboration',
        url: 'http://gitea.example.com:3000',
        healthPath: '/api/v1/version',
        group: 'Laboratory Tools',
        iconPath: '/icons/git.svg',
        order: 2,
        isEnabled: true,
      },
    }),
    // AI Tools Category
    prisma.card.create({
      data: {
        title: 'ComfyUI',
        description: 'Advanced AI image generation interface with node-based workflow editor',
        url: 'http://comfyui.example.com:8188',
        healthPath: '/system_stats',
        group: 'AI Tools',
        iconPath: '/icons/ai.svg',
        order: 1,
        isEnabled: true,
      },
    }),
    prisma.card.create({
      data: {
        title: 'OogaBooga',
        description: 'Text generation AI interface for running large language models locally',
        url: 'http://oogabooga.example.com:7860',
        healthPath: '/api/v1/model',
        group: 'AI Tools',
        iconPath: '/icons/ai.svg',
        order: 2,
        isEnabled: true,
      },
    }),
  ])

  console.log('Created cards:', cards)

  // Create initial status records for each card
  const statuses = await Promise.all(
    cards.map(card =>
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
  )

  console.log('Created statuses:', statuses)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
