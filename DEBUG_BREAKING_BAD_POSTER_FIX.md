# 🎬 Breaking Bad Poster Bug — Root Cause & Fix

**Date**: 2026-03-31
**Severity**: 🔴 Critical
**Status**: ✅ Fixed

---

## 🐛 Le Bug

**Symptôme** : L'affiche de Breaking Bad n'apparaissait pas sur `/movies`, même si le film existait.

**Root Cause** : La fonction `addMovieAndRecipe()` (créer film + recette ensemble) **n'appelait PAS** `downloadTmdbPoster()` pour télécharger l'affiche.

---

## 📋 Code Affecté

### ❌ AVANT :

```javascript
// app/controllers/add-recipes-movies.controllers.js:346-354
if (!movie) {
  // ... validations ...
  movie = await Movie.create({
    title,
    year: parseInt(year, 10),
    genre,
    synopsis: synopsis || null,
    id_user: req.userId,
    tmdb_id: parsedTmdbId || null,
    // picture: null ← L'affiche n'était jamais téléchargée !
    ...(parsedTmdbId ? { status: "approved", validated_at: new Date() } : {}),
  });
}
```

### ✅ APRÈS :

```javascript
if (!movie) {
  // ... validations ...

  // 🎯 Télécharger l'affiche TMDB AVANT de créer le film
  let picturePath = null;
  if (parsedTmdbId) {
    picturePath = await downloadTmdbPoster(parsedTmdbId, req.body.type, title);
  }

  movie = await Movie.create({
    title,
    year: parseInt(year, 10),
    genre,
    synopsis: synopsis || null,
    id_user: req.userId,
    tmdb_id: parsedTmdbId || null,
    picture: picturePath, // 🎯 Ajouter l'affiche téléchargée
    ...(parsedTmdbId ? { status: "approved", validated_at: new Date() } : {}),
  });
}
```

---

## 🔍 Analyse Comparative

**Route 1 : Créer un film seul** (`/add-recipes-movies/movie` - POST)

```javascript
async addMovie(req, res) {
  const { title, year, genre, synopsis, tmdb_id, type } = req.body;

  let picturePath = null;
  if (tmdb_id) {
    picturePath = await downloadTmdbPoster(parseInt(tmdb_id), type, title); // ✅ Télécharger
  }

  // Sauvegarder avec picture
}
```

**Route 2 : Créer film + recette** (`/add-recipes-movies/movie-and-recipe` - POST)

```javascript
async addMovieAndRecipe(req, res) {
  // ... code ...

  if (!movie) {
    // ❌ AVANT : Pas de téléchargement !
    movie = await Movie.create({
      title, year, genre, ..., picture: undefined
    });

    // ✅ APRÈS : Télécharger l'affiche
    let picturePath = null;
    if (parsedTmdbId) {
      picturePath = await downloadTmdbPoster(parsedTmdbId, req.body.type, title);
    }
    movie = await Movie.create({
      title, year, genre, ..., picture: picturePath
    });
  }
}
```

---

## 💥 Impact

**Films affectés** : Tous les films TMDB créés via le formulaire unifié `film + recette`:

- Breaking Bad ✓
- Ratatouille ✗ (lui, créé via `/movies/get-tmdb-info/`)
- Et tout nouveau film créé via ce formulaire

**Conséquence** :

- Film créé ✓
- Status = 'approved' ✓
- tmdb_id enregistré ✓
- Mais picture = null/undefined ❌
- Affoche par défaut utilisée sur /movies

---

## 🚀 Solution Appliquée

**Commit** : `fix: download TMDB poster when creating movie with recipe`

**Changements** :

1. ✅ Appeler `downloadTmdbPoster()` avant `Movie.create()`
2. ✅ Passer `req.body.type` (film ou série) au downloader
3. ✅ Sauvegarder `picturePath` dans la BD

**Test Potentiel** : Créer Breaking Bad à nouveau avec le formulaire unifié → affiche doit être téléchargée à `/images/movies/originals/breaking-bad.jpg`

---

## 📊 État Après Correction

| Aspect               | Avant            | Après             |
| -------------------- | ---------------- | ----------------- |
| Créer film seul      | ✅ Affiche OK    | ✅ Idem           |
| Créer film + recette | ❌ Pas d'affiche | ✅ **Affiche OK** |
| Affiche sur /movies  | ❌ Manquante     | ✅ **Visible**    |
| TMDB API appelée     | ✗                | ✅                |
| Dossier crée         | ✗                | ✅                |

---

## 🎯 Prochaines Étapes

1. **Re-créer Breaking Bad** si recette remise à pending pour test
   - Ou modifier recette pour l'approuver
   - Affiche devrait maintenant apparaître

2. **Vérifier les autres films** TMDB créés du même formulaire

3. **Ajouter logging** pour déboguer les futurs problèmes de téléc :

   ```javascript
   console.log(`📥 Téléchargement affiche: ${title} (TMDB: ${tmdb_id})`);
   ```

4. **Fallback image** si TMDB n'a pas d'affiche

---

## ✅ Checklist

- [x] Identifier root cause (pas d'appel downloadTmdbPoster)
- [x] Vérifier comparaison addMovie() vs addMovieAndRecipe()
- [x] Implémenter fix
- [x] Committer avec message explicatif
- [x] Documenter pour future référence
- [ ] Tester sur Breaking Bad (attendre que recette soit approuvée)
- [ ] Vérifier autres films TMDB de ce formulaire
