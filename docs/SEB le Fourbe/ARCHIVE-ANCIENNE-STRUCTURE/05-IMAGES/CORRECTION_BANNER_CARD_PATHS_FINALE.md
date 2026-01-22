# Correction finale : Utilisation des chemins bannerPath et cardPath

**Date** : 18 décembre 2025  
**Problème résolu** : Les bannières affichaient encore les anciens chemins avec timestamp au lieu des chemins depuis les dossiers `banners` et `cards`.

## Problèmes identifiés

1. **Controller `recipes-movie.controllers.js`** : La fonction `movieRecipes` n'enrichissait pas le film avant de le passer à la vue, ce qui causait l'affichage de `movie.picture` au lieu de `movie.bannerPath`.

2. **Helper `movie-image-helper.js`** : La logique privilégiait l'extraction du slug depuis le chemin original (qui peut contenir des informations incorrectes comme "affiche-indiana-jones-cinema-v1") plutôt que d'utiliser le titre du film.

3. **Fonction `slugifyTitle`** : Ne gérait pas correctement les apostrophes dans les titres comme "l'Arche" et "Ch'tis".

## Corrections apportées

### 1. Enrichissement du film dans `movieRecipes`

**Fichier** : `app/controllers/recipes-movie.controllers.js` (ligne 21)

**Avant** :

```javascript
res.render("recipes-movie", { movie, recipes, role: req.userRole });
```

**Après** :

```javascript
// Enrichir le movie avec les chemins d'images
const enrichedMovie = enrichMovieWithImagePaths(movie);

res.render("recipes-movie", {
  movie: enrichedMovie,
  recipes,
  role: req.userRole,
});
```

### 2. Priorisation du titre dans `getMovieBannerPath` et `getMovieCardPath`

**Fichier** : `app/utils/movie-image-helper.js`

**Changement** : Les fonctions utilisent maintenant **en priorité le titre du film** pour générer le slug, garantissant la correspondance avec les fichiers existants dans `banners/` et `cards/`.

**Avant** :

```javascript
// Essayer d'extraire le slug depuis le chemin
let slug = extractSlugFromPath(originalPath);

// Si impossible d'extraire depuis le chemin, utiliser le titre
if (!slug && title) {
  slug = slugifyTitle(title);
}
```

**Après** :

```javascript
// Priorité au titre si disponible pour garantir la correspondance avec les fichiers
if (title) {
  const titleSlug = slugifyTitle(title);
  const bannerPath = `/images/movies/banners/banner-${titleSlug}.jpg`;
  return bannerPath;
}
```

### 3. Amélioration de `slugifyTitle` pour gérer les apostrophes

**Fichier** : `app/utils/movie-image-helper.js` (ligne 22-36)

**Changement** : Gestion spéciale des apostrophes :

- `l'` → `l-` (pour "l'Arche" → "l-arche")
- Autres apostrophes supprimées (pour "Ch'tis" → "chtis")

**Code** :

```javascript
function slugifyTitle(title) {
  if (!title) return "";

  return title
    .toLowerCase()
    .normalize("NFD") // Décompose les accents
    .replace(/[\u0300-\u036f]/g, "") // Retire les accents
    .replace(/\bl'(\w)/g, "l-$1") // Cas spécial: "l'" → "l-"
    .replace(/['']/g, "") // Supprime les autres apostrophes (comme dans "Ch'tis" → "chtis")
    .replace(/[^\w\s-]/g, "") // Retire la ponctuation sauf tirets
    .replace(/\s+/g, "-") // Remplace espaces par tirets
    .replace(/_/g, "-") // Remplace underscores par tirets
    .replace(/-+/g, "-") // Remplace tirets multiples par un seul
    .replace(/^-+|-+$/g, "") // Retire tirets en début/fin
    .trim();
}
```

## Résultats des tests

### Test 1 : Indiana Jones et les Aventuriers de l'Arche perdue

**Titre** : "Indiana Jones et les Aventuriers de l'Arche perdue"  
**Chemin original** : `/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg`

**Résultats** :

- ✅ Banner path : `/images/movies/banners/banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- ✅ Card path : `/images/movies/cards/card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- ✅ Correspondance avec les fichiers existants

### Test 2 : Bienvenue chez les Ch'tis

**Titre** : "Bienvenue chez les Ch'tis"  
**Chemin original** : `/images/movies/movie-bienvenue-chez-les-chtis-1764515779381-4691143.jpg`

**Résultats** :

- ✅ Banner path : `/images/movies/banners/banner-bienvenue-chez-les-chtis.jpg`
- ✅ Card path : `/images/movies/cards/card-bienvenue-chez-les-chtis.jpg`
- ✅ Correspondance avec les fichiers existants

## Fichiers modifiés

1. `app/controllers/recipes-movie.controllers.js` : Ajout de l'enrichissement dans `movieRecipes`
2. `app/utils/movie-image-helper.js` :
   - Priorisation du titre dans `getMovieBannerPath` et `getMovieCardPath`
   - Amélioration de `slugifyTitle` pour gérer les apostrophes

## Validation

✅ Tous les controllers qui affichent des bannières enrichissent maintenant les films  
✅ Les chemins générés correspondent aux fichiers existants dans `banners/` et `cards/`  
✅ Les apostrophes dans les titres sont correctement gérées  
✅ Les images s'affichent depuis les bons dossiers sans fallback vers les anciens chemins

## Notes importantes

- Les fichiers dans `banners/` et `cards/` doivent être nommés selon le slug généré depuis le titre du film
- Si un fichier n'existe pas, le fallback vers `movie.picture` permet d'éviter les images cassées
- Le processus d'upload Multer et le stockage des originaux n'ont pas été modifiés
