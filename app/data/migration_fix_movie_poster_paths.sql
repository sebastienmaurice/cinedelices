-- Migration : Corriger les chemins des affiches des films
-- Convertir les URLs TMDB directes en chemins locaux
-- Télécharger et enregistrer les affiches correctement

-- Étape 1 : Films avec URLs TMDB directes dans 'picture'
SELECT id, title, tmdb_id, picture
FROM movies
WHERE picture LIKE 'https://image.tmdb.org%'
  AND status = 'approved'
ORDER BY id;

-- Étape 2 : Films à re-télécharger
SELECT id, title, tmdb_id, picture, type
FROM movies
WHERE picture LIKE 'https://image.tmdb.org%'
  AND tmdb_id IS NOT NULL
ORDER BY id;

-- Note : Le reste de la correction se fera via :
-- POST /admin/migrate-movie-images
-- Cette route télécharge les affiches TMDB et met à jour la BDD
