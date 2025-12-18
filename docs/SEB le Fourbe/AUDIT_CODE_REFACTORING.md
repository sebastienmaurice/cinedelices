# Audit Global du Code - Ciné Délices

**Date** : 18 décembre 2025  
**Objectif** : Identifier le code dupliqué, inutile ou pouvant être simplifié avant refactoring.

---

## 📋 Résumé Exécutif

Cet audit a identifié **plusieurs zones de duplication et d'amélioration** dans le codebase :

- **Code dupliqué** : Gestion d'erreurs, requêtes BDD répétitives, logique d'enrichissement
- **Code inutile** : Logs de debug, console.log non nécessaires
- **Opportunités de centralisation** : Middlewares Multer, helpers d'erreurs, requêtes admin

---

## 🔍 1. CONTROLLERS

### 1.1 Duplication de la gestion d'erreurs

**Fichiers concernés** : Tous les controllers (`*.controllers.js`)

**Problème** :
Le pattern suivant est répété dans **chaque fonction async** de chaque controller :

```javascript
catch (error) {
  console.error(error);
  res.status(500).render("error", {
    error: "500",
    message: "Erreur serveur.",
    role: req.userRole,
  });
}
```

**Occurrences** : ~15-20 occurrences dans :
- `admin.controllers.js` (4 occurrences)
- `add-recipes-movies.controllers.js` (3 occurrences)
- `movies.controllers.js` (plusieurs occurrences)
- `recipes-movie.controllers.js` (3 occurrences)
- `home.controllers.js` (1 occurrence)
- `auth.controller.js` (1 occurrence)

**Suggestion** :
Créer un middleware d'erreur global (`error-handler.middleware.js`) ou une fonction helper `handleError(error, req, res)` centralisée.

---

### 1.2 Duplication des réponses d'erreur 404

**Fichiers concernés** : Tous les controllers

**Problème** :
Pattern répété pour gérer les ressources non trouvées :

```javascript
if (!movie) {
  return res.status(404).render("error", {
    error: "404",
    message: "Film introuvable.",
    role: req.userRole,
  });
}
```

**Variations** :
- "Film introuvable."
- "Film non trouvé."
- "Film introuvable pour cette categorie."
- "recette indisponible."
- "Utilisateur non trouvé"
- "Utilisateur introuvable."

**Occurrences** : ~10-12 occurrences

**Suggestion** :
Créer une fonction helper `renderNotFound(res, resourceType, req.userRole)` ou un middleware.

---

### 1.3 Duplication des requêtes admin

**Fichier** : `app/controllers/admin.controllers.js`

**Problème** :
Les fonctions `admin()`, `editRecipe()` et `editMovie()` font **exactement les mêmes requêtes** :

```javascript
const recipes = await Recipe.findAll({ where: { status: false } });
const movies = await Movie.findAll({ where: { status: false } });
const avis = await Notice.findAll();
const users = await User.findAll();
```

**Occurrences** : 3 fois dans le même fichier

**Suggestion** :
Créer une fonction helper `loadAdminData()` qui retourne ces 4 requêtes et peut être réutilisée, ou utiliser un middleware qui pré-charge ces données.

---

### 1.4 Duplication de l'enrichissement des films

**Fichiers concernés** : Plusieurs controllers

**Problème** :
Le code suivant est répété :

```javascript
// Enrichir les movies avec les chemins d'images
const enrichedMovies = enrichMoviesWithImagePaths(movies);
```

**Bon point** : ✅ La logique est déjà centralisée dans `movie-image-helper.js`, mais l'appel est répété.

**Occurrences** : 
- `admin.controllers.js` : 3 fois
- `movies.controllers.js` : plusieurs fois
- `home.controllers.js` : 1 fois

**Suggestion** :
C'est déjà bien centralisé, mais on pourrait créer un helper de controller qui combine `findAll` + `enrichMoviesWithImagePaths`.

---

### 1.5 Logs de debug non nécessaires

**Fichiers concernés** :
- `app/controllers/recipes-movie.controllers.js` : `console.log(req.params)`, `console.log(recipes)`, `console.log("note generale:", averageQuote)`
- `app/controllers/admin.controllers.js` : `console.log("fichierData:", updateData)`
- `app/controllers/auth.controller.js` : `console.log(req.params.id)`

**Occurrences** : ~5-6 `console.log` de debug

**Suggestion** :
- Supprimer les logs de debug ou les remplacer par le système de logging centralisé (`logger.js`)
- Utiliser un système de log conditionnel basé sur `process.env.NODE_ENV`

---

### 1.6 Duplication de la logique de validation/rejet

**Fichier** : `app/controllers/admin.controllers.js`

**Problème** :
Les fonctions `validateMovie`/`rejectMovie` et `validateRecipe`/`rejectRecipe` suivent un pattern très similaire :

