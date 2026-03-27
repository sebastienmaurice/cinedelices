-- ============================================================
-- MIGRATION : Système de Gamification v3.0 — Ciné Délices
-- ============================================================
-- Exécuter une seule fois sur la base de production :
--   psql $PG_URL -f app/data/migration_gamification.sql
--
-- Sécurisé : CREATE TABLE IF NOT EXISTS — sans effet si déjà présent.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Points & niveau de l'utilisateur
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_points" (
    "id"          SERIAL PRIMARY KEY,
    "id_user"     INT          NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "points"      INT          NOT NULL DEFAULT 0,
    "level_code"  VARCHAR(20)  NOT NULL DEFAULT 'figurant',
    "updated_at"  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_points_user"
    ON "user_points"("id_user");

-- Ajout colonne suivi connexion hebdomadaire (idempotent)
ALTER TABLE "user_points"
    ADD COLUMN IF NOT EXISTS "last_weekly_login_at" TIMESTAMP DEFAULT NULL;

-- ------------------------------------------------------------
-- 2. Catalogue des badges Signature (table de référence)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "signature_badges" (
    "id"                  SERIAL       PRIMARY KEY,
    "code"                VARCHAR(50)  NOT NULL UNIQUE,
    "label"               VARCHAR(100) NOT NULL,
    "film"                VARCHAR(100) NOT NULL,
    "theme"               VARCHAR(50)  NOT NULL,
    "movie_slug_pattern"  VARCHAR(100) NOT NULL,   -- pattern pour ILIKE '%...'
    "sort_order"          SMALLINT     NOT NULL DEFAULT 0
);

-- Seed : 6 badges Signature au lancement (ON CONFLICT = idempotent)
INSERT INTO "signature_badges" ("code", "label", "film", "theme", "movie_slug_pattern", "sort_order") VALUES
    ('BIENVENUE', 'Bienvenue !',      'Ciné Délices',                  'Special',     '__bienvenue__',    0),
    ('STRANGE', 'Doctor Strange',    'Doctor Strange',                'Fantastique', 'doctor-strange',   1),
    ('HARRY',   'Harry Potter',      'Harry Potter',                  'Fantastique', 'harry-potter',     2),
    ('INDIANA', 'Indiana Jones',     'Indiana Jones',                 'Aventure',    'indiana-jones',    3),
    ('MATRIX',  'Matrix',            'Matrix',                        'Sci-Fi',      'matrix',           4),
    ('FREDDY',  'Freddy',            'Freddy les griffes de la nuit', 'Horreur',     'freddy',           5),
    ('READY',   'Ready Player One',  'Ready Player One',              'Cyberpunk',   'ready-player-one', 6)
ON CONFLICT ("code") DO NOTHING;

-- ------------------------------------------------------------
-- 3. Badges Signature débloqués par utilisateur
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user_signature_badges" (
    "id"           SERIAL    PRIMARY KEY,
    "id_user"      INT       NOT NULL REFERENCES "users"("id")           ON DELETE CASCADE,
    "id_badge"     INT       NOT NULL REFERENCES "signature_badges"("id") ON DELETE CASCADE,
    "unlocked_at"  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_usb_user_badge"
    ON "user_signature_badges"("id_user", "id_badge");
