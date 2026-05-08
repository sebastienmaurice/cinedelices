# Rapport d'audit BDD & Stockage — Ciné Délices

**Date** : 2026-03-31
**Base** : `postgresql://cinedelices:cinedelices@localhost:5432/cinedelices`
**Racine projet** : `d:\CINE DELICES\cinedelices`
**Audit** : READ-ONLY — aucune modification effectuée

---

## Résumé exécutif

| Indicateur | Valeur |
|---|---|
| Taille BDD | **9 299 kB** (~9 Mo) |
| Nombre de tables | **14** |
| Anomalies critiques | **1** |
| Anomalies majeures | **2** |
| Anomalies mineures | **5** |
| Niveau de santé global | **B+ (bon, quelques corrections requises)** |

La base de données est structurellement saine pour un projet en développement actif.
Les données sont cohérentes (0 orphelins, 0 doublons) mais plusieurs anomalies de schéma
et de normalisation méritent correction avant passage en production.

---

## PARTIE 1 — AUDIT BASE DE DONNÉES

### 1.1 Structure globale

#### 1.1a Tables et volumétrie

| Table | Lignes actives | Dead tuples | Taille |
|---|---|---|---|
| levels | 19 | 0 | 40 kB |
| badges | 9 | 0 | 48 kB |
| recipe_pictures | 6 | 0 | 40 kB |
| admin_logs | 4 | 0 | 64 kB |
| user_signature_badges | 3 | 5 | 40 kB |
| users | 3 | 17 | 120 kB |
| user_points | 2 | 21 | 72 kB |
| movies | 6* | 9 | 136 kB |
| recipes | 6* | 11 | 112 kB |
| signature_badges | 0 | 0 | 40 kB |
| ratings | 0 | 0 | 56 kB |
| users_recipes | 0 | 0 | 24 kB |
| favorites | 0 | 5 | 104 kB |
| notices | 0 | 0 | 32 kB |

*Note : `pg_stat_user_tables` indique 0 ou 1 pour movies/recipes car les statistiques
autovacuum ne sont pas encore à jour. Les requêtes directes COUNT(*) confirment 6 recettes
et 6 films actifs.*

**Observation** : Les tables `users`, `user_points`, `user_signature_badges` présentent
un ratio dead tuples élevé (>50%), indiquant un besoin de VACUUM manuel. Ce n'est pas
critique mais ralentit légèrement les requêtes.

#### 1.1b Taille BDD

- **BDD totale** : 9 299 kB (~9 Mo) — très légère, normal pour un environnement de développement.

#### 1.1c Comptage global

| Entité | Nb |
|---|---|
| users | 3 |
| recipes | 6 (toutes `approved`) |
| movies | 6 (5 `approved`, 1 `pending`) |
| recipe_pictures | 6 |
| notices | 0 |
| ratings | 0 |
| favorites | 0 |
| user_points | 2 |
| signature_badges | 7 définis, 0 en table (table vide) |
| user_signature_badges | 3 (toutes pour user "Seb le Fourbe") |
| badges | 9 |
| levels | 19 |
| admin_logs | 4 |

---

### 1.2 Contraintes d'intégrité

#### Clés primaires
Toutes les 14 tables ont une clé primaire sur colonne `id` (integer, auto-increment). **OK.**

#### Clés étrangères

| Table | Colonne | Ref | ON DELETE |
|---|---|---|---|
| admin_logs | admin_id | users | SET NULL |
| favorites | id_user | users | CASCADE |
| movies | id_user | users | NO ACTION |
| movies | delete_request_by | users | NO ACTION |
| notices | id_user | users | NO ACTION |
| notices | id_recipe | recipes | NO ACTION |
| ratings | id_user | users | CASCADE |
| recipe_pictures | recipe_id | recipes | CASCADE |
| recipes | id_movie | movies | NO ACTION |
| recipes | id_user | users | NO ACTION |
| user_points | id_user | users | CASCADE |
| user_signature_badges | id_user | users | CASCADE |
| user_signature_badges | id_badge | signature_badges | CASCADE |
| users_recipes | id_user | users | NO ACTION |
| users_recipes | id_recipe | recipes | NO ACTION |

#### Contraintes UNIQUE

| Table | Colonne(s) |
|---|---|
| badges | code |
| favorites | (id_user, entity_id) — VOIR ANOMALIE A1 |
| favorites | (id_user, entity_type, entity_id) |
| levels | code |
| movies | tmdb_id |
| movies | slug |
| recipes | slug |
| signature_badges | code |
| users | email |
| users | pseudo |

#### Contraintes CHECK

