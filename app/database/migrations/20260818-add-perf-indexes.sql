-- Migration : index de performance sur les colonnes les plus filtrées
-- (audit technique du 18/08/2026)
--
-- `recipes.status` et `movies.status` sont filtrées dans la quasi-totalité
-- des requêtes de l'application (WHERE status = 'approved'). `recipes.id_movie`
-- est une clé étrangère — PostgreSQL n'indexe PAS automatiquement les clés
-- étrangères (contrairement aux clés primaires) — et sert de GROUP BY / IN (...)
-- dans de nombreuses requêtes (compteurs de recettes par film, getPublicMovieIds…).
--
-- Sans impact mesurable à la taille actuelle de la base (scan séquentiel
-- trivial sur quelques dizaines de lignes), mais évite une dégradation
-- progressive à mesure que le catalogue grossit. Ajout pur, aucun risque
-- de régression, appliqué automatiquement au démarrage (voir migrate.js).

CREATE INDEX IF NOT EXISTS idx_recipes_status       ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_recipes_id_movie     ON recipes(id_movie);
CREATE INDEX IF NOT EXISTS idx_recipes_movie_status ON recipes(id_movie, status);
CREATE INDEX IF NOT EXISTS idx_movies_status        ON movies(status);
