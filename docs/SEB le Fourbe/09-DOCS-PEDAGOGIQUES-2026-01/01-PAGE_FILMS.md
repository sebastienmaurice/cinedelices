# Fiche pédagogique — Page Films (/movies)

## 🎯 Objectif
Garantir que la page Films affiche **uniquement les contenus validés**, avec des visuels cohérents (images admin prioritaires) et une UX fluide.

## ✅ Changements effectués
- Filtrage strict des films **validés** pour éviter l'affichage de contenus en attente.
- Harmonisation de l’affichage des images : priorité aux images uploadées par l’admin.
- Vérification du comptage de recettes associées (uniquement validées).

## 🧩 Fichiers modifiés (ou clés)
- `app/controllers/movies.controllers.js`
- `app/utils/movie-image-helper.js`

## 👀 Résultat attendu / impact UX
- Les films non validés **ne sont jamais visibles** sur `/movies`.
- Les images de films admin apparaissent **immédiatement** (bannière + cards).
- UX plus fiable : aucun contenu “brouillon” exposé au public.

## 🧠 Logique & décisions techniques
- **Statut** (`status`) utilisé comme garde‑fou global.
- Les helpers d’images centralisent la logique pour éviter des divergences entre pages.

## 🧰 Tips & Ressources
- Pensez “source de vérité” : *status en BDD > tout le reste*.
- Voir aussi : `docs/SEB le Fourbe/07-TECHNIQUE/IMAGE_UTILS.md`

## 🎯 Mini‑défi (pour s’entraîner)
Expliquez en 3 phrases pourquoi un **simple filtre** en BDD est plus sûr qu’un filtre côté front.
