-- Migration : création de la table recipe_pictures
-- Remplace la colonne unique "picture" de recipes par une table dédiée multi-photos
-- MAX 3 photos par recette

CREATE TABLE IF NOT EXISTS "recipe_pictures" (
  "id"         SERIAL PRIMARY KEY,
  "recipe_id"  INTEGER NOT NULL REFERENCES "recipes"("id") ON DELETE CASCADE,
  "file_path"  VARCHAR(255) NOT NULL,
  "position"   INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_recipe_pictures_recipe_id"
  ON "recipe_pictures"("recipe_id");

-- Rétro-compatibilité : migrer les recettes existantes ayant déjà une photo
INSERT INTO "recipe_pictures" ("recipe_id", "file_path", "position", "created_at")
SELECT "id", "picture", 1, NOW()
FROM "recipes"
WHERE "picture" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "recipe_pictures" rp WHERE rp."recipe_id" = "recipes"."id"
  );
