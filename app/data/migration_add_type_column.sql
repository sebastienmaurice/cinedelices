-- Migration : Ajout du champ type (film/série) à la table movies
-- Pour distinguer les films des séries dans la recherche avancée

-- Ajouter la colonne type si elle n'existe pas
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'film';

-- Mettre à jour tous les films existants pour qu'ils soient de type 'film'
UPDATE movies 
SET type = 'film' 
WHERE type IS NULL OR type = '';

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(type);

-- Commentaire sur la colonne
COMMENT ON COLUMN movies.type IS 'Type de contenu : film ou serie';
