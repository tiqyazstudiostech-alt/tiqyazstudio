-- CreateEnum
CREATE TYPE "TitleType" AS ENUM ('FILM', 'SERIES', 'PODCAST');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('PROCESSING', 'READY', 'ERROR');

-- CreateTable
CREATE TABLE "titles" (
    "id" TEXT NOT NULL,
    "type" "TitleType" NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "synopsis" TEXT,
    "release_year" INTEGER,
    "maturity_rating" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "poster_url" TEXT,
    "backdrop_url" TEXT,
    "trailer_url" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "titles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" TEXT NOT NULL,
    "title_id" TEXT NOT NULL,
    "season_id" TEXT,
    "number" INTEGER NOT NULL,
    "title" TEXT,
    "synopsis" TEXT,
    "bunny_video_id" TEXT,
    "status" "VideoStatus" NOT NULL DEFAULT 'PROCESSING',
    "duration_sec" INTEGER,
    "thumbnail_url" TEXT,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TitleGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TitleGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TitleLanguages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TitleLanguages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CollectionTitles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CollectionTitles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "titles_slug_key" ON "titles"("slug");

-- CreateIndex
CREATE INDEX "titles_status_idx" ON "titles"("status");

-- CreateIndex
CREATE INDEX "episodes_title_id_idx" ON "episodes"("title_id");

-- CreateIndex
CREATE INDEX "episodes_bunny_video_id_idx" ON "episodes"("bunny_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "collections"("slug");

-- CreateIndex
CREATE INDEX "_TitleGenres_B_index" ON "_TitleGenres"("B");

-- CreateIndex
CREATE INDEX "_TitleLanguages_B_index" ON "_TitleLanguages"("B");

-- CreateIndex
CREATE INDEX "_CollectionTitles_B_index" ON "_CollectionTitles"("B");

-- AddForeignKey
ALTER TABLE "watch_events" ADD CONSTRAINT "watch_events_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watch_events" ADD CONSTRAINT "watch_events_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_title_id_fkey" FOREIGN KEY ("title_id") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TitleGenres" ADD CONSTRAINT "_TitleGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TitleGenres" ADD CONSTRAINT "_TitleGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TitleLanguages" ADD CONSTRAINT "_TitleLanguages_A_fkey" FOREIGN KEY ("A") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TitleLanguages" ADD CONSTRAINT "_TitleLanguages_B_fkey" FOREIGN KEY ("B") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionTitles" ADD CONSTRAINT "_CollectionTitles_A_fkey" FOREIGN KEY ("A") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CollectionTitles" ADD CONSTRAINT "_CollectionTitles_B_fkey" FOREIGN KEY ("B") REFERENCES "titles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
