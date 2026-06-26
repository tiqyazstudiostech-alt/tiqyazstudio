import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL  = non-pooled Neon string (required for production migrations)
    // DATABASE_URL = pooled string (fallback; fine for the initial dev migration)
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
