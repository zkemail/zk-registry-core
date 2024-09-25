// prisma/init.js

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

async function initDb() {
  try {
    await prisma.$connect();
    console.log('Database connection established');

    // The table will be automatically created when you run prisma migrate
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize db:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initDb();
