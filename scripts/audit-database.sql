-- ============================================================
-- AUDIT BASE DE DONNÉES — CINÉ DÉLICES
-- Script READ-ONLY — Aucune requête destructive
-- Généré le 2026-03-31
-- Usage : psql "postgresql://cinedelices:cinedelices@localhost:5432/cinedelices" -f scripts/audit-database.sql
-- ============================================================

-- ============================================================
-- SECTION 1 : STRUCTURE GLOBALE
-- ============================================================

-- 1a. Toutes les tables + row count (live tuples)
\echo '=== 1a. TABLES + ROW COUNT ==='
SELECT schemaname, relname AS tablename, n_live_tup AS lignes
FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

-- 1b. Structure de chaque table (colonnes, types, nullable, default)
\echo '=== 1b. STRUCTURE COLONNES ==='
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 1c. Taille de la BDD et de chaque table
\echo '=== 1c. TAILLE BDD ==='
SELECT pg_size_pretty(pg_database_size('cinedelices')) AS db_size;

\echo '=== 1c. TAILLE TABLES ==='
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS taille
FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;

-- ============================================================
-- SECTION 2 : CONTRAINTES D'INTÉGRITÉ
-- ============================================================

-- 2a. Clés primaires
\echo '=== 2a. CLES PRIMAIRES ==='
SELECT tc.table_name, kc.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kc ON tc.constraint_name = kc.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2b. Clés étrangères avec règle ON DELETE
\echo '=== 2b. CLES ETRANGERES + ON DELETE RULE ==='
SELECT tc.table_name, kc.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_col,
       rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kc ON tc.constraint_name = kc.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2c. Contraintes UNIQUE
\echo '=== 2c. CONTRAINTES UNIQUE ==='
SELECT tc.table_name, kc.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kc ON tc.constraint_name = kc.constraint_name
WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 2d. Contraintes CHECK (hors NOT NULL automatiques)
\echo '=== 2d. CONTRAINTES CHECK ==='
SELECT tc.table_name, tc.constraint_name, cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' AND tc.constraint_type = 'CHECK'
  AND cc.check_clause NOT LIKE '%IS NOT NULL'  -- exclure les NOT NULL auto-générés
ORDER BY tc.table_name;

-- ============================================================
-- SECTION 3 : DONNÉES ORPHELINES
-- ============================================================

-- 3a. Recettes sans utilisateur (id_user NULL)
\echo '=== 3a. RECETTES SANS UTILISATEUR ==='
SELECT id, name, status FROM recipes WHERE id_user IS NULL;

-- 3b. Recettes sans film associé (id_movie NULL)
\echo '=== 3b. RECETTES SANS FILM ==='
SELECT id, name, status FROM recipes WHERE id_movie IS NULL;

-- 3c. recipe_pictures sans recette parente
\echo '=== 3c. RECIPE_PICTURES ORPHELINES ==='
SELECT rp.id, rp.file_path FROM recipe_pictures rp
WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id = rp.recipe_id);

-- 3d. user_points sans utilisateur valide
\echo '=== 3d. USER_POINTS SANS UTILISATEUR ==='
SELECT up.id, up.id_user FROM user_points up
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = up.id_user);

-- 3e. user_signature_badges sans utilisateur valide
\echo '=== 3e. USER_SIGNATURE_BADGES SANS UTILISATEUR ==='
SELECT usb.id, usb.id_user FROM user_signature_badges usb
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = usb.id_user);

-- 3f. user_signature_badges sans badge valide
\echo '=== 3f. USER_SIGNATURE_BADGES SANS BADGE ==='
SELECT usb.id, usb.id_badge FROM user_signature_badges usb
WHERE NOT EXISTS (SELECT 1 FROM signature_badges sb WHERE sb.id = usb.id_badge);

-- 3g. Films sans recettes approuvées associées
\echo '=== 3g. FILMS SANS RECETTES APPROUVEES ==='
SELECT m.id, m.title, m.year, m.status FROM movies m
WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.id_movie = m.id AND r.status = 'approved');

-- 3h. Vérification existence table favorites
\echo '=== 3h. TABLE FAVORITES (existence) ==='
SELECT COUNT(*) AS favorites_table_exists
FROM information_schema.tables WHERE table_name = 'favorites' AND table_schema = 'public';

-- ============================================================
-- SECTION 4 : DOUBLONS
-- ============================================================

-- 4a. Emails dupliqués users
\echo '=== 4a. EMAILS DUPLIQUES ==='
SELECT email, COUNT(*) AS nb, array_agg(id) AS ids
FROM users GROUP BY email HAVING COUNT(*) > 1;

