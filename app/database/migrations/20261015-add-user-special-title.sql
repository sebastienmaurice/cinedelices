-- Mention spéciale utilisateur (créateurs partenaires, membres fondateurs).
-- Purement décorative, sans effet sur les droits. Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS special_title VARCHAR(60) NULL;
