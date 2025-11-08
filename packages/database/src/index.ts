// packages/database/src/index.ts
import { PrismaClient } from "@prisma/client";

// Properly type the global object
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["query", "error", "warn"] 
      : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Export as both named and default export
export default prisma;

// Export all Prisma types
export * from "@prisma/client";