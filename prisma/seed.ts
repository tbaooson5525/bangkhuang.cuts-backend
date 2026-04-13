import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashed = await bcrypt.hash('0978464860', 10);
  await prisma.admin.upsert({
    where: { email: 'superAdmin@bangkhuang.cuts' },
    update: {},
    create: {
      email: 'superAdmin@bangkhuang.cuts',
      password: hashed,
    },
  });
  await prisma.businessHours.upsert({
    where: { singleton: 'singleton' },
    update: {},
    create: {
      openTime: '08:00',
      closeTime: '20:00',
      slotDuration: 60,
    },
  });

  // Working Days — mặc định T2-T7 (1-6), nghỉ CN
  await prisma.workingDay.createMany({
    data: [
      { dayOfWeek: 1 }, // T2
      { dayOfWeek: 2 }, // T3
      { dayOfWeek: 3 }, // T4
      { dayOfWeek: 4 }, // T5
      { dayOfWeek: 5 }, // T6
      { dayOfWeek: 6 }, // T7
    ],
    skipDuplicates: true,
  });
}

main().finally(() => prisma.$disconnect());
