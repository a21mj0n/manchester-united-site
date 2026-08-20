-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN "externalId" TEXT;
ALTER TABLE "NewsPost" ADD COLUMN "publishedAt" DATETIME;
ALTER TABLE "NewsPost" ADD COLUMN "sourceName" TEXT;
ALTER TABLE "NewsPost" ADD COLUMN "sourceUrl" TEXT;

-- CreateTable
CREATE TABLE "Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiId" INTEGER NOT NULL,
    "num" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "pos" TEXT NOT NULL,
    "posName" TEXT NOT NULL,
    "age" INTEGER,
    "photo" TEXT,
    "country" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Match" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "extId" TEXT NOT NULL,
    "kickoff" DATETIME NOT NULL,
    "homeTeam" TEXT NOT NULL,
    "awayTeam" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "competition" TEXT NOT NULL,
    "venue" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StandingRow" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "season" TEXT NOT NULL,
    "pos" INTEGER NOT NULL,
    "team" TEXT NOT NULL,
    "played" INTEGER NOT NULL,
    "won" INTEGER NOT NULL,
    "drawn" INTEGER NOT NULL,
    "lost" INTEGER NOT NULL,
    "gd" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "isUnited" BOOLEAN NOT NULL DEFAULT false,
    "isPreviousSeason" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "ok" BOOLEAN NOT NULL DEFAULT false,
    "details" TEXT NOT NULL DEFAULT ''
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_apiId_key" ON "Player"("apiId");

-- CreateIndex
CREATE INDEX "Player_pos_num_idx" ON "Player"("pos", "num");

-- CreateIndex
CREATE UNIQUE INDEX "Match_extId_key" ON "Match"("extId");

-- CreateIndex
CREATE INDEX "Match_kickoff_idx" ON "Match"("kickoff");

-- CreateIndex
CREATE INDEX "StandingRow_season_pos_idx" ON "StandingRow"("season", "pos");

-- CreateIndex
CREATE UNIQUE INDEX "StandingRow_season_team_key" ON "StandingRow"("season", "team");

-- CreateIndex
CREATE INDEX "SyncLog_startedAt_idx" ON "SyncLog"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_externalId_key" ON "NewsPost"("externalId");