```javascript
// Pattern répété 4 fois
async validateXxx(req, res) {
  try {
    const xxxId = parseInt(req.params.id);
    await Xxx.update({ status: true }, { where: { id: xxxId } });
    res.redirect("/admin?success=xxx_validated");
  } catch (error) {
    console.error("Erreur lors de la validation...", error);
    res.status(500).send("Erreur lors de la validation...");
  }
}
```

**Occurrences** : 4 fonctions (validateMovie, rejectMovie, validateRecipe, rejectRecipe)

**Suggestion** :
Créer des fonctions génériques `validateEntity(req, res, Model, successParam)` et `rejectEntity(req, res, Model, successParam)`.

---

### 1.7 Code commenté non utilisé

**Fichier** : `app/controllers/add-recipes-movies.controllers.js`

**Problème** :
- Ligne 87 : `//loginPopup: false,` commenté
- Ligne 18 : `loginPopup: false` dans le render d'erreur

**Suggestion** :
Nettoyer le code commenté ou l'activer si nécessaire.

---

## 🔧 2. MIDDLEWARES

### 2.1 Duplication du fileFilter Multer

**Fichiers concernés** :
- `app/middlewares/upload.middleware.js`
- `app/middlewares/upload-movie.middleware.js`

**Problème** :
Le `fileFilter` est **identique** dans les deux fichiers :

```javascript
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Format de fichier non supporté. Utilisez JPG, JPEG, PNG ou WEBP."
      ),
      false
    );
  }
};
```

**Occurrences** : 2 fois (code identique)

**Suggestion** :
Créer un module `upload-config.js` avec une fonction `createFileFilter()` exportée et réutilisée dans les deux middlewares.

---

### 2.2 Duplication des limites de taille

**Fichiers concernés** :
- `app/middlewares/upload.middleware.js`
- `app/middlewares/upload-movie.middleware.js`

**Problème** :
La limite de taille est identique : `fileSize: 5 * 1024 * 1024` (5 MB)

**Occurrences** : 2 fois

**Suggestion** :
Centraliser dans `upload-config.js` avec une constante `MAX_FILE_SIZE`.

---

## 📁 3. UTILS

### 3.1 Fonction extractKeywords dupliquée

**Fichiers concernés** :
- `app/controllers/tmdb.controllers.js` (ligne 15-47)
- `app/utils/search-utils.js` (probablement)

**Problème** :
La fonction `extractKeywords` semble être définie dans `tmdb.controllers.js` alors qu'elle existe peut-être déjà dans `search-utils.js`.

**Suggestion** :
Vérifier si elle existe déjà dans `search-utils.js` et supprimer la duplication dans `tmdb.controllers.js`.

---

### 3.2 Cleanup.js non activé

**Fichier** : `app/utils/cleanup.js`

**Problème** :
- `CLEANUP_ENABLED = false` : fonctionnalité préparée mais jamais utilisée
- Fonction `cleanupTempFiles()` a un TODO et n'est pas implémentée

**Suggestion** :
- Si non prévu d'utilisation proche : supprimer ou documenter clairement
- Si prévu : compléter l'implémentation ou créer un ticket

---

## 🎨 4. FRONTEND (JavaScript)

### 4.1 Fonction updateFilmImage dupliquée

**Fichiers concernés** :
- `app/public/js/tmdb-validator.js` (ligne ~494)
- `app/public/js/movie-autocomplete-form.js` (ligne ~277)
- `app/public/js/load-existing-movie-image.js` (logique similaire)

**Problème** :
La fonction `updateFilmImage(movie)` est **dupliquée** avec une logique presque identique dans plusieurs fichiers :

```javascript
async function updateFilmImage(movie) {
  const filmSelectedImage = document.querySelector(".film-selected-image img");
  if (!filmSelectedImage) return;
  
  if (movie && movie.id) {
    try {
      const response = await fetch(`/movies/api/get/${movie.id}`);
      if (response.ok) {
        const data = await response.json();
        const imagePath = data.movie?.cardPath || data.movie?.picture;
        // ... logique similaire
      }
    } catch (error) {
      console.error(...);
    }
  }
  // Image par défaut
}
```

**Occurrences** : 3 fois avec variations mineures

**Suggestion** :
Créer un module `film-image-utils.js` dans `/public/js/utils/` et exporter `updateFilmImage()` pour être réutilisé.

---

### 4.2 Logique de normalisation d'URL dupliquée

**Fichiers concernés** :
- `app/public/js/tmdb-validator.js`
- `app/public/js/movie-autocomplete-form.js`

**Problème** :
La fonction `updateURL()` pour nettoyer les paramètres URL semble dupliquée.

**Occurrences** : 2 fois (à vérifier)

**Suggestion** :
Centraliser dans un module utils.

---

### 4.3 Code de debug conditionnel

**Fichier** : `app/public/js/contact-about.js`

**Problème** :
- `const DEBUG_MODE = false;` avec plusieurs `if (DEBUG_MODE)` conditionnels
- Code de debug non utilisé en production

**Occurrences** : ~5-6 occurrences de `if (DEBUG_MODE)`

