-- Migration : bio auteur personnalisable, avec modération admin (même
-- convention que pseudo/bannière : pending -> approved/rejected).
-- À exécuter une seule fois : psql $PG_URL -f app/data/migration_add_bio.sql

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "bio" TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "pending_bio" TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "bio_status" VARCHAR(20) DEFAULT 'approved';
