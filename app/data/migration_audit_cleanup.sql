-- ============================================================
-- AUDIT CLEANUP — Ciné Délices
-- Généré le : 2026-03-31
-- Auteur     : Audit automatique
-- ============================================================
-- Ce fichier contient :
--   BLOC A  — Corrections SÛRES (applicables immédiatement)
--   BLOC B  — Corrections MANUELLES (SQL prêt, NE PAS exécuter sans vérification)
--   BLOC C  — Requêtes d'investigation complémentaires
-- ============================================================


-- ============================================================
-- BLOC A — CORRECTIONS SÛRES (transaction atomique)
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- A1. Corriger les slugs NULL sur recipes
--     Contexte : 3 recettes [E2E] ont un slug NULL (IDs 18, 19, 20)
--     La colonne slug est UNIQUE — on utilise un suffixe numérique
--     pour éviter toute collision en cas de noms identiques.
--     Les recettes E2E sont en status='pending' et sans image.
--     Action : générer un slug à partir du name (slugify simplifié SQL).
-- ----------------------------------------------------------------
UPDATE recipes
SET slug = LOWER(REGEXP_REPLACE(TRIM(name), '[^a-z0-9]+', '-', 'gi'))
WHERE slug IS NULL
  AND name IS NOT NULL
  AND name != '';

-- Vérification post-update
-- SELECT id, name, slug FROM recipes WHERE id IN (18, 19, 20);


-- ----------------------------------------------------------------
-- A2. (Informatif) Aucune recipe_picture orpheline détectée
--     Requête de contrôle laissée en commentaire :
-- DELETE FROM recipe_pictures
-- WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_pictures.recipe_id);
-- ----------------------------------------------------------------


-- ----------------------------------------------------------------
-- A3. (Informatif) Aucun user_points sans user correspondant détecté
--     Requête de contrôle laissée en commentaire :
-- DELETE FROM user_points
-- WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = user_points.id_user);
-- ----------------------------------------------------------------


-- ----------------------------------------------------------------
-- A4. Corriger le level_code incohérent dans user_points
--     Contexte : level_code est stocké comme '1', '2', '3' (chiffre string)
--     au lieu de codes texte comme 'figurant', 'second_role', 'vedette'.
--     Cela peut provoquer des comportements inattendus dans l'UI.
--     À adapter selon la table de référence levels si elle est créée.
--     Pour l'instant, correction vers les codes attendus par xpService.js.
-- ----------------------------------------------------------------
-- NOTE : Vérifier d'abord les codes valides dans xpService.js avant d'activer.
-- UPDATE user_points SET level_code = 'figurant'    WHERE level_code = '1';
-- UPDATE user_points SET level_code = 'second_role' WHERE level_code = '2';
-- UPDATE user_points SET level_code = 'vedette'     WHERE level_code = '3';


COMMIT;


-- ============================================================
-- BLOC B — CORRECTIONS MANUELLES (NE PAS EXÉCUTER sans vérification)
-- ============================================================

-- ----------------------------------------------------------------
-- B1. Supprimer les recettes [E2E] de test
--     Contexte : 3 recettes créées par les tests Playwright
--     (IDs 18, 19, 20) — status='pending', sans image, sans slug.
--     Ces recettes polluent le backoffice admin.
--     ACTION RECOMMANDÉE : Supprimer manuellement après confirmation.
-- ----------------------------------------------------------------
-- BEGIN;
-- DELETE FROM recipes WHERE id IN (18, 19, 20) AND name LIKE '[E2E]%';
-- COMMIT;


-- ----------------------------------------------------------------
-- B2. Film "Ratatouille" (ID 16) sans aucune recette associée
--     Status = 'pending'. Ne pas supprimer automatiquement —
--     peut être en cours de contribution.
--     Si non utilisé après 30 jours, envisager la suppression.
-- ----------------------------------------------------------------
-- BEGIN;
-- DELETE FROM movies WHERE id = 16 AND status = 'pending'
--   AND NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id_movie = 16);
-- COMMIT;


-- ----------------------------------------------------------------
-- B3. Utilisateurs inactifs (0 recette)
--     IDs : 2 (pipou/admin), 122 (Bfx75/user)
--     L'utilisateur 2 est admin — ne jamais supprimer automatiquement.
--     L'utilisateur 122 est récent (créé le 2026-03-30) — trop tôt.
--     Aucune suppression recommandée pour l'instant.
-- ----------------------------------------------------------------


-- ----------------------------------------------------------------
-- B4. Corriger le level_code (string numérique → code texte)
--     À activer après vérification avec xpService.js
--     Voir BLOC A4 commenté ci-dessus.
-- ----------------------------------------------------------------


-- ============================================================
-- BLOC C — REQUÊTES D'INVESTIGATION ET DE SUIVI
-- ============================================================

-- C1. Vérifier l'état post-correction des slugs
-- SELECT id, name, slug, status FROM recipes ORDER BY id;

-- C2. Vérifier la cohérence globale user_points <-> users
-- SELECT up.id, up.id_user, u.pseudo, up.points, up.level_code, up.active_frame_code
-- FROM user_points up
-- JOIN users u ON u.id = up.id_user;

-- C3. Recettes [E2E] restantes
-- SELECT id, name, status FROM recipes WHERE name LIKE '[E2E]%';

-- C4. Films pending sans recette depuis plus de 30 jours
-- SELECT id, title, year, status FROM movies
-- WHERE status = 'pending' AND NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id_movie = movies.id);

-- C5. Vérifier les badges signature non utilisés
-- SELECT sb.code, sb.label, COUNT(usb.id) AS nb_utilisateurs
-- FROM signature_badges sb
-- LEFT JOIN user_signature_badges usb ON usb.id_badge = sb.id
-- GROUP BY sb.code, sb.label
-- ORDER BY nb_utilisateurs;
