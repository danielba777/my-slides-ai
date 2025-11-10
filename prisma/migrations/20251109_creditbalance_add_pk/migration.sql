-- 1) neue Spalte optional hinzufügen (zunächst NULL erlaubt)
ALTER TABLE "CreditBalance" ADD COLUMN IF NOT EXISTS "id" text;

-- 2) Duplikate pro userId entfernen (neueste behalten)
DELETE FROM "CreditBalance"
WHERE ctid IN (
  SELECT ctid
  FROM (
    SELECT ctid,
           ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "updatedAt" DESC NULLS LAST) AS rn
    FROM "CreditBalance"
  ) t
  WHERE t.rn > 1
);

-- 3) jede verbleibende Zeile mit einer ID befüllen (extensionsfrei)
UPDATE "CreditBalance"
SET "id" = md5(random()::text || clock_timestamp()::text)
WHERE "id" IS NULL;

-- 4) Primary Key von (alt) auf "id" umhängen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CreditBalance_pkey') THEN
    ALTER TABLE "CreditBalance" DROP CONSTRAINT "CreditBalance_pkey";
  END IF;
END$$;

ALTER TABLE "CreditBalance" ADD CONSTRAINT "CreditBalance_pkey" PRIMARY KEY ("id");

-- 5) userId-Unique sauber setzen (stabiler Name)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uniq_creditbalance_user') THEN
    ALTER TABLE "CreditBalance" ADD CONSTRAINT "uniq_creditbalance_user" UNIQUE ("userId");
  END IF;
END$$;