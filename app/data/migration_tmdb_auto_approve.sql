-- ============================================================
-- MIGRATION : Auto-approbation des films TMDB en attente
-- Généré le : 2026-03-31
-- Contexte  : Les films importés depuis TMDB sont désormais
--             auto-approuvés à la création (source fiable).
--             Ce script corrige les films TMDB déjà en base
--             avec status = 'pending'.
-- ============================================================

BEGIN;

-- Approuver tous les films TMDB encore en attente de validation
UPDATE movies
SET
  status       = 'approved',
  validated_at = NOW()
WHERE
  tmdb_id IS NOT NULL
  AND status = 'pending';

-- Vérification post-update
-- SELECT id, title, tmdb_id, status, validated_at
-- FROM movies
-- WHERE tmdb_id IS NOT NULL
-- ORDER BY id;

COMMIT;
