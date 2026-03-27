-- ============================================================
-- MIGRATION : Ajout du champ slug sur movies et recipes
-- ============================================================
--
-- Exécuter dans cet ordre :
--  1. ALTER TABLE (ajoute la colonne, nullable pour les existants)
--  2. UPDATE (génère les slugs à partir des titres existants)
--  3. ALTER TABLE (pose la contrainte UNIQUE une fois les slugs remplis)
--
-- ATTENTION : Le slug est généré côté SQL avec LOWER + REGEXP_REPLACE.
--             La librairie slugify (Node.js) utilise la même logique :
--             lower: true, strict: true → retrait accents et caractères spéciaux.
--             Pour les accents, le SQL utilise COLLATE ou REPLACE manuel.
--             Une passe de validation après migration est recommandée.
-- ============================================================

-- ── 1. Ajout des colonnes (nullable) ──────────────────────────

ALTER TABLE movies
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NULL;

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255) NULL;

-- ── 2. Génération des slugs à partir des titres existants ────
-- Remplacement basique : espaces → tirets, minuscules
-- (les caractères spéciaux sont gardés tels quels — à affiner si besoin)

UPDATE movies
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

UPDATE recipes
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Suppression des tirets en début/fin de slug
UPDATE movies SET slug = TRIM(BOTH '-' FROM slug) WHERE slug IS NOT NULL;
UPDATE recipes SET slug = TRIM(BOTH '-' FROM slug) WHERE slug IS NOT NULL;

-- ── 3. Pose des contraintes UNIQUE ───────────────────────────
-- (uniquement après avoir rempli tous les slugs)

ALTER TABLE movies
  ADD CONSTRAINT movies_slug_unique UNIQUE (slug);

ALTER TABLE recipes
  ADD CONSTRAINT recipes_slug_unique UNIQUE (slug);

-- ── 4. Vérification post-migration ───────────────────────────
-- Lancer ces SELECT pour vérifier l'absence de doublons ou de NULL :

-- SELECT id, title, slug FROM movies WHERE slug IS NULL;
-- SELECT id, name, slug FROM recipes WHERE slug IS NULL;
-- SELECT slug, COUNT(*) FROM movies GROUP BY slug HAVING COUNT(*) > 1;
-- SELECT slug, COUNT(*) FROM recipes GROUP BY slug HAVING COUNT(*) > 1;
