import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const products = [
    {
      name: 'Premium Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 199.99,
      stock: 50,
      imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
      category: 'Electronics',
    },
    {
      name: 'Smart Fitness Watch',
      description: 'Track your fitness goals with this advanced smartwatch',
      price: 149.99,
      stock: 30,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30',
      category: 'Electronics',
    },
    {
      name: 'Minimalist Backpack',
      description: 'Stylish and durable backpack for everyday use',
      price: 79.99,
      stock: 100,
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62',
      category: 'Fashion',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: product,
    });
  }

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });