# Correction : Utilisation automatique de bannerPath et cardPath

**Date** : 18 décembre 2025  
**Objectif** : S'assurer que toutes les images de films affichées sur Ciné Délices proviennent automatiquement des dossiers `banners` et `cards` via les propriétés `bannerPath` et `cardPath`, avec fallback vers `movie.picture` si nécessaire.

## Problème identifié

Les fiches films affichaient encore des images avec `movie.picture` (ex: `/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg`) au lieu d'utiliser les chemins générés automatiquement pour les **banners** et **cards** (`bannerPath`, `cardPath`).

## Solution mise en place

### 1. Controllers corrigés

#### `movies.controllers.js`

**Fonction `searchMovies`** (lignes 23-86) :

- ✅ Ajout de l'enrichissement pour `allMovies` (ligne 29-39)
- ✅ Ajout de l'enrichissement pour `movies` (ligne 68-85)

```javascript
// Enrichir les movies avec les chemins d'images
const enrichedMovies = enrichMoviesWithImagePaths(allMovies);
// ou
const enrichedMovies = enrichMoviesWithImagePaths(movies);
```

**Fonction `moviesList`** (ligne 694-711) :

- ✅ Ajout de l'enrichissement pour `filteredMovies`

```javascript
// Enrichir les movies avec les chemins d'images (banner/card)
const enrichedMovies = enrichMoviesWithImagePaths(filteredMovies);
```

**Fonction `getMovieById`** (ligne 729-776) :

- ✅ Retourne maintenant `cardPath`, `bannerPath`, et `originalPath` en plus de `picture`

```javascript
movie: {
  id: enrichedMovie.id,
  title: enrichedMovie.title,
  year: enrichedMovie.year,
  genre: enrichedMovie.genre,
  picture: enrichedMovie.cardPath, // Retourner cardPath pour les miniatures
  cardPath: enrichedMovie.cardPath,
  bannerPath: enrichedMovie.bannerPath,
  originalPath: enrichedMovie.originalPath,
}
```

#### `admin.controllers.js`

**Fonction `editRecipe`** (ligne 52-76) :

- ✅ Ajout de l'enrichissement pour `movies`

```javascript
// Enrichir les movies avec les chemins d'images
const enrichedMovies = enrichMoviesWithImagePaths(movies);
```

**Note** : Les fonctions `admin` et `editMovie` étaient déjà correctement enrichies.

### 2. Vues EJS corrigées

#### `add-recipes-movies.ejs` (ligne 200-203)

- ✅ Condition d'existence d'image modifiée pour utiliser `cardPath || picture`

```ejs
<% let hasMovieWithImage = false; if (typeof newMovie !==
"undefined" && newMovie && (newMovie.cardPath || newMovie.picture) && typeof
(newMovie.cardPath || newMovie.picture) === "string" && (newMovie.cardPath || newMovie.picture).trim() !== "")
{ hasMovieWithImage = true; } %>
```

#### `home.ejs` (ligne 230)

- ✅ Correction du premier film (`topMovies[0]`) pour utiliser `cardPath || picture`

```ejs
src="<%= topMovies[0].cardPath || topMovies[0].picture %>"
```

**Note** : Les autres films (`topMovies[1]`, `[2]`, `[3]`) utilisaient déjà `cardPath || picture`.

#### Autres vues déjà correctes

- ✅ `movies.ejs` : Utilise `movie.cardPath || movie.picture`
- ✅ `recipes-movie.ejs` : Utilise `movie.bannerPath || movie.picture`
- ✅ `admin-dashboard.ejs` : Utilise `upMovie.cardPath || upMovie.picture`

### 3. Scripts JavaScript corrigés

#### `load-existing-movie-image.js` (ligne 28-46)

- ✅ Utilise maintenant `cardPath` en priorité avec fallback sur `picture`

```javascript
const imagePath = data.movie?.cardPath || data.movie?.picture;
if (data.success && data.movie && imagePath) {
  filmSelectedImage.src = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  // ...
}
```

#### `tmdb-validator.js`

