-- ================================================================
-- Migration : Correction auteur obligatoire sur les recettes
-- ================================================================
-- Contexte : Certaines recettes avaient id_user NULL, affichant "Anonyme".
-- Règle métier : toute recette a obligatoirement un auteur (user connecté).
--
-- Étape 1 : Assigner les recettes orphelines à l'admin par défaut (id=3, Seb le Fourbe)
-- Étape 2 : Ajouter la contrainte NOT NULL pour empêcher les futures insertions sans auteur
-- ================================================================

-- 1. Corriger les recettes existantes sans auteur
UPDATE recipes SET id_user = 3 WHERE id_user IS NULL;

-- 2. Empêcher les futures recettes sans auteur
ALTER TABLE recipes ALTER COLUMN id_user SET NOT NULL;
