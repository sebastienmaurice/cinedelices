-- Migration : variante de fond choisie parmi les fonds officiels du cadre équipé
-- À exécuter une seule fois : psql $PG_URL -f app/data/migration_add_banner_variant.sql

-- NULL = pas de choix explicite -> 1re variante du cadre équipé par défaut
ALTER TABLE "user_points"
  ADD COLUMN IF NOT EXISTS "active_banner_variant" INTEGER DEFAULT NULL;
