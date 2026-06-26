-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ONBOARDING_COMPLETED', 'PLAY_START', 'PLAY_PROGRESS', 'PLAY_COMPLETE', 'PLAY_ABANDON', 'SKIP', 'LIKE', 'DISLIKE', 'WATCHLIST_ADD', 'WATCHLIST_REMOVE', 'SEARCH', 'SEARCH_NO_RESULTS');

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "selected_genres",
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "watch_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title_id" TEXT,
    "episode_id" TEXT,
    "type" "EventType" NOT NULL,
    "value" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watch_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfileGenres" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfileGenres_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProfileLanguages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfileLanguages_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "genres_slug_key" ON "genres"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "languages_code_key" ON "languages"("code");

-- CreateIndex
CREATE INDEX "watch_events_user_id_type_idx" ON "watch_events"("user_id", "type");

-- CreateIndex
CREATE INDEX "watch_events_title_id_idx" ON "watch_events"("title_id");

-- CreateIndex
CREATE INDEX "_ProfileGenres_B_index" ON "_ProfileGenres"("B");

-- CreateIndex
CREATE INDEX "_ProfileLanguages_B_index" ON "_ProfileLanguages"("B");

-- AddForeignKey
ALTER TABLE "watch_events" ADD CONSTRAINT "watch_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileGenres" ADD CONSTRAINT "_ProfileGenres_A_fkey" FOREIGN KEY ("A") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileGenres" ADD CONSTRAINT "_ProfileGenres_B_fkey" FOREIGN KEY ("B") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileLanguages" ADD CONSTRAINT "_ProfileLanguages_A_fkey" FOREIGN KEY ("A") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfileLanguages" ADD CONSTRAINT "_ProfileLanguages_B_fkey" FOREIGN KEY ("B") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