-- 4b. Pseudos dupliqués users
\echo '=== 4b. PSEUDOS DUPLIQUES ==='
SELECT pseudo, COUNT(*) AS nb, array_agg(id) AS ids
FROM users GROUP BY pseudo HAVING COUNT(*) > 1;

-- 4c. Slugs dupliqués recettes
\echo '=== 4c. SLUGS DUPLIQUES RECETTES ==='
SELECT slug, COUNT(*) AS nb, array_agg(id) AS ids
FROM recipes WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;

-- 4d. Slugs dupliqués films
\echo '=== 4d. SLUGS DUPLIQUES FILMS ==='
SELECT slug, COUNT(*) AS nb, array_agg(id) AS ids
FROM movies WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1;

-- 4e. Titres de films dupliqués (normalisés, insensible à la casse)
\echo '=== 4e. TITRES FILMS DUPLIQUES ==='
SELECT LOWER(TRIM(title)) AS titre, COUNT(*) AS nb, array_agg(id) AS ids, array_agg(year) AS annees
FROM movies GROUP BY LOWER(TRIM(title)) HAVING COUNT(*) > 1 ORDER BY nb DESC;

-- 4f. tmdb_id dupliqués films
\echo '=== 4f. TMDB_ID DUPLIQUES ==='
SELECT tmdb_id, COUNT(*) AS nb, array_agg(id) AS ids
FROM movies WHERE tmdb_id IS NOT NULL GROUP BY tmdb_id HAVING COUNT(*) > 1;

-- 4g. Titres de recettes dupliqués pour le même film
\echo '=== 4g. TITRES RECETTES DUPLIQUES (meme film) ==='
SELECT name, id_movie, COUNT(*) AS nb, array_agg(id) AS ids
FROM recipes GROUP BY name, id_movie HAVING COUNT(*) > 1;

-- 4h. Badges signature dupliqués par user
\echo '=== 4h. BADGES SIGNATURE DUPLIQUES PAR USER ==='
SELECT id_user, id_badge, COUNT(*) AS nb
FROM user_signature_badges GROUP BY id_user, id_badge HAVING COUNT(*) > 1;

-- ============================================================
-- SECTION 5 : DONNÉES OBSOLÈTES / INVALIDES
-- ============================================================

-- 5a. Recettes par statut
\echo '=== 5a. RECETTES PAR STATUT ==='
SELECT status, COUNT(*) AS nb FROM recipes GROUP BY status ORDER BY nb DESC;

-- 5b. Films par statut
\echo '=== 5b. FILMS PAR STATUT ==='
SELECT status, COUNT(*) AS nb FROM movies GROUP BY status ORDER BY nb DESC;

-- 5c. Recettes sans image principale (picture NULL)
\echo '=== 5c. RECETTES SANS IMAGE ==='
SELECT id, name, status FROM recipes WHERE picture IS NULL;

-- 5d. Slugs NULL recettes
\echo '=== 5d. SLUGS NULL RECETTES ==='
SELECT id, name FROM recipes WHERE slug IS NULL;

-- 5e. Slugs NULL films
\echo '=== 5e. SLUGS NULL FILMS ==='
SELECT id, title FROM movies WHERE slug IS NULL;

-- 5f. Films sans tmdb_id
\echo '=== 5f. FILMS SANS TMDB_ID ==='
SELECT id, title, year, genre, status FROM movies WHERE tmdb_id IS NULL ORDER BY id;

-- 5g. Années invalides films (avant 1888 ou après 2027 ou NULL)
\echo '=== 5g. ANNEES INVALIDES FILMS ==='
SELECT id, title, year FROM movies WHERE year IS NULL OR year < 1888 OR year > 2027;

-- 5h. Recettes avec temps de préparation négatif ou nul
\echo '=== 5h. TEMPS NEGATIF/NUL RECETTES ==='
SELECT id, name, time FROM recipes WHERE time IS NOT NULL AND time <= 0;

-- 5i. Distribution des rôles utilisateurs
\echo '=== 5i. ROLES UTILISATEURS ==='
SELECT role, COUNT(*) AS nb FROM users GROUP BY role ORDER BY nb DESC;

-- 5j. Timestamps incohérents (createdAt > updatedAt)
\echo '=== 5j. TIMESTAMPS INCOHERENTS RECETTES ==='
SELECT id, name, "createdAt", "updatedAt" FROM recipes
WHERE "createdAt" IS NOT NULL AND "updatedAt" IS NOT NULL AND "createdAt" > "updatedAt";

