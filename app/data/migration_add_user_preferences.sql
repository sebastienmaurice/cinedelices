-- Migration : Ajout des préférences utilisateur
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notify_recipes BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS notify_cinema BOOLEAN DEFAULT TRUE;
