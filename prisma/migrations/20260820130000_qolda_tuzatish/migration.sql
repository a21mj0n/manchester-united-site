-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "apiId" INTEGER,
    "num" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "pos" TEXT NOT NULL,
    "posName" TEXT NOT NULL,
    "age" INTEGER,
    "photo" TEXT,
    "country" TEXT,
    "isAcademy" BOOLEAN NOT NULL DEFAULT false,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "academyOverride" BOOLEAN,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Player" ("age", "apiId", "country", "id", "isAcademy", "name", "num", "photo", "pos", "posName", "updatedAt") SELECT "age", "apiId", "country", "id", "isAcademy", "name", "num", "photo", "pos", "posName", "updatedAt" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE UNIQUE INDEX "Player_apiId_key" ON "Player"("apiId");
CREATE INDEX "Player_pos_num_idx" ON "Player"("pos", "num");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

