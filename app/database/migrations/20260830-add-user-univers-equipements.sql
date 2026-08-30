-- Phase 15 — Mécanique réelle des Univers cinématographiques : équipements
-- (Fond/Cadre par Univers) + Univers actif.
--
-- Validé par l'utilisateur (Phase 15) :
--   - Option B : table dédiée plutôt qu'un JSON opaque sur user_points.
--   - Un Fond + un Cadre équipés PAR Univers (indépendant de l'Univers actif).
--   - `active_univers_code` reste sur user_points, même pattern que
--     `active_frame_code` (système de cadre de profil, système séparé).
--
-- Ne touche à aucun schéma existant (users, recipes, movies, notices,
-- user_trophies...). N'affecte pas collection-mock.js / computeUniversState /
-- buildUnivers, qui restent le moteur pur de calcul (seuils, statuts).

CREATE TABLE IF NOT EXISTS user_univers_equipements (
  id           SERIAL PRIMARY KEY,
  id_user      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_univers VARCHAR(30) NOT NULL,
  fond_equipe  INT NULL,   -- 1 à 5 (index dans FOND_SEUILS), NULL = aucun Fond équipé
  cadre_equipe INT NULL,   -- 1 à 2 (index dans CADRE_SEUILS), NULL = aucun Cadre équipé
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (id_user, code_univers)
);
CREATE INDEX IF NOT EXISTS idx_user_univers_equipements_user_id ON user_univers_equipements(id_user);

ALTER TABLE user_points ADD COLUMN IF NOT EXISTS active_univers_code VARCHAR(30) NULL;
