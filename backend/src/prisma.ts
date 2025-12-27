import { PrismaClient } from "../generated/prisma";

// Use a typed slot on globalThis to avoid multiple PrismaClient instances in dev
type GlobalForPrisma = {
  prisma?: PrismaClient
}

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

// Create Prisma client with proper configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  errorFormat: "pretty",
});

// Ensure connection on first use
prisma.$connect().catch((err) => {
  console.error("Failed to connect to database:", err);
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
