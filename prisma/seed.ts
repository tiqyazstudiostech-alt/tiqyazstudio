import { PrismaClient, Role, Plan } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const GENRES = [
  { slug: "drama",               name: "Drama",                displayOrder: 1  },
  { slug: "comedy",              name: "Comedy",               displayOrder: 2  },
  { slug: "action",              name: "Action",               displayOrder: 3  },
  { slug: "thriller",            name: "Thriller",             displayOrder: 4  },
  { slug: "romance",             name: "Romance",              displayOrder: 5  },
  { slug: "documentary",         name: "Documentary",          displayOrder: 6  },
  { slug: "horror",              name: "Horror",               displayOrder: 7  },
  { slug: "sci-fi",              name: "Sci-Fi",               displayOrder: 8  },
  { slug: "fantasy",             name: "Fantasy",              displayOrder: 9  },
  { slug: "crime",               name: "Crime",                displayOrder: 10 },
  { slug: "family",              name: "Family",               displayOrder: 11 },
  { slug: "animation",           name: "Animation",            displayOrder: 12 },
  { slug: "music",               name: "Music",                displayOrder: 13 },
  { slug: "faith-inspirational", name: "Faith & Inspirational",displayOrder: 14 },
  { slug: "reality",             name: "Reality",              displayOrder: 15 },
  { slug: "nollywood",           name: "Nollywood",            displayOrder: 16 },
  { slug: "african-cinema",      name: "African Cinema",       displayOrder: 17 },
  { slug: "history",             name: "History",              displayOrder: 18 },
];

const LANGUAGES = [
  { code: "en", name: "English"  },
  { code: "sw", name: "Swahili"  },
  { code: "fr", name: "French"   },
  { code: "ar", name: "Arabic"   },
  { code: "yo", name: "Yoruba"   },
  { code: "ha", name: "Hausa"    },
  { code: "am", name: "Amharic"  },
  { code: "zu", name: "Zulu"     },
];

async function main() {
  // Genres
  for (const genre of GENRES) {
    await prisma.genre.upsert({
      where:  { slug: genre.slug },
      update: { name: genre.name, displayOrder: genre.displayOrder },
      create: genre,
    });
  }
  console.log(`Seeded ${GENRES.length} genres.`);

  // Languages
  for (const lang of LANGUAGES) {
    await prisma.language.upsert({
      where:  { code: lang.code },
      update: { name: lang.name },
      create: lang,
    });
  }
  console.log(`Seeded ${LANGUAGES.length} languages.`);

  // Admin user
  const hashedPassword = await bcrypt.hash("admin1234", 12);
  const admin = await prisma.user.upsert({
    where:  { email: "admin@tiqyaz.dev" },
    update: {},
    create: {
      email:         "admin@tiqyaz.dev",
      name:          "Tiqyaz Admin",
      hashedPassword,
      role:          Role.ADMIN,
      emailVerified: new Date(),
      profile: {
        create: { preferences: {} },
      },
    },
    include: { profile: true },
  });
  console.log(`Seeded admin user: ${admin.email} (id: ${admin.id})`);

  // Admin subscription
  await prisma.subscription.upsert({
    where:  { userId: admin.id },
    update: {},
    create: { userId: admin.id, plan: Plan.PREMIUM },
  });
  console.log("Seeded admin subscription (PREMIUM).");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
