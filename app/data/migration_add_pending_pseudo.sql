-- Migration : ajout modération pseudo utilisateur
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pending_pseudo VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pseudo_status  VARCHAR(20)  DEFAULT 'approved';