\echo '=== 5j. TIMESTAMPS INCOHERENTS FILMS ==='
SELECT id, title, "createdAt", "updatedAt" FROM movies
WHERE "createdAt" IS NOT NULL AND "updatedAt" IS NOT NULL AND "createdAt" > "updatedAt";

-- ============================================================
-- SECTION 6 : FOREIGN KEYS SANS ON DELETE CASCADE
-- ============================================================

-- 6. Toutes les FK sans ON DELETE CASCADE (risque d'orphelins si suppression manuelle)
\echo '=== 6. FK SANS ON DELETE CASCADE ==='
SELECT tc.table_name, kc.column_name, ccu.table_name AS ref_table, rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kc ON tc.constraint_name = kc.constraint_name
JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND rc.delete_rule != 'CASCADE'
ORDER BY tc.table_name;

-- ============================================================
-- SECTION 7 : INDEX
-- ============================================================

-- 7a. Tous les index existants
\echo '=== 7a. TOUS LES INDEX ==='
SELECT tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 7b. Tables sans index hors clé primaire (potentiellement non-optimisées)
\echo '=== 7b. TABLES SANS INDEX HORS PK ==='
SELECT t.tablename FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes i
    WHERE i.tablename = t.tablename AND i.schemaname = 'public'
      AND i.indexname NOT LIKE '%_pkey'
  );

-- ============================================================
-- SECTION 8 : COHÉRENCE COLONNES
-- ============================================================

-- 8a. Formats email invalides
\echo '=== 8a. EMAILS INVALIDES ==='
SELECT id, email FROM users
WHERE email NOT LIKE '%@%.%' OR email IS NULL;

-- 8b. Points négatifs dans user_points
\echo '=== 8b. POINTS NEGATIFS ==='
SELECT id, id_user, points FROM user_points WHERE points < 0;

-- 8c. level_code hors de la plage valide (1-19)
-- Note : level_code est stocké VARCHAR mais contient des entiers
\echo '=== 8c. LEVEL_CODE HORS RANGE 1-19 ==='
SELECT id, id_user, level_code FROM user_points
WHERE level_code::integer < 1 OR level_code::integer > 19;

-- 8d. Valeurs de active_frame_code présentes
\echo '=== 8d. ACTIVE_FRAME_CODE (distribution) ==='
SELECT active_frame_code, COUNT(*) AS nb FROM user_points GROUP BY active_frame_code ORDER BY nb DESC;

-- 8e. Distribution des catégories de recettes
-- Note : attention aux majuscules/minuscules (normalisation)
\echo '=== 8e. CATEGORIES RECETTES (distribution) ==='
SELECT category, COUNT(*) AS nb FROM recipes GROUP BY category ORDER BY category;

-- 8f. Distribution des genres de films
-- Note : attention aux majuscules/minuscules (normalisation)
\echo '=== 8f. GENRES FILMS (distribution) ==='
SELECT genre, COUNT(*) AS nb FROM movies GROUP BY genre ORDER BY genre;

-- ============================================================
-- SECTION 9 : GAMIFICATION
-- ============================================================

-- 9a. Vue complète user_points avec pseudo
\echo '=== 9a. USER_POINTS COMPLET ==='
SELECT up.id, u.pseudo, up.points, up.level_code, up.active_frame_code, up.last_weekly_login_at
FROM user_points up JOIN users u ON u.id = up.id_user ORDER BY up.points DESC;

-- 9b. Cohérence level_code vs points (niveau calculé vs stocké)
-- XP_TABLE = [0,100,300,600,1100,1800,2800,4200,6000,8500,11500,15000,20000,26000,33000,41000,50000,60000,72000]
\echo '=== 9b. COHERENCE LEVEL_CODE VS POINTS ==='
WITH level_calc AS (
  SELECT id, id_user, points, level_code::integer AS stored_level,
    CASE
      WHEN points >= 72000 THEN 19
      WHEN points >= 60000 THEN 18
      WHEN points >= 50000 THEN 17
      WHEN points >= 41000 THEN 16
      WHEN points >= 33000 THEN 15
      WHEN points >= 26000 THEN 14
      WHEN points >= 20000 THEN 13
      WHEN points >= 15000 THEN 12
      WHEN points >= 11500 THEN 11
      WHEN points >= 8500  THEN 10
      WHEN points >= 6000  THEN 9
      WHEN points >= 4200  THEN 8
      WHEN points >= 2800  THEN 7
      WHEN points >= 1800  THEN 6
      WHEN points >= 1100  THEN 5
      WHEN points >= 600   THEN 4
      WHEN points >= 300   THEN 3
      WHEN points >= 100   THEN 2
      ELSE 1
    END AS expected_level
  FROM user_points
)
SELECT id, id_user, points, stored_level, expected_level,
  CASE WHEN stored_level = expected_level THEN 'OK' ELSE 'INCOHERENT' END AS statut
