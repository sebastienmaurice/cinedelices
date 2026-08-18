-- Migration : photos de préparation (une par étape, optionnelles)
--
-- step_number NULL = photo de galerie (comportement existant, inchangé)
-- step_number 1-6  = photo associée à l'étape N du texte de préparation

ALTER TABLE recipe_pictures ADD COLUMN IF NOT EXISTS step_number INT NULL;
