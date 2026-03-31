# Diagnostic - Affiches de Films et Recettes

## 🔍 Vérification du Flux de Création et Enregistrement

### 1. Création d'un film/recette via `/add-recipes-movies/`

**Flux attendu :**
- POST `/add-recipes-movies/movie-and-recipe`
- Contrôleur : `add-recipes-movies.controllers.js:addMovieAndRecipe()`
  - Line 345-353 : Si `tmdbId` fourni → `downloadTmdbPoster()`
  - Line 363 : `picture: picturePath` → Enregistrement en BDD
  - Line 364-366 : Si TMDB → `status: "approved"`, sinon `status: "pending"`
- Controller : `add-recipes-movies.controllers.js:addRecipe()`
  - Line 233-241 : Photos enregistrées dans `recipe_pictures`

**Point critique :**
- L'affiche est téléchargée et chemin enregistré lors de la **création du film**
- Les films TMDB sont **auto-approuvés** (source fiable)
- Les films locaux passent par l'**admin pour validation**

---

### 2. Téléchargement des affiches TMDB

**Fichier :** `utils/tmdb-image-downloader.js`

**Logique :**
```
1. downloadTmdbPoster(tmdbId, type, title)
   └─ Appelle API TMDB : /3/{movie|tv}/{tmdbId}
   └─ Récupère poster_path
   └─ Télécharge depuis : https://image.tmdb.org/t/p/w780{posterPath}
   └─ Sauvegarde dans : /images/movies/originals/{slug}.jpg
   └─ Retourne chemin relatif : /images/movies/originals/{slug}.jpg
```

**Chemins générés :**
- Format : `/images/movies/originals/{slug}.jpg`
- Exemple : `/images/movies/originals/ratatouille.jpg`

**Dossier physique :**
- `app/public/images/movies/originals/`

---

### 3. Validation Admin et Changements

**Fichier :** `admin.controllers.js:validateMovie()`
- Line 214 : Met à jour UNIQUEMENT `status: "approved"` et `validated_at`
- **IMPORTANT :** Le chemin `picture` NE CHANGE PAS lors de la validation
- Cela signifie que l'affiche doit être correcte dès la création

---

### 4. Affichage sur `/movies/`

**Fichier :** `controllers/movies.controllers.js:moviesList()`
- Line 805 : Enrichit les films via `enrichMoviesWithImagePaths(moviesWithCounts)`
- Helper : `utils/movie-image-helper.js:enrichMovieWithImagePaths()`

**Génération des chemins :**
```
Input : movie { picture: "/images/movies/originals/ratatouille.jpg", title: "Ratatouille" }
Output : {
  originalPath: "/images/movies/originals/original-ratatouille.jpg"
  bannerPath: "/images/movies/banners/banner-ratatouille.jpg"
  cardPath: "/images/movies/cards/card-ratatouille.jpg"
}
```

---

### 🔴 Problème Identification

**Symptôme utilisateur :**
> "Sur la page /movies/, certaines affiches ne sont pas correctement récupérées après validation."

**Causes possibles :**

1. ❌ **Affiche non téléchargée**
   - TMDB API clé invalide/absente
   - tmdbId invalide
   - Pas de poster_path sur TMDB
   - Équipe réseau bloquant HTTPS

2. ❌ **Chemin stocké incorrect en BDD**
   - `picture` = NULL au lieu du chemin
   - Chemin pointe vers un fichier inexistant

3. ❌ **Fichier supprimé après création**
   - Suppression manuelle du disque
   - Nettoyage de fichiers non voulu

4. ❌ **Helper génère mauvais chemins**
   - Slugification incorrecte
   - Extension différente

5. ❌ **Image par défaut utilisée en fallback**
   - Fichier n'existe pas sur disque
   - Chemin par défaut : `/images/image-default-movie.jpg`

---

## 📋 Checklist de Diagnostic

### A. Vérifier les films en BDD

- [ ] Films avec `tmdb_id` ET `picture` NULL
- [ ] Films avec `status="approved"` MAIS `picture` pointe vers fichier inexistant
- [ ] Films avec `picture` mais fichier n'existe pas sur disque
- [ ] Chemins `picture` en format incorrect

### B. Vérifier les fichiers sur disque

- [ ] `/app/public/images/movies/originals/` contient les affiches
- [ ] Permissions de lecture OK (chmod 644)
- [ ] Pas de corruptions de fichiers

### C. Vérifier le helper

- [ ] `slugifyTitle()` génère bon slug
- [ ] Fallback vers image par défaut OK
- [ ] `extractSlugFromPath()` extrait correctement le slug

### D. Vérifier l'API TMDB

- [ ] TMDB_API_KEY configurée dans .env
- [ ] clé valide et non expirée
- [ ] Requête OK vers API TMDB (pas d'erreur 401/403)

---

## 🛠️ Actions Correctives

### Fix 1: Re-télécharger les affiches TMDB

```javascript
// POST /admin/migrate-movie-images
// Voir : admin.controllers.js:migrateMovieImages()
```

### Fix 2: Vérifier et corriger les chemins

```sql
-- Films avec affiche
SELECT id, title, tmdb_id, picture, status
FROM movies
WHERE picture IS NOT NULL
AND status='approved'
LIMIT 10;

-- Films sans affiche mais avec tmdb_id
SELECT id, title, tmdb_id, picture, status
FROM movies
WHERE tmdb_id IS NOT NULL
AND picture IS NULL
LIMIT 10;
```

### Fix 3: Créer un diagnostic actif

Un script Node.js qui va :
1. Lister tous les films approuvés
2. Vérifier si le fichier existe pour chaque affiche
3. Générer le rapport des problèmes
4. Proposer les corrections

---

## 📊 Statut Attendu Après Fix

✅ Tous les films TMDB approuvés ont une affiche téléchargée
✅ Chemin `picture` valide en BDD
✅ Fichier existe sur disque
✅ Helper génère correctement les chemins
✅ Page `/movies/` affiche les affiches

