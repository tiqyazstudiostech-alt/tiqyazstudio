import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient() {
  const adapter = new PrismaPg(process.env.DATABASE_URL!);
  return new PrismaClient({ adapter });
}

// In production, always create fresh. In dev, cache on globalThis but only
// if the cached instance actually has the current model delegates.
export const db: PrismaClient = (() => {
  if (process.env.NODE_ENV === "production") return createClient();
  if (!global.__prisma || !("title" in global.__prisma)) {
    global.__prisma = createClient();
  }
  return global.__prisma;
})();
