# Correction - Image film et URL dans le formulaire

## 🔍 Problèmes Identifiés

### Problème 1 : Image TMDB affichée au lieu de l'image par défaut

Quand l'utilisateur arrive sur `/add-recipes-movies/?tmdb_id=105`, le poster TMDB de "Retour vers le futur" s'affichait dans le cadre `film-selected-image` alors que :

- L'image doit être **exclusivement uploadée par l'admin**
- Seule l'**image par défaut** doit être visible pour l'utilisateur

### Problème 2 : URL ne se met pas à jour

Quand l'utilisateur modifie le film (ex: tape "Harry Potter et la Coupe de feu"), les infos se mettent à jour mais :

- L'URL reste avec `?tmdb_id=105&title=Retour%20vers%20le%20futur`
- L'URL devrait être mise à jour pour supprimer ces paramètres

### Problème 3 : Image reste figée

Quand l'utilisateur change de film, l'image de "Retour vers le futur" reste figée dans `film-selected-image` au lieu de revenir à l'image par défaut.

---

## ✅ Solutions Appliquées

### 1. Suppression de l'affichage du poster TMDB

**Fichier :** `app/public/js/tmdb-form-prefill.js`

**Modification :**

- ❌ Supprimé l'appel à `updateFilmPoster(movie)` qui mettait l'image TMDB
- ✅ Ajouté `resetFilmImage()` pour forcer l'image par défaut
- ✅ Appel de `resetFilmImage()` au chargement et après pré-remplissage

**Code :**

```javascript
// 4. S'assurer que l'image reste à l'image par défaut
// L'image sera uploadée uniquement par l'admin, pas depuis TMDB
resetFilmImage();
```

### 2. Mise à jour automatique de l'URL

**Fichiers modifiés :**

- `app/public/js/tmdb-form-prefill.js`
- `app/public/js/movie-autocomplete-form.js`
- `app/public/js/tmdb-validator.js`

**Fonction ajoutée :**

```javascript
function updateURL() {
  const url = new URL(window.location.href);
  url.searchParams.delete("tmdb_id");
  url.searchParams.delete("title");

  // Mettre à jour l'URL sans recharger la page
  window.history.replaceState({}, "", url.toString());
}
```

**Appelée quand :**

- L'utilisateur sélectionne un film via l'autocomplétion locale
- L'utilisateur sélectionne un film via les suggestions TMDB
- L'utilisateur modifie manuellement les champs du film

### 3. Réinitialisation de l'image lors des changements

**Fichiers modifiés :**

- `app/public/js/tmdb-form-prefill.js`
- `app/public/js/movie-autocomplete-form.js`
- `app/public/js/tmdb-validator.js`

**Fonction ajoutée :**

```javascript
function resetFilmImage() {
  const filmSelectedImage = document.querySelector(".film-selected-image img");
  if (filmSelectedImage) {
    filmSelectedImage.src = "/images/image-default-movie.jpg";
    filmSelectedImage.alt = "Image de film par defaut";
  }
}
```

**Appelée :**

- Au chargement de la page (si `tmdb_id` présent)
- Après pré-remplissage depuis TMDB
- Lors de la sélection d'un film via autocomplétion
- Lors de la sélection d'un film via suggestions TMDB
- Lors des modifications manuelles des champs

---

## 🔄 Flux Corrigé

### Avant ❌

1. Utilisateur clique sur "Retour vers le futur" dans `/movies`
2. Redirection vers `/add-recipes-movies/?tmdb_id=105&title=Retour vers le futur`
3. Le poster TMDB s'affiche dans `film-selected-image` ❌
4. L'utilisateur modifie le film → "Harry Potter et la Coupe de feu"
5. Les infos se mettent à jour ✅
6. Mais l'URL reste `?tmdb_id=105&title=Retour%20vers%20le%20futur` ❌
7. Et l'image reste celle de "Retour vers le futur" ❌

### Après ✅

1. Utilisateur clique sur "Retour vers le futur" dans `/movies`
2. Redirection vers `/add-recipes-movies/?tmdb_id=105&title=Retour vers le futur`
3. L'image par défaut s'affiche dans `film-selected-image` ✅
4. Les infos du film sont pré-remplies ✅
5. L'utilisateur modifie le film → "Harry Potter et la Coupe de feu"
6. Les infos se mettent à jour ✅
7. L'URL est mise à jour : `/add-recipes-movies/` (sans paramètres) ✅
8. L'image reste à l'image par défaut ✅

---

## 📝 Fichiers Modifiés

### Modifiés

- ✅ `app/public/js/tmdb-form-prefill.js`

  - Supprimé `updateFilmPoster()`
  - Ajouté `resetFilmImage()`
  - Ajouté `updateURL()`
  - Ajouté `setupFilmChangeListeners()`
  - Ajouté `resetTmdbHiddenFields()`

- ✅ `app/public/js/movie-autocomplete-form.js`

  - Ajouté `resetFilmImage()` dans `selectMovie()`
  - Ajouté `updateURL()` dans `selectMovie()`

- ✅ `app/public/js/tmdb-validator.js`
  - Ajouté `resetFilmImage()` dans `selectMovie()`
  - Ajouté `updateURL()` dans `selectMovie()`

---

## ✅ Tests

### Test 1 : Arrivée avec tmdb_id dans l'URL

1. Cliquer sur "Retour vers le futur" dans `/movies`
2. Vérifier que :
   - ✅ L'image par défaut est affichée (pas le poster TMDB)
   - ✅ Les infos du film sont pré-remplies
   - ✅ L'URL contient `?tmdb_id=105&title=...`

### Test 2 : Modification du film

1. Après arrivée avec `tmdb_id`, modifier le nom du film
2. Vérifier que :
   - ✅ L'URL est mise à jour (sans `tmdb_id` et `title`)
   - ✅ L'image reste à l'image par défaut
   - ✅ Les infos se mettent à jour correctement

### Test 3 : Sélection via autocomplétion

1. Taper "Harry Potter" dans le champ film
2. Sélectionner un film depuis l'autocomplétion
3. Vérifier que :
   - ✅ L'URL est mise à jour (sans paramètres)
   - ✅ L'image reste à l'image par défaut
   - ✅ Les infos sont correctes

---

**Date** : Décembre 2025  
**Status** : ✅ **Corrigé**
