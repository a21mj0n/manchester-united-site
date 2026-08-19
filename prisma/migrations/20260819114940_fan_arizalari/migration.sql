-- CreateTable
CREATE TABLE "FanApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "since" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "FanApplication_createdAt_idx" ON "FanApplication"("createdAt");

-- CreateIndex
CREATE INDEX "FanApplication_status_idx" ON "FanApplication"("status");
