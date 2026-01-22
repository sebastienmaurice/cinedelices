# Fiche pédagogique — Page Recettes (/recipes-movie)

## 🎯 Objectif
Afficher uniquement les **recettes validées**, liées à des films validés, avec un visuel fiable sur la bannière et les cards.

## ✅ Changements effectués
- Filtrage des **recettes validées** dans les pages publiques.
- Filtrage des **films validés** dans les pages de détails recettes.
- Correction des chemins d’images pour les films validés.

## 🧩 Fichiers modifiés (ou clés)
- `app/controllers/recipes-movie.controllers.js`
- `app/utils/movie-image-helper.js`

## 👀 Résultat attendu / impact UX
- Aucune recette non validée n’apparaît sur le site public.
- La bannière film sur `/recipes-movie/:id` affiche l’image correcte.
- UX cohérente : pas de contenu “invisible” ou incohérent.

## 🧠 Logique & décisions techniques
- Même principe que `/movies` : **status = true** obligatoire.
- Les images passent par un helper pour éviter des erreurs de priorité.

## 🧰 Tips & Ressources
- Si une image n’apparaît pas, vérifiez d’abord `movie.picture`.
- Voir aussi : `docs/SEB le Fourbe/07-TECHNIQUE/IMAGE_UTILS.md`

## 🎯 Mini‑défi
Pourquoi filtrer à la fois **la recette** et **son film associé** ?