- `ratings.score` : CHECK (score >= 1 AND score <= 5) — bien présent
- Toutes les colonnes NOT NULL ont des contraintes CHECK auto-générées (normal en PostgreSQL)

---

### 1.3 Données orphelines

Toutes les vérifications d'orphelins retournent **0 résultat**. La base est cohérente.

| Vérification | Résultat |
|---|---|
| Recettes sans utilisateur | 0 |
| Recettes sans film | 0 |
| recipe_pictures sans recette | 0 |
| user_points sans utilisateur | 0 |
| user_signature_badges sans utilisateur | 0 |
| user_signature_badges sans badge | 0 |

**Seule note** : Le film "Ratatouille" (id=16, status=`pending`) n'a pas de recette approuvée.
C'est normal (film en attente de validation).

---

### 1.4 Doublons

Aucun doublon détecté sur :
- Emails utilisateurs
- Pseudos utilisateurs
- Slugs recettes
- Slugs films
- Titres films (normalisés)
- tmdb_id films
- Titres recettes pour le même film
- Badges signature par user

**Résultat : 0 doublon. Base parfaitement propre.**

---

### 1.5 Données obsolètes / invalides

- **Recettes par statut** : 6 `approved` — aucune en `pending` ou `rejected`
- **Films par statut** : 5 `approved`, 1 `pending` (Ratatouille id=16)
- **Recettes sans image** : 0
- **Slugs NULL** : 0 (recettes et films)
- **Années invalides** : 0
- **Temps négatif/nul** : 0
- **Timestamps incohérents** : 0

#### Anomalie de normalisation — Catégories et genres

Les valeurs de `category` dans `recipes` et `genre` dans `movies` ne sont pas normalisées :

**recipes.category** :
| Valeur | Nb |
|---|---|
| dessert | 2 |
| Dessert | 1 |
| plat | 2 |
| Plat | 1 |

**movies.genre** :
| Valeur | Nb |
|---|---|
| animation | 1 |
| Aventure | 1 |
| Comédie | 2 |
| Fantastique | 1 |
| Thriller | 1 |

Le mélange majuscules/minuscules (`dessert` vs `Dessert`, `plat` vs `Plat`) est
une incohérence qui peut causer des problèmes de filtrage.

---

### 1.6 Foreign Keys sans CASCADE

9 FK utilisent `NO ACTION` (équivalent `RESTRICT`) au lieu de `CASCADE` :

| Table | Colonne | Table référencée |
|---|---|---|
| movies | id_user | users |
| movies | delete_request_by | users |
| notices | id_user | users |
| notices | id_recipe | recipes |
| recipes | id_movie | movies |
| recipes | id_user | users |
| users_recipes | id_user | users |
| users_recipes | id_recipe | recipes |

La suppression d'un utilisateur ou d'un film peut échouer si des données dépendantes
existent sans que le code applicatif ne les supprime d'abord. Le contrôleur admin
gère manuellement ces suppressions en cascade (via `unlinkIfExists` + `destroy`),
ce qui compense mais est fragile.

---

### 1.7 Index

#### Index existants (36 au total)

Tous les index utiles sont présents :
- Index uniques sur `users.email`, `users.pseudo`
- Index uniques sur `recipes.slug`, `movies.slug`
- Index sur `movies.tmdb_id`, `movies.type`
- Index sur `recipe_pictures.recipe_id`
- Index sur `favorites.id_user`, `favorites.entity_id`, `favorites.entity_type`
- Index sur `ratings` par (entity_type, entity_id)
- Index unique sur `user_points.id_user`
- Index unique sur `user_signature_badges.(id_user, id_badge)`
- Index sur `admin_logs.action`, `admin_logs.created_at`

#### Tables sans index hors PK

- `users_recipes` — pas d'index sur `id_user` ou `id_recipe`
- `notices` — pas d'index sur `id_user` ou `id_recipe`

Ces tables sont actuellement vides (0 lignes), donc non-critique en développement.

---

### 1.8 Cohérence colonnes

- **Emails invalides** : 0
- **Points négatifs** : 0
- **level_code hors range** : 0

#### Distribution active_frame_code

| Valeur | Nb |
|---|---|
| cine | 1 |
| harry | 1 |

#### Anomalie de typage — level_code

La colonne `user_points.level_code` est de type `VARCHAR(20)` mais contient des
entiers (`"1"`, `"3"`). La valeur par défaut est `'figurant'` (une chaîne). Il y a
une incohérence de conception : soit c'est un entier, soit c'est un code textuel.
Actuellement, les données réelles contiennent des entiers, ce qui contredit le défaut
`'figurant'`. La requête `level_code::integer` fonctionne sur les données actuelles
mais planterait si une valeur textuelle était insérée.

