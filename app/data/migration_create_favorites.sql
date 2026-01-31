-- Migration : Création de la table favorites
-- Permet aux utilisateurs de sauvegarder leurs films favoris

CREATE TABLE IF NOT EXISTS "favorites" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "id_movie" INT NOT NULL REFERENCES "movies"("id") ON DELETE CASCADE,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("id_user", "id_movie")
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(id_user);
CREATE INDEX IF NOT EXISTS idx_favorites_movie ON favorites(id_movie);

-- Commentaires
COMMENT ON TABLE favorites IS 'Table des films favoris des utilisateurs';
COMMENT ON COLUMN favorites.id_user IS 'ID de l''utilisateur';
COMMENT ON COLUMN favorites.id_movie IS 'ID du film favori';
COMMENT ON COLUMN favorites.created_at IS 'Date d''ajout aux favoris';
