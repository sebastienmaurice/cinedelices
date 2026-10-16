-- Thème de la bannière espace créateur : { signature, title, primary, accent }. Idempotent.
ALTER TABLE users ADD COLUMN IF NOT EXISTS creator_theme JSONB NULL;
