CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE "User"
  ADD COLUMN "extensionToken" UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE "User" ADD CONSTRAINT "User_extensionToken_key" UNIQUE ("extensionToken");