**Fonction `createSuggestionItem`** (ligne 353-359) :

- ✅ Utilise `cardPath || picture` pour les films locaux

```javascript
const localImage = movie.cardPath || movie.picture;
const posterUrl = movie.isLocal
  ? localImage
    ? localImage.startsWith("http")
      ? localImage
      : `/${localImage}`
    : null
  : movie.poster_path;
```

**Fonction `updateFilmImage`** (ligne 509-517) :

- ✅ Utilise `cardPath` en priorité

```javascript
const imagePath = data.movie?.cardPath || data.movie?.picture;
if (data.success && data.movie && imagePath) {
  filmSelectedImage.src = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  // ...
}
```

#### `movie-autocomplete-form.js` (ligne 293-301)

- ✅ Utilise `cardPath` en priorité

```javascript
const imagePath = data.movie?.cardPath || data.movie?.picture;
if (data.success && data.movie && imagePath) {
  filmSelectedImage.src = imagePath.startsWith("/")
    ? imagePath
    : `/${imagePath}`;
  // ...
}
```

## Résumé des modifications

### Fichiers modifiés

1. **Controllers** :

   - `app/controllers/movies.controllers.js` : 3 fonctions corrigées
   - `app/controllers/admin.controllers.js` : 1 fonction corrigée

2. **Vues EJS** :

   - `app/views/add-recipes-movies.ejs` : Condition d'existence d'image
   - `app/views/home.ejs` : Premier film corrigé

3. **Scripts JavaScript** :
   - `app/public/js/load-existing-movie-image.js`
   - `app/public/js/tmdb-validator.js`
   - `app/public/js/movie-autocomplete-form.js`

### Fonctionnement final

1. **Helper centralisé** : `movie-image-helper.js` génère automatiquement :

   - `bannerPath` : `/images/movies/banners/banner-{slug}.jpg`
   - `cardPath` : `/images/movies/cards/card-{slug}.jpg`
   - `originalPath` : `/images/movies/originals/original-{slug}.jpg`

2. **Enrichissement automatique** : Tous les controllers enrichissent les objets `movie` via :

   - `enrichMovieWithImagePaths(movie)` pour un seul film
   - `enrichMoviesWithImagePaths(movies)` pour un tableau de films

3. **Affichage dans les vues** :

   - **Bannières** : `movie.bannerPath || movie.picture`
   - **Cards** : `movie.cardPath || movie.picture`
   - **Original** : `movie.originalPath` (rarement utilisé côté frontend)

4. **Fallback** : Si `cardPath` ou `bannerPath` n'existe pas, on utilise `movie.picture` (chemin original de la BDD)

## Validation

✅ **Tous les controllers** qui passent des films aux vues utilisent maintenant l'enrichissement  
✅ **Toutes les vues** utilisent `cardPath` ou `bannerPath` avec fallback  
✅ **Tous les scripts JS** qui chargent des images de films utilisent `cardPath`  
✅ **L'API `getMovieById`** retourne tous les chemins d'images (picture, cardPath, bannerPath, originalPath)  
✅ **Aucun code upload ou recette modifié**  
✅ **La BDD reste inchangée** : le champ `picture` contient toujours le chemin original

## Notes importantes

- Les **recettes** ne sont pas concernées par cette modification (elles continuent d'utiliser `recipe.picture`)
- Le processus d'**upload Multer** n'a pas été modifié
- Les images **originales** continuent d'être stockées dans `/app/public/images/movies/originals/`
- Les images **traités** (banners, cards) sont générées par le pipeline Sharp et stockées dans `/banners/` et `/cards/`
- Si une image traitée n'existe pas encore, le fallback vers `movie.picture` permet d'éviter les images cassées

## Prochaines étapes recommandées

1. Tester l'affichage des images sur toutes les pages (home, movies, recipes-movie, add-recipes-movies, admin)
2. Vérifier qu'aucune image 404 n'apparaît
3. Confirmer que les images des dossiers `banners` et `cards` s'affichent correctement
4. Si nécessaire, régénérer les images traitées via le pipeline Sharp pour tous les films existants
