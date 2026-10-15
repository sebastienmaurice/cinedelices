-- Réseaux sociaux utilisateur (créateurs partenaires) : { tiktok, instagram, youtube, website }.
-- Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB NULL;
