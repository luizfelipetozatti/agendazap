import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Re-export Prisma enums explicitly (tsup may not handle `export *` for enums)
export { UserRole, BookingStatus } from "@prisma/client";

// Re-export all Prisma types
export type { Prisma, User, Organization, OrganizationMember, Service, Booking } from "@prisma/client";