---

### 1.9 Gamification

#### user_points

| id | Pseudo | Points | Level | Frame | Dernier login hebdo |
|---|---|---|---|---|---|
| 1 | Seb le Fourbe | 370 | 3 | harry | — |
| 10 | Bfx75 | 3 | 1 | cine | 2026-03-30 08:58 |

**Cohérence level_code vs points** : 2/2 OK — les niveaux stockés correspondent
aux points selon la XP_TABLE.

#### user_signature_badges (3 badges pour "Seb le Fourbe")

| User | Badge code | Label | Date |
|---|---|---|---|
| Seb le Fourbe | BIENVENUE | Bienvenue ! | 2026-03-29 |
| Seb le Fourbe | HARRY | Harry Potter | 2026-03-29 |
| Seb le Fourbe | INDIANA | Indiana Jones | 2026-03-29 |

#### Catalogue signature_badges (7 définis)

| Code | Label | Film | Theme | Slug pattern |
|---|---|---|---|---|
| BIENVENUE | Bienvenue ! | Ciné Délices | Special | `__bienvenue__` |
| STRANGE | Doctor Strange | Doctor Strange | Fantastique | `doctor-strange` |
| HARRY | Harry Potter | Harry Potter | Fantastique | `harry-potter` |
| INDIANA | Indiana Jones | Indiana Jones | Aventure | `indiana-jones` |
| MATRIX | Matrix | Matrix | Sci-Fi | `matrix` |
| FREDDY | Freddy | Freddy les griffes de la nuit | Horreur | `freddy` |
| READY | Ready Player One | Ready Player One | Cyberpunk | `ready-player-one` |

**Note** : La table `signature_badges` existe et est peuplée (7 entrées) mais
`pg_stat_user_tables` indique 0 lignes (stats autovacuum non actualisées).

---

### 1.10 Santé globale

#### Dead tuples (besoin VACUUM)

| Table | Live | Dead | % mort |
|---|---|---|---|
| user_points | 2 | 21 | 1050% |
| users | 3 | 17 | 567% |
| user_signature_badges | 3 | 5 | 167% |
| favorites | 0 | 5 | N/A |
| movies | ~6 | 9 | ~150% |
| recipes | ~6 | 11 | ~183% |

Le taux de dead tuples est élevé pour les tables fréquemment modifiées. Un `VACUUM ANALYZE`
manuel améliorerait les performances mais n'est pas critique en développement.

#### Tables sans clé primaire : **0** — toutes les tables ont une PK.

---

## PARTIE 2 — AUDIT STOCKAGE FICHIERS

### 2.1 Images recettes

#### Fichiers sur disque (`app/public/images/recipes/`)

| Fichier | Taille |
|---|---|
| applepie-1764137966385-745300976.jpg | 136 Ko |
| biereaubeurre-1764137132022-745397718.jpeg | 45 Ko |
| carbonnade_chtis-1764138416283-708167994.jpeg | 41 Ko |
| recette-indiana-jones-bol-expedition-v1-1764166522021-433994479.png | 779 Ko |
| recipe-recette-le-foie-et-ses-feves-au-beurre (1)-1771868748364-695886615.png | 2,8 Mo |
| tarte_melasse-1764137492266-726416795.jpeg | 39 Ko |

**Note** : Le fichier `recipe-recette-le-foie-et-ses-feves-au-beurre (1)-[...].png`
contient des espaces et des parenthèses dans son nom — peut causer des problèmes
dans certains contextes HTTP.

#### Croisement BDD — disque

- **Images en BDD absentes sur disque** : **0** — cohérence parfaite
- **Fichiers sur disque absents en BDD** : **0** — aucun fichier orphelin

Les 6 fichiers sur disque correspondent exactement aux 6 entrées `recipe_pictures`
ET aux 6 champs `recipes.picture`.

### 2.2 Images films

Les 5 films approuvés utilisent des **URLs TMDB externes**
(`https://image.tmdb.org/t/p/w500/...`). Aucun fichier film n'est stocké localement.

Le film "Ratatouille" (id=16, `pending`) n'a pas d'image (`picture = NULL`).

Le dossier `app/public/images/movies/originals/` existe mais est **vide**.

### 2.3 Images profils utilisateurs

| User | picture (BDD) | Fichier présent |
|---|---|---|
| Seb le Fourbe (id=3) | `/images/profiles/profile-2-1771427050358-632187373.png` | Oui |
| Bfx75 (id=122) | NULL | — |
| pipou (id=2) | NULL | — |

