import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const team = await prisma.team.create({
    data: { name: 'Time Principal' },
  })

  const adminHash = await bcrypt.hash('admin123', 10)

  await prisma.user.create({
    data: {
      name: 'Admin Startsette',
      email: 'admin@startsette.com',
      password: adminHash,
      role: 'ADMIN',
      status: 'active',
      teamId: team.id,
    },
  })

  console.log('Seed concluído')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
