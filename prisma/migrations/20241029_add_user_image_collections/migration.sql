CREATE TABLE "UserPersonalCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageSetId" TEXT NOT NULL,
    "name" TEXT,
    "slug" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPersonalCollection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPersonalCollection_imageSetId_key"
    ON "UserPersonalCollection"("imageSetId");

CREATE INDEX "idx_user_personal_collection_user"
    ON "UserPersonalCollection"("userId");

ALTER TABLE "UserPersonalCollection"
    ADD CONSTRAINT "UserPersonalCollection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
