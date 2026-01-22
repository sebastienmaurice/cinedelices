# Dépannage : Images Indiana Jones non affichées

**Date** : 18 décembre 2025  
**Problème** : Les images card (page `/movies`) et banner (page `/recipes-movie/5`) de "Indiana Jones et les Aventuriers de l'Arche perdue" n'apparaissent pas.

## Vérifications effectuées

### ✅ Fichiers existants

Les fichiers existent bien dans le système de fichiers :

- Banner : `/app/public/images/movies/banners/banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg` ✅
- Card : `/app/public/images/movies/cards/card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg` ✅

### ✅ Chemins générés correctement

Le helper `movie-image-helper.js` génère correctement les chemins :

- Banner path : `/images/movies/banners/banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg` ✅
- Card path : `/images/movies/cards/card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg` ✅

### ✅ Controllers enrichissent les films

- `recipes-movie.controllers.js` : `movieRecipes` enrichit le film avec `enrichMovieWithImagePaths()` ✅
- `movies.controllers.js` : `moviesList` enrichit les films avec `enrichMoviesWithImagePaths()` ✅

### ✅ Vues utilisent les bons chemins

- `recipes-movie.ejs` : Utilise `<%= movie.bannerPath || movie.picture %>` ✅
- `movies.ejs` : Utilise `<%= movie.cardPath || movie.picture %>` ✅

## Corrections apportées

1. **Nettoyage des titres** : Normalisation des apostrophes typographiques et des espaces insécables dans `enrichMovieWithImagePaths()`.
2. **Création d'un nouvel objet enrichi** : Évite toute mutation de l'objet Sequelize original.

## Actions de dépannage recommandées

1. **Vider le cache du navigateur** : Les anciennes images peuvent être mises en cache.

   - Chrome/Edge : Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
   - Firefox : Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
   - Safari : Cmd+Option+E

2. **Vérifier les permissions des fichiers** :

   ```bash
   ls -lh app/public/images/movies/banners/banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg
   ls -lh app/public/images/movies/cards/card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg
   ```

   Les fichiers doivent être lisibles par le serveur web (généralement `www-data` ou `apache`).

3. **Vérifier les logs du serveur** : Consulter les logs pour voir si des erreurs 404 sont générées lors du chargement des images.

4. **Tester l'URL directement** : Ouvrir dans le navigateur :

   - `http://localhost:3000/images/movies/banners/banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
   - `http://localhost:3000/images/movies/cards/card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`

   Si les images ne s'affichent pas directement, c'est un problème de serveur/permissions, pas de code.

5. **Vérifier les logs de l'application** : Ajouter des logs temporaires dans `enrichMovieWithImagePaths()` pour voir les valeurs réelles du titre et des chemins générés.

## Code actuel

Le code dans `movie-image-helper.js` normalise maintenant les titres :

```javascript
// Nettoyer le titre : remplacer les apostrophes typographiques et espaces insécables
if (title) {
  title = title
    .replace(/['']/g, "'") // Normaliser les apostrophes typographiques vers apostrophe droite
    .replace(/\u00A0/g, " ") // Remplacer espaces insécables par espaces normaux
    .trim();
}
```

Cela garantit que même si la base de données contient des caractères spéciaux différents, le slug généré sera cohérent.