**Fichiers sur disque dans `/images/profiles/` non référencés en BDD** :
- `profile-ddd-1771088850097-968891793.png`
- `profile-seb-1773597993169-781499167.png`
- `profile-seb-1774619378618-977201511.png`

Ces 3 fichiers sont des images de profil obsolètes (anciennes versions, remplacées).
Ce sont des **fichiers orphelins sur disque**.

### 2.4 Logique de suppression (hard delete)

Le contrôleur `admin.controllers.js` implémente une suppression **hard delete** :
la fonction `unlinkIfExists(relativePath)` supprime physiquement le fichier dès
qu'une suppression admin est approuvée. Il n'y a **pas de soft delete** pour les
fichiers images.

Flux de suppression couverts :
- `approveMovieDeletion` : supprime l'image du film + images des recettes liées
- `deleteMovieDirect` : idem
- `approveRecipeDelete` : supprime `picture` + `pending_picture` + toutes les `RecipePictures`
- `deleteRecipeDirect` : idem
- `rejectRecipeEdit` : supprime uniquement `pending_picture`
- `approveRecipeEdit` : remplace l'ancienne image par `pending_picture`
- `validateUserPhoto` : remplace l'ancienne photo profil
- `rejectUserPhoto` : supprime `pending_picture`
- `rejectUserBanner` : supprime `banner_image`
- `deleteRecipePicture` / `deleteRecipePictureJson` : supprime une photo complémentaire

**Risque identifié** : En cas d'erreur applicative après `unlinkIfExists` et avant
`await Model.destroy()`, le fichier est supprimé mais l'entrée BDD subsiste (références
vers un fichier inexistant). Ce cas est rare mais non protégé par transaction.

### 2.5 Jobs de nettoyage automatique

Aucun scheduler, cron job ou worker de nettoyage automatique n'a été trouvé :
- Pas de `node-cron`, `agenda`, `bullmq`, `bull` dans `package.json`
- Aucun fichier contenant `cron`, `scheduler`, ou `job` dans `app/`

**Il n'existe pas de nettoyage automatique des fichiers orphelins.**

---

## ANNEXE — ANOMALIES RÉFÉRENCÉES

### A1 — CONTRAINTE UNIQUE INCOMPLÈTE SUR `favorites`

**Gravité : ROUGE (critique)**

La table `favorites` possède DEUX contraintes UNIQUE en conflit :
1. `favorites_id_user_id_movie_key` : UNIQUE(id_user, entity_id) — **sans entity_type**
2. `favorites_user_entity_idx` : UNIQUE(id_user, entity_type, entity_id) — **correcte**

La première contrainte (A) empêche un utilisateur de mettre en favori un film ET une
recette qui auraient le même ID numérique. Par exemple, si le film id=5 et la recette
id=5 existent, un user ne peut favoriser que l'un des deux.

**Recommandation** : Supprimer la contrainte `favorites_id_user_id_movie_key` qui
est redondante et plus restrictive que nécessaire. La contrainte
`favorites_user_entity_idx` suffit.

```sql
-- CORRECTION (à exécuter après validation)
ALTER TABLE favorites DROP CONSTRAINT favorites_id_user_id_movie_key;
```

---

### A2 — NORMALISATION MANQUANTE SUR `category` ET `genre`

**Gravité : ORANGE (majeur)**

Les valeurs de `recipes.category` et `movies.genre` mélangent majuscules et minuscules :
- `"dessert"` et `"Dessert"` coexistent dans recipes
- `"plat"` et `"Plat"` coexistent dans recipes

Cela peut causer des résultats incorrects lors de filtrages par catégorie.

**Recommandation** : Normaliser en lowercase via `LOWER()` à l'insertion, ou ajouter
une contrainte CHECK avec des valeurs autorisées.

```sql
-- CORRECTION (à valider selon les valeurs attendues)
UPDATE recipes SET category = LOWER(category) WHERE category != LOWER(category);
UPDATE movies SET genre = LOWER(genre) WHERE genre != LOWER(genre);
```

---

### A3 — TYPAGE INCOHÉRENT DE `user_points.level_code`

**Gravité : ORANGE (majeur)**

La colonne `level_code` est déclarée `VARCHAR(20)` avec une valeur par défaut
`'figurant'` (string), mais contient actuellement des entiers (`"1"`, `"3"`).
Les requêtes utilisent `level_code::integer` ce qui fonctionnerait sur les données
actuelles mais est fragile.

**Recommandation** : Si `level_code` doit être un entier, changer son type en
`SMALLINT` et mettre la valeur par défaut à `1`. Si c'est un code textuel,
uniformiser les valeurs.

