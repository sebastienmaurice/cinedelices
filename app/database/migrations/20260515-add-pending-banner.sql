-- Migration : ajout du champ pending_banner_image sur la table users
-- Permet de conserver l'ancienne bannière approuvée pendant la validation de la nouvelle

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pending_banner_image VARCHAR(255) DEFAULT NULL;
