-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NewsPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'Yangilik',
    "tagColor" TEXT NOT NULL DEFAULT 'default',
    "image" INTEGER NOT NULL DEFAULT 1,
    "meta" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "externalId" TEXT,
    "publishedAt" DATETIME,
    "translated" BOOLEAN NOT NULL DEFAULT false,
    "originalTitle" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_NewsPost" ("createdAt", "excerpt", "externalId", "featured", "id", "image", "meta", "published", "publishedAt", "sourceName", "sourceUrl", "tag", "tagColor", "title", "updatedAt") SELECT "createdAt", "excerpt", "externalId", "featured", "id", "image", "meta", "published", "publishedAt", "sourceName", "sourceUrl", "tag", "tagColor", "title", "updatedAt" FROM "NewsPost";
DROP TABLE "NewsPost";
ALTER TABLE "new_NewsPost" RENAME TO "NewsPost";
CREATE UNIQUE INDEX "NewsPost_externalId_key" ON "NewsPost"("externalId");
CREATE INDEX "NewsPost_published_createdAt_idx" ON "NewsPost"("published", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