---

### A4 — FK `NO ACTION` SANS GESTION CASCADE APPLICATIVE ROBUSTE

**Gravité : JAUNE (mineur)**

9 foreign keys utilisent `NO ACTION` (pas de suppression automatique en cascade).
Le code applicatif dans `admin.controllers.js` gère les suppressions manuellement,
mais cette approche ne protège pas contre :
- Les suppressions effectuées directement en BDD (psql, pgAdmin)
- Un crash entre la suppression des fichiers et la suppression BDD

**Recommandation** : Pour les relations critiques, envisager d'ajouter `ON DELETE CASCADE`
sur `recipes.id_user`, `recipes.id_movie`, `notices.id_recipe`, `notices.id_user`.

---

### A5 — FILM "RATATOUILLE" SANS TMDB_ID NI IMAGE

**Gravité : JAUNE (mineur)**

Le film Ratatouille (id=16) est en statut `pending` avec :
- `tmdb_id = NULL`
- `picture = NULL`

Ce film a été créé sans données TMDB. À corriger lors de la validation admin.

---

### A6 — IMAGES PROFILS ORPHELINES SUR DISQUE

**Gravité : JAUNE (mineur)**

3 fichiers dans `app/public/images/profiles/` ne correspondent à aucun utilisateur :
- `profile-ddd-1771088850097-968891793.png`
- `profile-seb-1773597993169-781499167.png`
- `profile-seb-1774619378618-977201511.png`

Ces fichiers sont des versions précédentes de photos de profil non supprimées.

**Recommandation** : Supprimer manuellement ces 3 fichiers.

---

### A7 — TABLES `users_recipes` ET `notices` SANS INDEX MÉTIER

**Gravité : VERT (faible)**

Les tables `users_recipes` et `notices` n'ont pas d'index sur leurs colonnes de
jointure (`id_user`, `id_recipe`). Actuellement vides en développement, mais à
corriger avant production.

```sql
-- A ajouter avant mise en production
CREATE INDEX idx_users_recipes_user    ON users_recipes(id_user);
CREATE INDEX idx_users_recipes_recipe  ON users_recipes(id_recipe);
CREATE INDEX idx_notices_user          ON notices(id_user);
CREATE INDEX idx_notices_recipe        ON notices(id_recipe);
```

---

### A8 — DEAD TUPLES ÉLEVÉS (BESOIN VACUUM)

**Gravité : VERT (faible / informatif)**

Les tables `user_points` et `users` ont un ratio dead tuples très élevé (normal
en développement avec beaucoup d'UPDATE de test). Un `VACUUM ANALYZE` est recommandé.

```sql
-- READ-ONLY : vérification uniquement
SELECT relname, n_dead_tup FROM pg_stat_user_tables WHERE n_dead_tup > 0 ORDER BY n_dead_tup DESC;

-- Pour corriger (à exécuter séparément) :
-- VACUUM ANALYZE;
```

---

## Récapitulatif des anomalies

| # | Anomalie | Table | Gravité | Action |
|---|---|---|---|---|
| A1 | Contrainte UNIQUE incomplète | favorites | ROUGE | Supprimer `favorites_id_user_id_movie_key` |
| A2 | Normalisation category/genre | recipes, movies | ORANGE | Uniformiser en lowercase |
| A3 | Typage incohérent level_code | user_points | ORANGE | Changer en SMALLINT ou uniformiser |
| A4 | FK sans CASCADE | recipes, notices | JAUNE | Évaluer ajout CASCADE |
| A5 | Film sans tmdb_id/image | movies (id=16) | JAUNE | Corriger lors validation admin |
| A6 | Images profil orphelines | /images/profiles/ | JAUNE | Supprimer 3 fichiers |
| A7 | Index manquants | users_recipes, notices | VERT | Ajouter avant production |
| A8 | Dead tuples élevés | users, user_points | VERT | VACUUM ANALYZE |

---

## Conclusion

La base de données Ciné Délices est **structurellement saine** pour un environnement
de développement actif :

- **0 donnée orpheline** — toutes les FK sont respectées
- **0 doublon** — unicité email, pseudo, slug garantie
- **0 timestamp incohérent**
- **0 valeur invalide** (emails, points, années, temps)
- **Cohérence parfaite BDD ↔ disque** pour les images recettes

La seule anomalie critique (A1) est un bug de schéma sur la table `favorites`
qui n'a aucun impact en développement (table vide) mais doit être corrigé avant
la mise en production pour éviter des collisions de favoris entre films et recettes.

Les anomalies de normalisation (A2, A3) sont cosmétiques mais recommandées avant
la livraison finale.
