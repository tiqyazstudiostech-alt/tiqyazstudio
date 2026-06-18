import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin1234", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@tiqyaz.dev" },
    update: {},
    create: {
      email: "admin@tiqyaz.dev",
      name: "Tiqyaz Admin",
      hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
      profile: {
        create: {
          preferences: {},
          selectedGenres: [],
        },
      },
    },
    include: { profile: true },
  });

  console.log(`Seeded admin user: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
