-- Migration : Ajout du statut de validation de la photo de profil
ALTER TABLE users
ADD COLUMN IF NOT EXISTS picture_status VARCHAR(20) DEFAULT 'approved';

UPDATE users
SET picture_status = 'approved'
WHERE picture_status IS NULL;
