CREATE TABLE "UserImageCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageSetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserImageCollection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserImageCollection_imageSetId_key"
    ON "UserImageCollection"("imageSetId");

CREATE INDEX "UserImageCollection_userId_idx"
    ON "UserImageCollection"("userId");

ALTER TABLE "UserImageCollection"
    ADD CONSTRAINT "UserImageCollection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
