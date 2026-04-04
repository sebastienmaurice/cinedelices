-- ============================================================
-- Migration : unique_recipe_position
-- Date      : 2026-04-04
-- Objet     : Empêcher les doublons (recipe_id, position) dans recipe_pictures
-- ============================================================

-- ========== UP ==========
-- Ajouter une contrainte d'unicité sur (recipe_id, position)
-- Garantit qu'une seule image peut occuper une position donnée pour une recette

ALTER TABLE recipe_pictures
  ADD CONSTRAINT unique_recipe_position UNIQUE (recipe_id, position);

-- ========== DOWN ==========
-- Pour annuler cette migration, exécuter :
-- ALTER TABLE recipe_pictures DROP CONSTRAINT unique_recipe_position;
