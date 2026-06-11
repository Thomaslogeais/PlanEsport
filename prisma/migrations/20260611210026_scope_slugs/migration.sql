/*
  Warnings:

  - A unique constraint covering the columns `[gameId,slug]` on the table `competitions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[competitionId,slug]` on the table `tournaments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "competitions_slug_key";

-- DropIndex
DROP INDEX "tournaments_slug_key";

-- CreateIndex
CREATE UNIQUE INDEX "competitions_gameId_slug_key" ON "competitions"("gameId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_competitionId_slug_key" ON "tournaments"("competitionId", "slug");
