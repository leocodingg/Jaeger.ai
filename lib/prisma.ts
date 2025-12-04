// PRISMA CLIENT SINGLETON
// This file creates a single Prisma client instance that's reused across the app

import { PrismaClient } from '@prisma/client';

// CONCEPT: Prevent multiple Prisma Client instances in development
// In development, Next.js hot reloads can create multiple instances
// This pattern ensures we only ever have ONE instance

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // Logs all SQL queries (helpful for learning!)
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// USAGE in other files:
// import { prisma } from '@/lib/prisma';
// const jobs = await prisma.jobApplication.findMany();
