-- Bande carrousel des posts d'un créateur partenaire (page auteur). Idempotent.
CREATE TABLE IF NOT EXISTS creator_posts (
  id         SERIAL PRIMARY KEY,
  id_user    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(120) NULL,
  url        VARCHAR(300) NOT NULL,
  platform   VARCHAR(20) NOT NULL DEFAULT 'tiktok',
  cover_url  VARCHAR(500) NULL,
  position   INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_creator_posts_user ON creator_posts(id_user, position);
