-- Migration: Ajout de la colonne synopsis à la table movies
-- Date: 2026-02-06
-- Description: Ajoute un champ synopsis pour stocker le résumé du film (TMDB)

-- PostgreSQL
ALTER TABLE movies ADD COLUMN IF NOT EXISTS synopsis TEXT;

-- SQLite (si IF NOT EXISTS n'est pas supporté, utiliser cette version)
-- ALTER TABLE movies ADD COLUMN synopsis TEXT;

-- Note: Cette colonne sera automatiquement remplie lors de l'ajout de nouveaux films via TMDB
-- Pour les films existants, le synopsis peut être récupéré via l'API TMDB si tmdb_id est présent
