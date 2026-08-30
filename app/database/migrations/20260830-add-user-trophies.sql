-- Phase 9 — Ma Collection : trophées obtenus par utilisateur.
-- Table additive uniquement — ne touche à aucun schéma existant (en
-- particulier PAS à `users` : la date d'inscription n'existe pas dans ce
-- projet, "Empreinte Éternelle" reste donc mock, hors périmètre de cette
-- migration).
--
-- Le référentiel descriptif des 18 trophées (label, image, category,
-- condition, conditionType, target, secret, xpReward) reste dans
-- MOCK_BADGES (app/utils/cinepass-mock.js) — cette table ne stocke QUE
-- l'obtention ("cet utilisateur a obtenu ce trophée à cette date"),
-- jamais les métadonnées, pour ne pas dupliquer le référentiel.
--
-- Seuls 9 des 18 `trophy_code` sont réellement vérifiés/insérés par
-- app/services/trophy.service.js à ce stade (voir Phase 9) : Ticket d'Or,
-- Empreinte Éternelle, Recette Culte, Clap d'Argent, Réalisateur du Goût,
-- Palme du Palais, Projecteur d'Or, Premier Rôle et Superstar du Palais
-- n'auront jamais de ligne créée ici tant que leurs phases respectives
-- n'auront pas été implémentées.
--
-- Idempotente (IF NOT EXISTS), même convention que les migrations de
-- démarrage déjà en place (voir app/database/migrate.js).

CREATE TABLE IF NOT EXISTS user_trophies (
  id          SERIAL PRIMARY KEY,
  id_user     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trophy_code VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (id_user, trophy_code)
);

CREATE INDEX IF NOT EXISTS idx_user_trophies_user_id ON user_trophies(id_user);
