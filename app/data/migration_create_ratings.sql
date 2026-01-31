-- ============================================================
-- Migration : Création de la table ratings (polymorphique)
-- ============================================================
-- Cette table stocke les notes des utilisateurs pour :
-- - Les films (entity_type = 'movie')
-- - Les recettes (entity_type = 'recipe')
--
-- Structure polymorphique identique à favorites :
-- - entity_type : type d'entité ('movie' ou 'recipe')
-- - entity_id : ID de l'entité dans sa table respective
-- ============================================================

-- Création de la table ratings
CREATE TABLE IF NOT EXISTS "ratings" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(20) NOT NULL DEFAULT 'movie',
    "entity_id" INT NOT NULL,
    "score" SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index unique : un utilisateur ne peut noter qu'une fois chaque entité
CREATE UNIQUE INDEX IF NOT EXISTS "ratings_user_entity_idx"
ON "ratings" ("id_user", "entity_type", "entity_id");

-- Index pour les requêtes de moyennes par entité
CREATE INDEX IF NOT EXISTS "ratings_entity_idx"
ON "ratings" ("entity_type", "entity_id");

-- Commentaires de documentation
COMMENT ON TABLE "ratings" IS 'Notes des utilisateurs (polymorphique : films et recettes)';
COMMENT ON COLUMN "ratings"."entity_type" IS 'Type d''entité: movie ou recipe';
COMMENT ON COLUMN "ratings"."entity_id" IS 'ID de l''entité dans sa table respective';
COMMENT ON COLUMN "ratings"."score" IS 'Note de 1 à 5 étoiles';
