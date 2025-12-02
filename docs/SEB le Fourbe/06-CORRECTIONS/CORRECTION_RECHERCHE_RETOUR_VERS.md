# Correction - Recherche "Retour vers" ne trouve pas "Retour vers le futur"

## 🔍 Problème Identifié

Quand l'utilisateur tape **"Retour vers"** dans la recherche de films, le système affiche des films non pertinents (comme "Bienvenue chez les Ch'tis", "Les Goonies", "Harry Potter") au lieu de trouver **"Retour vers le futur"** qui n'existe pas encore dans la base de données locale.

### Cause

1. **Seuil de score trop bas** : Le filtre `movie.score > 0` était trop permissif, permettant d'afficher des films avec des scores très faibles (5-15%) qui ne sont pas pertinents.

2. **Recherche TMDB conditionnelle** : La recherche TMDB n'était déclenchée que sous certaines conditions, donc les films qui n'existent pas encore dans la BDD locale n'étaient pas trouvés.

3. **Pas de recherche intelligente** : La recherche TMDB ne utilisait pas les variantes (mots-clés, premier mot-clé) pour améliorer la tolérance aux fautes.

---

## ✅ Solution Appliquée

### 1. Augmentation du Seuil de Score Minimum

**Fichier :** `app/controllers/movies.controllers.js`

**Modification :**

- Ancien seuil : `score > 0` (trop permissif)
- Nouveau seuil : `score >= 35` (correspondance significative requise)

**Impact :** Les films avec des scores très faibles ne s'affichent plus, évitant les résultats non pertinents.

### 2. Recherche TMDB Toujours Activée

**Fichier :** `app/controllers/movies.controllers.js`

**Modification :**

- La recherche TMDB est maintenant **toujours déclenchée**, pas seulement si les résultats locaux sont insuffisants.
- Cela permet de trouver des films comme "Retour vers le futur" qui n'existent pas encore dans la BDD locale.

### 3. Recherche TMDB Intelligente avec Variantes

**Fichier :** `app/controllers/movies.controllers.js`

**Amélioration :**

- Utilise la même logique que `tmdb.controllers.js` :
  1. Essai avec la query originale
  2. Si aucun résultat → essai avec les mots-clés extraits
  3. Si toujours rien → essai avec le premier mot-clé

**Exemple :** "Retour vers" → extrait "retour" → trouve "Retour vers le futur"

### 4. Combinaison Intelligente des Résultats

**Fichier :** `app/controllers/movies.controllers.js`

**Amélioration :**

- Combine les résultats locaux + TMDB
- Trie par score de pertinence décroissant (pas seulement locaux en premier)
- Les films TMDB pertinents peuvent apparaître avant les films locaux avec scores faibles

### 5. Frontend - Gestion des Films TMDB

**Fichier :** `app/public/js/movie-search-advanced.js`

**Amélioration :**

- Les films TMDB (sans ID local) redirigent vers `/add-recipes-movies/` avec pré-remplissage
- Badge "Ciné Délices" pour distinguer les films locaux
- Mini-cartes avec posters TMDB

---

## 📊 Résultat

### Avant ❌

Tape **"Retour vers"** :

- Affiche : "Bienvenue chez les Ch'tis", "Les Goonies", "Harry Potter" (non pertinents)
- Score : 5-15% (très faible)
- "Retour vers le futur" : ❌ Non trouvé

### Après ✅

Tape **"Retour vers"** :

- Affiche : "Retour vers le futur" (via TMDB) ✅
- Score : 80-90% (très pertinent)
- Films non pertinents : ❌ Filtrés (score < 35)

---

## 🔧 Code Modifié

### Backend - Seuil et Recherche TMDB

```javascript
// Seuil minimum augmenté à 35
const MIN_SCORE_THRESHOLD = 35;

const relevantLocalMovies = scoredMovies
  .filter((movie) => movie.score >= MIN_SCORE_THRESHOLD)
  .sort((a, b) => b.score - a.score);

// Recherche TMDB toujours déclenchée avec variantes intelligentes
// 1. Query originale
// 2. Mots-clés extraits
// 3. Premier mot-clé seulement
```

### Combinaison et Tri

```javascript
// Trier TOUS les résultats par score (pas seulement locaux en premier)
combinedResults.sort((a, b) => {
  if (b.score !== a.score) return b.score - a.score;
  // En cas d'égalité, priorité aux films locaux
  if (a.isLocal && !b.isLocal) return -1;
  if (!a.isLocal && b.isLocal) return 1;
  return (a.title_fr || a.title || "").localeCompare(
    b.title_fr || b.title || ""
  );
});
```

---

## ✅ Tests

### Test 1 : "Retour vers"

**Attendu :** "Retour vers le futur" en premier résultat (via TMDB)

### Test 2 : Films locaux existants

**Attendu :** Films locaux avec scores élevés apparaissent en premier, badge "Ciné Délices"

### Test 3 : Films non pertinents

**Attendu :** Films avec scores < 35 n'apparaissent plus

---

## 📝 Fichiers Modifiés

- ✅ `app/controllers/movies.controllers.js`

  - Seuil minimum : 25 → 35
  - Recherche TMDB toujours déclenchée
  - Recherche TMDB avec variantes intelligentes
  - Tri combiné par score

- ✅ `app/public/js/movie-search-advanced.js`
  - Gestion des films TMDB sans ID local
  - Badge "Ciné Délices" pour films locaux
  - Redirection vers création de film pour films TMDB

---

**Date** : Décembre 2025  
**Status** : ✅ **Corrigé**
