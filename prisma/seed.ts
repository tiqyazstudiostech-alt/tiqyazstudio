import { PrismaClient, Role, Plan, TitleType, ContentStatus, VideoStatus } from "@prisma/client";
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

  // Resolve genre/language IDs needed for content seeding
  const [drama, thriller, documentary, family] = await Promise.all([
    prisma.genre.findUniqueOrThrow({ where: { slug: "drama"         }, select: { id: true } }),
    prisma.genre.findUniqueOrThrow({ where: { slug: "thriller"      }, select: { id: true } }),
    prisma.genre.findUniqueOrThrow({ where: { slug: "documentary"   }, select: { id: true } }),
    prisma.genre.findUniqueOrThrow({ where: { slug: "family"        }, select: { id: true } }),
  ]);
  const [en, sw] = await Promise.all([
    prisma.language.findUniqueOrThrow({ where: { code: "en" }, select: { id: true } }),
    prisma.language.findUniqueOrThrow({ where: { code: "sw" }, select: { id: true } }),
  ]);

  // Seed FILM: "Nairobi Noir" — a FILM is a Title with a single Episode (no Season)
  const film = await prisma.title.upsert({
    where:  { slug: "nairobi-noir" },
    update: {},
    create: {
      type:          TitleType.FILM,
      title:         "Nairobi Noir",
      slug:          "nairobi-noir",
      synopsis:      "A detective unravels a web of corruption beneath Nairobi's glittering skyline.",
      releaseYear:   2024,
      maturityRating:"16+",
      isPremium:     false,
      status:        ContentStatus.PUBLISHED,
      genres:    { connect: [{ id: drama.id }, { id: thriller.id }] },
      languages: { connect: [{ id: en.id }, { id: sw.id }] },
    },
  });
  await prisma.episode.upsert({
    where:  { id: "seed-film-ep-1" },
    update: {},
    create: {
      id:          "seed-film-ep-1",
      titleId:     film.id,
      number:      1,
      title:       "Nairobi Noir",
      synopsis:    "Feature film.",
      status:      VideoStatus.READY,
      durationSec: 5880,
    },
  });
  console.log(`Seeded FILM: ${film.title} (id: ${film.id})`);

  // Seed SERIES: "Safari Tales" — Title + Season 1 + 2 Episodes
  const series = await prisma.title.upsert({
    where:  { slug: "safari-tales" },
    update: {},
    create: {
      type:          TitleType.SERIES,
      title:         "Safari Tales",
      slug:          "safari-tales",
      synopsis:      "Follow wildlife rangers across East Africa's most breathtaking landscapes.",
      releaseYear:   2025,
      maturityRating:"PG",
      isPremium:     true,
      status:        ContentStatus.PUBLISHED,
      genres:    { connect: [{ id: documentary.id }, { id: family.id }] },
      languages: { connect: [{ id: en.id }, { id: sw.id }] },
    },
  });
  const season1 = await prisma.season.upsert({
    where:  { id: "seed-series-s1" },
    update: {},
    create: {
      id:      "seed-series-s1",
      titleId: series.id,
      number:  1,
      name:    "Into the Wild",
    },
  });
  await prisma.episode.upsert({
    where:  { id: "seed-series-s1e1" },
    update: {},
    create: {
      id:          "seed-series-s1e1",
      titleId:     series.id,
      seasonId:    season1.id,
      number:      1,
      title:       "First Light",
      synopsis:    "Rangers prepare for a rare predator census at dawn.",
      status:      VideoStatus.READY,
      durationSec: 2700,
    },
  });
  await prisma.episode.upsert({
    where:  { id: "seed-series-s1e2" },
    update: {},
    create: {
      id:          "seed-series-s1e2",
      titleId:     series.id,
      seasonId:    season1.id,
      number:      2,
      title:       "The Migration",
      synopsis:    "Millions of wildebeest thunder across the Mara River.",
      status:      VideoStatus.READY,
      durationSec: 2820,
    },
  });
  console.log(`Seeded SERIES: ${series.title} (id: ${series.id}) — Season 1, 2 episodes.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
