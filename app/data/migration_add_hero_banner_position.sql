-- Migration : position verticale personnalisée du hero banner (page auteur)
-- Pourcentage object-position vertical (0 = haut de l'image, 100 = bas),
-- NULL = pas de préférence -> comportement par défaut (CSS "center bottom").
-- À exécuter une seule fois : psql $PG_URL -f app/data/migration_add_hero_banner_position.sql

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "hero_banner_pos_y" INTEGER DEFAULT NULL;
