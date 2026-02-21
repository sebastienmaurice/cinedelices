-- ============================================================
-- MIGRATION : status BOOLEAN → ENUM VARCHAR(20)
-- + ajout colonne validated_at (TIMESTAMP)
--
-- À exécuter UNE SEULE FOIS via psql avant redémarrage Node.
-- Commande : psql $PG_URL -f app/database/migration-status-enum.sql
--
-- Pourquoi un ENUM supérieur à un BOOLEAN :
--   - Le BOOLEAN ne permet que deux états (true/false).
--     Il est impossible de distinguer "en attente" de "refusé"
--     sans ajouter une colonne supplémentaire.
--   - L'ENUM string (pending/approved/rejected) est auto-documenté :
--     la valeur elle-même dit ce qu'elle représente.
--   - Il s'aligne sur le système déjà utilisé pour picture_status
--     et banner_status (User), rendant le code uniforme.
-- ============================================================

-- ========================
-- TABLE recipes
-- ========================
ALTER TABLE recipes
  ALTER COLUMN status TYPE VARCHAR(20)
  USING CASE WHEN status = true THEN 'approved' ELSE 'pending' END;

ALTER TABLE recipes ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE recipes ALTER COLUMN status SET NOT NULL;

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;

-- ========================
-- TABLE movies
-- ========================
ALTER TABLE movies
  ALTER COLUMN status TYPE VARCHAR(20)
  USING CASE WHEN status = true THEN 'approved' ELSE 'pending' END;

ALTER TABLE movies ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE movies ALTER COLUMN status SET NOT NULL;

ALTER TABLE movies ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;

-- ========================
-- TABLE notices
-- ========================
ALTER TABLE notices
  ALTER COLUMN status TYPE VARCHAR(20)
  USING CASE WHEN status = true THEN 'approved' ELSE 'pending' END;

ALTER TABLE notices ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE notices ALTER COLUMN status SET NOT NULL;

ALTER TABLE notices ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;

-- ========================
-- VÉRIFICATION
-- ========================
-- Après exécution, vérifier avec :
--   SELECT status, COUNT(*) FROM recipes GROUP BY status;
--   SELECT status, COUNT(*) FROM movies GROUP BY status;
--   SELECT status, COUNT(*) FROM notices GROUP BY status;