FROM level_calc ORDER BY id_user;

-- 9c. Badges signature attribués par user
\echo '=== 9c. SIGNATURE BADGES PAR USER ==='
SELECT u.pseudo, sb.code, sb.label, usb.unlocked_at
FROM user_signature_badges usb
JOIN users u ON u.id = usb.id_user
JOIN signature_badges sb ON sb.id = usb.id_badge
ORDER BY u.pseudo, usb.unlocked_at;

-- 9d. Tous les signature_badges définis
\echo '=== 9d. CATALOGUE SIGNATURE_BADGES ==='
SELECT id, code, label, film, theme, movie_slug_pattern, sort_order
FROM signature_badges ORDER BY sort_order, id;

-- ============================================================
-- SECTION 10 : SANTÉ GLOBALE
-- ============================================================

-- 10a. Résumé tables avec dead tuples (besoin de VACUUM ?)
\echo '=== 10a. SANTE TABLES (live/dead tuples) ==='
SELECT schemaname, relname AS tablename, n_live_tup, n_dead_tup,
       CASE WHEN n_live_tup > 0 THEN ROUND(100.0 * n_dead_tup / n_live_tup, 1) ELSE 0 END AS dead_pct,
       last_vacuum, last_autovacuum
FROM pg_stat_user_tables ORDER BY n_live_tup DESC;

-- 10b. Taille BDD totale
\echo '=== 10b. TAILLE BDD TOTALE ==='
SELECT pg_size_pretty(pg_database_size('cinedelices')) AS taille_totale;

-- 10c. Tables sans clé primaire
\echo '=== 10c. TABLES SANS CLE PRIMAIRE ==='
SELECT t.tablename FROM pg_tables t
WHERE t.schemaname = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_name = t.tablename AND tc.constraint_type = 'PRIMARY KEY'
  );

-- 10d. Comptage global des entités
\echo '=== 10d. COMPTAGE GLOBAL ==='
SELECT
  (SELECT COUNT(*) FROM users)              AS nb_users,
  (SELECT COUNT(*) FROM recipes)            AS nb_recipes,
  (SELECT COUNT(*) FROM movies)             AS nb_movies,
  (SELECT COUNT(*) FROM recipe_pictures)    AS nb_recipe_pictures,
  (SELECT COUNT(*) FROM notices)            AS nb_notices,
  (SELECT COUNT(*) FROM ratings)            AS nb_ratings,
  (SELECT COUNT(*) FROM favorites)          AS nb_favorites,
  (SELECT COUNT(*) FROM user_points)        AS nb_user_points,
  (SELECT COUNT(*) FROM signature_badges)   AS nb_signature_badges,
  (SELECT COUNT(*) FROM user_signature_badges) AS nb_user_signature_badges,
  (SELECT COUNT(*) FROM badges)             AS nb_badges,
  (SELECT COUNT(*) FROM levels)             AS nb_levels,
  (SELECT COUNT(*) FROM admin_logs)         AS nb_admin_logs;

-- ============================================================
-- SECTION 11 : STOCKAGE FICHIERS (chemins BDD)
-- ============================================================

-- 11a. Tous les file_path dans recipe_pictures
\echo '=== 11a. FILE_PATH RECIPE_PICTURES ==='
SELECT id, recipe_id, file_path, position, status FROM recipe_pictures ORDER BY recipe_id, position;

-- 11b. Champ picture dans recipes
\echo '=== 11b. PICTURE DANS RECIPES ==='
SELECT id, name, picture, status FROM recipes ORDER BY id;

-- 11c. Champ picture dans movies (URLs TMDB ou chemins locaux)
\echo '=== 11c. PICTURE DANS MOVIES ==='
SELECT id, title, picture,
  CASE
    WHEN picture LIKE 'http%' THEN 'URL_EXTERNE'
    WHEN picture LIKE '/images/%' THEN 'FICHIER_LOCAL'
    WHEN picture IS NULL THEN 'NULL'
    ELSE 'AUTRE'
  END AS type_image
FROM movies ORDER BY id;

-- 11d. Champ picture dans users (profils)
\echo '=== 11d. PICTURE DANS USERS ==='
SELECT id, pseudo, picture, pending_picture, picture_status FROM users ORDER BY id;

-- ============================================================
-- FIN DU SCRIPT D'AUDIT
-- ============================================================
