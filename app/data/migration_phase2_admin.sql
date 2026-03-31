-- ============================================================
-- Migration Phase 2 — Admin interface refactor
-- Ciné Délices — 2026-03-29
-- Exécuter : psql $PG_URL -f app/data/migration_phase2_admin.sql
-- ============================================================

-- Films : masquage éditorial (hors modération)
ALTER TABLE "movies"
  ADD COLUMN IF NOT EXISTS "hidden" BOOLEAN NOT NULL DEFAULT FALSE;

-- Utilisateurs : suspension temporaire
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "suspended"          BOOLEAN   NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "suspended_until"    TIMESTAMP          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS "suspension_reason"  TEXT               DEFAULT NULL;

-- Photos de recettes : statut individuel (pour modération dédiée)
ALTER TABLE "recipe_pictures"
  ADD COLUMN IF NOT EXISTS "status"      VARCHAR(20) NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP            DEFAULT NULL;

-- Mettre en pending les photos de recettes dont la recette est encore en attente
UPDATE "recipe_pictures" rp
SET "status" = 'pending'
FROM "recipes" r
WHERE rp.recipe_id = r.id
  AND r.status = 'pending'
  AND rp.position > 1;

-- Journal d'actions admin
CREATE TABLE IF NOT EXISTS "admin_logs" (
  "id"          SERIAL PRIMARY KEY,
  "admin_id"    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "action"      VARCHAR(80)  NOT NULL,
  "target_type" VARCHAR(30)  DEFAULT NULL,
  "target_id"   INTEGER      DEFAULT NULL,
  "detail"      TEXT         DEFAULT NULL,
  "created_at"  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action  ON admin_logs(action);
