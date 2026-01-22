-- Migration : Ajout du propriétaire sur movies et recipes
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS id_user INT REFERENCES users(id);

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS id_user INT REFERENCES users(id);
