-- Migration : Ajout du champ tmdb_id à la table movies
-- Pour éviter les doublons et valider les films via l'API TMDB

-- Ajouter la colonne tmdb_id si elle n'existe pas
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE;

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);

