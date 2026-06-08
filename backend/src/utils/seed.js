const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@iitroorkee.ac.in',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log('✅ Admin created:', admin.email);

  // Create regular users
  const userPassword = await bcrypt.hash('user123', 12);
  const users = await Promise.all([
    prisma.user.create({ data: { name: 'Arjun Sharma', email: 'arjun@iitroorkee.ac.in', password: userPassword, role: 'USER' } }),
    prisma.user.create({ data: { name: 'Priya Patel', email: 'priya@iitroorkee.ac.in', password: userPassword, role: 'USER' } }),
    prisma.user.create({ data: { name: 'Rahul Kumar', email: 'rahul@iitroorkee.ac.in', password: userPassword, role: 'USER' } }),
  ]);
  console.log('✅ Users created:', users.length);

  // Create assets
  const assets = await Promise.all([
    prisma.asset.create({ data: { name: 'Canon EOS 5D Mark IV', category: 'Camera', description: 'Professional DSLR camera, 30.4MP full-frame sensor', totalQuantity: 4, availableQty: 4, status: 'ACTIVE', condition: 'EXCELLENT' } }),
    prisma.asset.create({ data: { name: 'Nikon D7500', category: 'Camera', description: 'Mid-range DSLR camera, 20.9MP APS-C sensor', totalQuantity: 6, availableQty: 6, status: 'ACTIVE', condition: 'GOOD' } }),
    prisma.asset.create({ data: { name: 'Softbox Lighting Kit', category: 'Lighting', description: '3-point lighting setup with stands and diffusers', totalQuantity: 3, availableQty: 3, status: 'ACTIVE', condition: 'GOOD' } }),
    prisma.asset.create({ data: { name: 'LED Ring Light', category: 'Lighting', description: '18-inch LED ring light with phone holder', totalQuantity: 8, availableQty: 8, status: 'ACTIVE', condition: 'EXCELLENT' } }),
    prisma.asset.create({ data: { name: 'Yamaha PA System', category: 'Audio', description: '1000W powered PA system with 2 speakers', totalQuantity: 2, availableQty: 2, status: 'ACTIVE', condition: 'GOOD' } }),
    prisma.asset.create({ data: { name: 'Shure SM58 Microphone', category: 'Audio', description: 'Professional vocal microphone with XLR cable', totalQuantity: 10, availableQty: 10, status: 'ACTIVE', condition: 'GOOD' } }),
    prisma.asset.create({ data: { name: 'Traditional Costumes Set', category: 'Costumes', description: 'Set of 10 traditional Indian dance costumes', totalQuantity: 5, availableQty: 5, status: 'ACTIVE', condition: 'FAIR' } }),
    prisma.asset.create({ data: { name: 'Stage Props Collection', category: 'Props', description: 'Assorted stage props for theatrical performances', totalQuantity: 1, availableQty: 1, status: 'ACTIVE', condition: 'GOOD' } }),
    prisma.asset.create({ data: { name: 'Sony A7 III', category: 'Camera', description: 'Full-frame mirrorless camera, 24.2MP', totalQuantity: 3, availableQty: 3, status: 'ACTIVE', condition: 'EXCELLENT' } }),
    prisma.asset.create({ data: { name: 'Projector Epson EB-X51', category: 'Equipment', description: '3800 lumens XGA projector', totalQuantity: 5, availableQty: 5, status: 'ACTIVE', condition: 'GOOD' } }),
    prisma.asset.create({ data: { name: 'DJI Mavic 3 Drone', category: 'Camera', description: 'Professional aerial photography drone', totalQuantity: 2, availableQty: 2, status: 'ACTIVE', condition: 'EXCELLENT' } }),
    prisma.asset.create({ data: { name: 'Portable Recording Studio', category: 'Audio', description: 'Focusrite Scarlett + condenser mic + headphones bundle', totalQuantity: 3, availableQty: 3, status: 'ACTIVE', condition: 'GOOD' } }),
  ]);
  console.log('✅ Assets created:', assets.length);

  // Create some sample bookings
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const bookings = await Promise.all([
    prisma.booking.create({
      data: {
        userId: users[0].id,
        assetId: assets[0].id,
        quantity: 1,
        purpose: 'Photography for Thomso 2024 event coverage',
        startDate: tomorrow,
        endDate: nextWeek,
        status: 'PENDING'
      }
    }),
    prisma.booking.create({
      data: {
        userId: users[1].id,
        assetId: assets[4].id,
        quantity: 1,
        purpose: 'Cultural night audio setup for Kshitij',
        startDate: dayAfter,
        endDate: nextWeek,
        status: 'APPROVED'
      }
    }),
    prisma.booking.create({
      data: {
        userId: users[2].id,
        assetId: assets[2].id,
        quantity: 1,
        purpose: 'Studio shoot for college magazine',
        startDate: tomorrow,
        endDate: dayAfter,
        status: 'PENDING'
      }
    }),
  ]);

  // Update asset quantity for approved booking
  await prisma.asset.update({
    where: { id: assets[4].id },
    data: { availableQty: { decrement: 1 } }
  });

  console.log('✅ Sample bookings created:', bookings.length);

  // Audit logs
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'DATABASE_SEEDED',
      details: `Database seeded with ${assets.length} assets and ${users.length + 1} users`
    }
  });

  console.log('\n🎉 Seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin:  admin@iitroorkee.ac.in / admin123');
  console.log('📧 User 1: arjun@iitroorkee.ac.in / user123');
  console.log('📧 User 2: priya@iitroorkee.ac.in / user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());