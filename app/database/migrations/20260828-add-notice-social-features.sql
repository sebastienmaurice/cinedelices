-- Système d'avis enrichi : réponses, likes, photos jointes, avis anonyme et
-- badge éditorial ("Coup de cœur" / "Astuce utile"). Voir recipes-movie
-- controllers/submitNotice et la page recipe-detail.ejs (section avis).

-- Réponses (1 niveau) : une réponse est un Notice avec parent_id renseigné.
ALTER TABLE notices ADD COLUMN IF NOT EXISTS parent_id     INT     NULL REFERENCES notices(id) ON DELETE CASCADE;
-- Avis publié anonymement (le pseudo réel n'est pas affiché côté public).
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_anonymous  BOOLEAN NOT NULL DEFAULT false;
-- Badge éditorial optionnel, posé manuellement en modération.
-- Valeurs attendues : 'coup_de_coeur' | 'astuce_utile' | NULL.
ALTER TABLE notices ADD COLUMN IF NOT EXISTS highlight     VARCHAR(20) NULL;
-- Compteur dénormalisé de likes (mis à jour par notice_likes) — évite un
-- COUNT() à chaque affichage de la liste d'avis.
ALTER TABLE notices ADD COLUMN IF NOT EXISTS likes_count   INT     NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_notices_parent_id ON notices(parent_id);

-- Likes sur un avis — un like par utilisateur et par avis.
CREATE TABLE IF NOT EXISTS notice_likes (
  id         SERIAL PRIMARY KEY,
  id_notice  INT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  id_user    INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (id_notice, id_user)
);

-- Photos jointes à un avis (jusqu'à 3, cf. NOTICE_MAX_PICTURES côté contrôleur).
CREATE TABLE IF NOT EXISTS notice_pictures (
  id         SERIAL PRIMARY KEY,
  id_notice  INT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  file_path  VARCHAR(255) NOT NULL,
  position   INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notice_pictures_notice_id ON notice_pictures(id_notice);
