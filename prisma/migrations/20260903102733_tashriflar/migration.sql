-- CreateTable
CREATE TABLE "Visit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "visitor" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1
);

-- CreateIndex
CREATE INDEX "Visit_day_idx" ON "Visit"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_day_visitor_path_key" ON "Visit"("day", "visitor", "path");
