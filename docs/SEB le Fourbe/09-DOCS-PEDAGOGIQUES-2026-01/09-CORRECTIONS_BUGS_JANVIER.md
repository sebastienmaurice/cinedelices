# Fiche pédagogique — Corrections & ajustements (janvier)

## 🎯 Objectif
Documenter les **problèmes rencontrés** et les corrections appliquées pour stabiliser le projet.

## ✅ Corrections majeures
- **Route manquante** pour l’ajout film + recette : ajout du POST `/add-recipes-movies/movie-and-recipe`.
- **Affichage de contenus non validés** : filtres `status: true` appliqués sur `/movies`, `/recipes-movie`, `/`.
- **Images films validés invisibles** : priorité donnée aux images admin dans `movie-image-helper`.
- **Admin : onglets inactifs** : correction d’un doublon de variable JS.
- **Prévisualisation upload admin** : ajout de la preview et du zoom.
- **Erreur EJS “movie is not defined”** : correction d’un mauvais scope dans le profil.
- **Migration BDD** : ajout de colonnes nécessaires aux workflows (edit, pending, suppression).

## 🧩 Fichiers modifiés (ou clés)
- `app/routes/add-recipes-movies.route.js`
- `app/controllers/add-recipes-movies.controllers.js`
- `app/controllers/movies.controllers.js`
- `app/controllers/recipes-movie.controllers.js`
- `app/controllers/home.controllers.js`
- `app/utils/movie-image-helper.js`
- `app/public/js/admin-dashboard.js`
- `app/views/user-profile.ejs`
- `app/data/migration_add_pending_edits.sql`

## 👀 Résultat attendu / impact UX
- Plus de pages en erreur 404/500 liées aux routes ou colonnes manquantes.
- Les contenus non validés restent invisibles.
- Les admins ont une preview fiable et des actions claires.

## 🧠 Notes pédagogiques
- Les bugs récurrents venaient souvent d’un **écart entre la BDD et le code**.
- Corriger un bug UX = vérifier la donnée, la vue, puis l’interaction JS.

## 🧰 Tips & Ressources
- Toujours vérifier les **migrations** après ajout de colonnes.
- Utiliser un helper unique pour les chemins d’images.

## 🎯 Mini‑défi
Pourquoi une route manquante peut‑elle provoquer un blocage total du workflow ?
