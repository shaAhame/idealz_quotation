// server/seed.js
// Run once: node seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin
  const adminPw = await bcrypt.hash('Admin@idealz2024', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@idealz.lk' },
    update: {},
    create: { name: 'Admin', email: 'admin@idealz.lk', password: adminPw, branch: 'Prime', role: 'ADMIN' }
  });
  console.log('Admin created:', admin.email);

  // Create branch managers
  const managers = [
    { name: 'Prime Manager', email: 'prime@idealz.lk', branch: 'Prime' },
    { name: 'Marino Manager', email: 'marino@idealz.lk', branch: 'Marino' },
    { name: 'Liberty Manager', email: 'liberty@idealz.lk', branch: 'Liberty' }
  ];
  for (const m of managers) {
    const pw = await bcrypt.hash('Manager@2024', 10);
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: { ...m, password: pw, role: 'MANAGER' }
    });
    console.log('Manager created:', user.email);
  }

  // Init counter
  await prisma.counter.upsert({ where: { id: 'global' }, update: {}, create: { id: 'global', value: 0 } });

  console.log('\nDone! Login credentials:');
  console.log('Admin:   admin@idealz.lk / Admin@idealz2024');
  console.log('Prime:   prime@idealz.lk / Manager@2024');
  console.log('Marino:  marino@idealz.lk / Manager@2024');
  console.log('Liberty: liberty@idealz.lk / Manager@2024');
}

main().catch(console.error).finally(() => prisma.$disconnect());
