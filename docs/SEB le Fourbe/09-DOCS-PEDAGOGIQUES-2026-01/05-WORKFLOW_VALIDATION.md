# Fiche pédagogique — Workflow validation (films/recettes/photos)

## 🎯 Objectif
Garantir que **rien n’est publié sans validation admin**, tout en gardant un flux rapide et compréhensible.

## ✅ Changements effectués
- Validation initiale obligatoire pour :
  - Films
  - Recettes
  - Photos de profil
  - Avis
- UI admin avec actions rapides **Valider / Refuser**.
- Affichage public filtré par `status: true`.

## 🧩 Fichiers modifiés (ou clés)
- `app/controllers/admin.controllers.js`
- `app/controllers/movies.controllers.js`
- `app/controllers/recipes-movie.controllers.js`
- `app/controllers/home.controllers.js`
- `app/views/admin-dashboard.ejs`
- `app/utils/admin-data-loader.js`

## 👀 Résultat attendu / impact UX
- Aucun contenu “brouillon” sur le site public.
- Admin voit immédiatement ce qui est en attente.
- Feedback visuel clair : badges, toasts, états.

## 🧠 Logique & décisions techniques
- **Sécurité** : séparation stricte user/admin.
- **Intégrité BDD** : validation = changement de statut.
- **Cohérence UX** : même pattern partout.

## 🧰 Tips & Ressources
- Refaire le parcours “ajout film + recette” pour vérifier le flux.
- Vérifier les tables `movies`, `recipes`, `notices`, `users`.

## 🎯 Mini‑défi
Décrire le flux en 5 étapes entre “ajout par l’utilisateur” et “publication”.
