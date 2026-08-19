-- CreateTable
CREATE TABLE "NewsPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT 'Yangilik',
    "tagColor" TEXT NOT NULL DEFAULT 'default',
    "image" INTEGER NOT NULL DEFAULT 1,
    "meta" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "NewsPost_published_createdAt_idx" ON "NewsPost"("published", "createdAt");
