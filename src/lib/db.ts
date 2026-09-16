import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

/**
 * Jedan Prisma klijent po procesu.
 *
 * U razvoju `next dev` osvežava module pri svakoj izmeni; bez keša na
 * `globalThis` svaki refresh bi otvorio novi pool konekcija i Postgres bi
 * posle desetak izmena odbijao veze.
 *
 * Prisma 7 traži driver adapter — nema više ugrađenog Rust engine-a. Posledica
 * je da konekcijom upravlja običan `pg` pool, pa se podešava kao i svaki drugi.
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL nije postavljen. Kopiraj .env.example u .env i upiši konekcioni string.",
  );
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