**Suggestion** :
- Si le debug n'est plus nécessaire : supprimer
- Si nécessaire : utiliser `process.env.NODE_ENV === 'development'` ou un système de logging

---

### 4.4 TODO non résolu

**Fichier** : `app/public/js/movie-search.js`

**Problème** :
```javascript
// TODO: Intégrer la recherche IA dans le futur
alert("La recherche IA sera disponible prochainement !");
```

**Suggestion** :
- Si la fonctionnalité est prévue : créer un ticket
- Si abandonnée : supprimer le bouton/fonctionnalité

---

## 📝 5. VUES (EJS)

### 5.1 Commentaires EJS non nécessaires

**Fichier** : `app/views/add-recipes-movies.ejs`

**Problème** :
- Commentaires EJS complexes sur plusieurs lignes qui peuvent causer des erreurs de syntaxe

**Suggestion** :
Simplifier les commentaires EJS ou les convertir en commentaires HTML si nécessaire.

---

## 🗄️ 6. BASE DE DONNÉES / MODÈLES

### 6.1 Requêtes similaires répétées

**Problème** :
Les patterns suivants sont répétés :
- `Movie.findAll({ where: { status: true/false } })`
- `Recipe.findAll({ where: { status: false } })`
- `Movie.findByPk(req.params.id)` avec vérification `!movie`

**Suggestion** :
Créer des méthodes de modèle Sequelize ou des helpers de requête réutilisables.

---

## 📊 7. STATISTIQUES

### Code dupliqué identifié

| Type | Occurrences | Fichiers concernés |
|------|-------------|-------------------|
| Gestion d'erreurs 500 | ~15-20 | Tous les controllers |
| Gestion d'erreurs 404 | ~10-12 | Tous les controllers |
| Requêtes admin | 3 | `admin.controllers.js` |
| fileFilter Multer | 2 | `upload*.middleware.js` |
| updateFilmImage JS | 3 | `tmdb-validator.js`, `movie-autocomplete-form.js`, `load-existing-movie-image.js` |
| Logs console.debug | ~8-10 | Plusieurs fichiers |

### Code inutile identifié

| Type | Fichiers |
|------|----------|
| `console.log` de debug | `recipes-movie.controllers.js`, `admin.controllers.js`, `auth.controller.js` |
| Code commenté | `add-recipes-movies.controllers.js` |
| DEBUG_MODE non utilisé | `contact-about.js` |
| Cleanup non activé | `cleanup.js` |

---

## 🎯 8. PRIORITÉS DE REFACTORING

### 🔴 Priorité Haute (Impact important, facile à corriger)

1. **Centraliser la gestion d'erreurs** (controllers)
   - Impact : Réduction de ~15-20 blocs de code dupliqué
   - Complexité : Faible

2. **Centraliser fileFilter Multer** (middlewares)
   - Impact : Réduction de duplication, facilité de maintenance
   - Complexité : Faible

3. **Centraliser updateFilmImage** (frontend JS)
   - Impact : Réduction de 3 fonctions dupliquées
   - Complexité : Faible

### 🟡 Priorité Moyenne (Impact moyen)

4. **Créer helper loadAdminData** (admin controller)
   - Impact : Réduction de 3 blocs identiques
   - Complexité : Faible-Moyenne

5. **Centraliser validate/reject entities** (admin controller)
   - Impact : Réduction de 4 fonctions similaires
   - Complexité : Moyenne

6. **Nettoyer les logs de debug**
   - Impact : Code plus propre
   - Complexité : Très faible

### 🟢 Priorité Basse (Impact faible, nettoyage)

7. **Nettoyer cleanup.js** (activer ou supprimer)
8. **Supprimer code commenté**
9. **Gérer les TODOs**

---

## 📌 9. RECOMMANDATIONS GÉNÉRALES

### Structure proposée pour le refactoring

```
app/
  utils/
    error-handler.js          # Gestion centralisée des erreurs
    upload-config.js          # Configuration Multer partagée
    admin-data-loader.js      # Helper pour charger les données admin
    entity-validator.js       # Helpers pour validate/reject
    
  public/js/
    utils/
      film-image-utils.js     # updateFilmImage et fonctions liées
      url-utils.js            # Helpers pour manipulation d'URL
```

### Bonnes pratiques identifiées (à conserver)

✅ Utilisation de `movie-image-helper.js` pour l'enrichissement  
✅ Utilisation de `logger.js` (même si pas toujours utilisé)  
✅ Structure modulaire des controllers  
✅ Séparation des routes et controllers

---

## 🔄 10. PROCHAINES ÉTAPES

1. **Créer les helpers centralisés** (étape 2)
2. **Refactorer les controllers** pour utiliser les helpers (étape 3)
3. **Refactorer les middlewares** (étape 4)
4. **Refactorer le frontend JS** (étape 5)
5. **Nettoyer le code inutile** (étape 6)
6. **Tests et validation** (étape 7)

---

**Fin du rapport d'audit**
