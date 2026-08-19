-- Données TMDB additionnelles pour la fiche film (score, bande-annonce,
-- réalisateur, compositeur, casting principal). Récupérées via l'API
-- officielle TMDB au moment de la création du film — voir
-- app/controllers/tmdb.controllers.js (getMovieDetails).
--
-- Conformité CGU TMDB : ces données doivent être rafraîchies au moins tous
-- les 6 mois (pas de cache indéfini) et affichées avec l'attribution TMDB
-- requise (voir partials/footer.ejs).
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_rating   NUMERIC(3,1) NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_key   VARCHAR(50)  NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS director      VARCHAR(255) NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS composer      VARCHAR(255) NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS main_cast     VARCHAR(500) NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_synced_at TIMESTAMP   NULL;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS runtime        INT         NULL;
