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
    prisma.card.create({
      data: {
        title: 'Stable Diffusion',
        description: 'AI image generation service for creating artwork and illustrations',
        url: 'http://localhost:7860',
        iconPath: '/icons/ai.svg',
        order: 1,
        isEnabled: true,
      },
    }),
    prisma.card.create({
      data: {
        title: 'Router Dashboard',
        description: 'Main network router configuration and monitoring interface',
        url: 'http://router.local',
        iconPath: '/icons/router.svg',
        order: 2,
        isEnabled: true,
      },
    }),
    prisma.card.create({
      data: {
        title: 'NAS Management',
        description: 'Network Attached Storage administration panel',
        url: 'http://nas.local:9000',
        iconPath: '/icons/nas.svg',
        order: 3,
        isEnabled: true,
      },
    }),
    prisma.card.create({
      data: {
        title: 'Git Repository',
        description: 'Self-hosted Git service for code management',
        url: 'http://gitea.local',
        iconPath: '/icons/git.svg',
        order: 4,
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
