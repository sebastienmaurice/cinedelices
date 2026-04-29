-- Migration: ajout colonnes Google OAuth
-- Ajoute google_id (identifiant unique Google) et avatar_url (photo de profil Google)
-- Rend password nullable pour les comptes Google-only

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id  VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);

ALTER TABLE users
  ALTER COLUMN password DROP NOT NULL;
