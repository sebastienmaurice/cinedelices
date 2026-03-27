-- Migration : colonnes gamification
-- À exécuter une seule fois : psql $PG_URL -f app/data/migration_add_gamif_columns.sql

-- Cadre actif choisi par l'utilisateur (stocké dans user_points)
ALTER TABLE "user_points"
  ADD COLUMN IF NOT EXISTS "active_frame_code" VARCHAR(20) NOT NULL DEFAULT 'cine';

-- Déblocage page auteur (niv. 5)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "author_page_unlocked" BOOLEAN NOT NULL DEFAULT FALSE;

-- Bannière personnalisée (niv. 5)
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "banner_url" VARCHAR(255) DEFAULT NULL;
