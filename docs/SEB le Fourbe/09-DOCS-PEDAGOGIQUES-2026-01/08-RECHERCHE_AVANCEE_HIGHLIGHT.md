# Fiche pédagogique — Recherche avancée / highlight

## 🎯 Objectif
Permettre une recherche rapide et pertinente avec **mise en avant** des résultats (highlight).

## ✅ Changements effectués (récapitulatif)
- Recherche combinée : BDD locale + TMDB.
- Mise en évidence des correspondances (highlight).
- UX fluide avec délai de frappe (debounce).

## 🧩 Fichiers modifiés (ou clés)
- `app/controllers/movies.controllers.js`
- `app/utils/search-utils.js`
- `app/utils/search-cache.js`
- `app/public/js/movie-search-advanced.js`

## 👀 Résultat attendu / impact UX
- Résultats rapides et cohérents.
- Priorité visuelle aux éléments pertinents.
- Expérience moderne et efficace.

## 🧠 Logique & décisions techniques
- Le highlight aide l’utilisateur à **comprendre pourquoi** un résultat apparaît.
- Le cache évite les appels inutiles.

## 🧰 Tips & Ressources
- Documentation détaillée :  
  `docs/SEB le Fourbe/07-TECHNIQUE/SYSTEME_RECHERCHE_TMDB_COMPLET.md`

## 🎯 Mini‑défi
Expliquez en 2 phrases l’intérêt du “debounce” dans une recherche live.
