-- AlterTable: football-data.org identifikatori
ALTER TABLE "Player" ADD COLUMN "fdId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Player_fdId_key" ON "Player"("fdId");
