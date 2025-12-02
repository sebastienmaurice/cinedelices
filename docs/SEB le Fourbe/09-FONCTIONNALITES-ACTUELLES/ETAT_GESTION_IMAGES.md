# État de la gestion des images - Ciné Délices

**Date de création :** 2025-01-26  
**Dernière mise à jour :** 2025-01-26  
**Auteur :** Documentation technique projet Ciné Délices

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Bannières de films (`/movies`)](#1-bannières-de-films-movies)
3. [Cards de films (`/movies`)](#2-cards-de-films-movies)
4. [Cards de recettes (`/recipes-movie`)](#3-cards-de-recettes-recipes-movie)
5. [Backend - Traitement des images](#backend---traitement-des-images)
6. [Structure des dossiers](#structure-des-dossiers)
7. [Optimisations futures prévues](#optimisations-futures-prévues)

---

## Vue d'ensemble

Le projet Ciné Délices gère actuellement trois types d'images principales :

- **Bannières de films** : Images hero en haut des pages de films
- **Cards de films** : Miniatures affichées dans la liste des films
- **Cards de recettes** : Miniatures affichées dans la liste des recettes d'un film

### Architecture actuelle

- **Backend** : Pipeline de traitement préparé mais **non activé** (Sharp/face-api.js non intégrés)
- **Upload** : Multer avec configuration centralisée
- **Stockage** : Organisation par type dans `/app/public/images/`
- **Frontend** : CSS pur avec `object-fit: cover` pour l'adaptation
- **Lazy loading** : Partiellement implémenté (cards de recettes uniquement)

---

## 1. Bannières de films (`/movies`)

### 📍 Pages concernées

- `/movies` : Page de liste des films
- `/recipes-movie/:id` : Page de détail d'un film avec ses recettes

### 🎨 Rendu visuel

#### Page `/movies`

- **Fichier** : `app/views/movies.ejs` (lignes 31-40)
- **Classe CSS** : `.banner__image__film.banner__image__film--movies`
- **Image statique** : `/images/image-banner-movies.jpg` (image fixe, non dynamique)

#### Page `/recipes-movie/:id`

- **Fichier** : `app/views/recipes-movie.ejs` (lignes 30-39)
- **Classe CSS** : `.banner__image__film`
- **Image dynamique** : `<%= movie.picture %>` (affiche du film depuis la BDD)
- **Attributs HTML** :
  - `width="1440"` (dimensions sémantiques)
  - `height="350"`
  - `decoding="async"` ✅

### 📐 Dimensions et ratios

#### Desktop

- **Hauteur fixe** : `400px` (`/movies`) / `350px` (`/recipes-movie`)
- **Largeur** : `100%` avec `max-width: var(--max-width)` (1400px)
- **Ratio calculé** : ~3.6:1 (1920×540px théorique) pour `/movies`
- **Ratio calculé** : ~4.1:1 (1440×350px) pour `/recipes-movie`

#### Responsive

- **Tablette (≤900px)** : `260px` de hauteur
- **Mobile (≤540px)** : `220px` de hauteur
- **Largeur** : S'adapte à 100% du conteneur

### 🎯 Crop et adaptation

**Type de crop :** CSS uniquement (pas de crop serveur)

- **Méthode** : `object-fit: cover` + `object-position: center`
- **Comportement** : L'image remplit entièrement le conteneur, centrée
- **Pas de crop automatique** : Les images sont utilisées telles quelles
- **Pas de redimensionnement serveur** : Les images originales sont servies

### 💅 Styles CSS

**Fichier** : `app/public/css/movies.css` (lignes 13-63) et `recipes-movie.css` (lignes 14-63)

```css
.banner__image__film {
  width: 100%;
  max-width: var(--max-width);
  height: 400px; /* 350px pour recipes-movie */
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  object-fit: cover;
  object-position: center;
}
```

**Effets visuels :**

- Overlay avec gradients radiaux (lignes 31-48)
- Filtres : `brightness(0.9) contrast(1.05)`
- Transition au hover (désactivée pour éviter le flou)
- Ombre portée : `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45)`

### 🚀 Lazy loading

**Status** : ❌ **Non implémenté** pour les bannières

Les bannières sont au-dessus de la ligne de flottaison (above the fold), donc chargées immédiatement. Pas de `loading="lazy"`.

### 🔧 Traitement backend

**Status** : ⚠️ **Préparé mais non activé**

**Fichier** : `app/utils/image-pipeline.js`

- **Configuration** : `IMAGE_CONFIG.MOVIE_BANNER`
  - `maxWidth: 1920`
  - `maxHeight: 600`
  - `quality: 90`
  - `format: "jpg"`
- **Pipeline** : Fonctions `cropImage()`, `resizeImage()`, `optimizeImage()` préparées mais non implémentées
- **Activation** : Nécessite activation explicite via `enableCrop`, `enableResize`, `enableOptimize`

---

## 2. Cards de films (`/movies`)

### 📍 Pages concernées

- `/movies` : Liste principale des films

### 🎨 Rendu visuel

**Fichier** : `app/views/movies.ejs` (lignes 104-109)

```html
<div class="film-card-image">
  <img src="<%= movie.picture %>" alt="Affiche du film <%= movie.title %>" />
</div>
```

**Classe CSS** : `.film-card-image`

### 📐 Dimensions et ratios

#### Desktop

- **Hauteur fixe** : `220px`
- **Largeur** : `100%` du conteneur (cards flexibles)
- **Padding** : `1rem 1.5rem` autour de l'image
- **Ratio effectif** : Variable selon la largeur de la card (environ 16:9 en moyenne)

#### Responsive

- **Tablette (≤1200px)** : `aspect-ratio: 16/9` avec hauteur auto
- **Mobile (≤600px)** : Padding réduit `0.5rem 0.75rem`
- **Très petit écran (≤480px)** : Padding minimal `0.5rem`

### 🎯 Crop et adaptation

**Type de crop :** CSS uniquement

- **Méthode** : `object-fit: cover`
- **Pas de crop automatique** : Images utilisées telles quelles
- **Pas de redimensionnement serveur** : Images originales servies

### 💅 Styles CSS

**Fichier** : `app/public/css/movies.css` (lignes 366-390)

```css
.film-card-image {
  width: 100%;
  height: 220px;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  padding: 1rem 1.5rem;
}

.film-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
```

**Effets visuels :**

- Border-radius : `12px` (coins arrondis)
- Transition : `transform 0.6s cubic-bezier` (désactivée au hover pour éviter le flou)

### 🚀 Lazy loading

**Status** : ❌ **Non implémenté**

Les cards de films n'ont pas d'attribut `loading="lazy"`. Elles sont chargées immédiatement.

### 🔧 Traitement backend

**Status** : ⚠️ **Préparé mais non activé**

**Fichier** : `app/utils/image-pipeline.js`

- **Configuration** : `IMAGE_CONFIG.MOVIE_CARD`
  - `maxWidth: 640`
  - `maxHeight: 960`
  - `quality: 85`
  - `format: "jpg"`
- **Dossier de stockage** : `/app/public/images/movies/` (fichiers racine) ou `/movies/cards/` (dans le pipeline préparé)
- **Upload middleware** : `app/middlewares/upload-movie.middleware.js`
  - Filtre : JPG, JPEG, PNG, WEBP
  - Taille max : 5 MB
  - Nom généré : `movie-{originalname}-{random}.{ext}`

---

## 3. Cards de recettes (`/recipes-movie`)

### 📍 Pages concernées

- `/recipes-movie/:id` : Liste des recettes d'un film
- `/` (home) : Top 3 des recettes (section "Nos recettes cultes")

### 🎨 Rendu visuel

**Fichier** : `app/views/recipes-movie.ejs` (lignes 91-100)

```html
<div class="recipe-card-image">
  <img
    src="<%= recipe.picture %>"
    alt="<%= recipe.name %>"
    loading="lazy"
    width="640"
    height="360"
    decoding="async"
  />
</div>
```

**Classe CSS** : `.recipe-card-image`

### 📐 Dimensions et ratios

#### Desktop

- **Hauteur fixe** : `220px`
- **Largeur** : `100%` du conteneur
- **Padding** : `1rem 1.5rem`
- **Dimensions sémantiques HTML** : `width="640" height="360"` → **Ratio 16:9**

#### Responsive

- **Tablette (≤800px)** : Cards en 2 colonnes
- **Mobile (≤540px)** : Cards en 1 colonne
- Padding réduit sur petits écrans

### 🎯 Crop et adaptation

**Type de crop :** CSS uniquement

- **Méthode** : `object-fit: cover`
- **Pas de crop automatique** : Images utilisées telles quelles
- **Ratio cible** : 16:9 (indiqué dans les attributs HTML)

### 💅 Styles CSS

**Fichier** : `app/public/css/recipes-movie.css` (lignes 258-281)

```css
.recipe-card-image {
  width: 100%;
  height: 220px;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  padding: 1rem 1.5rem;
}

.recipe-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
```

**Effets visuels :**

- Border-radius : `12px`
- Transition désactivée au hover (évite le flou)

### 🚀 Lazy loading

**Status** : ✅ **Implémenté**

- **Attribut HTML** : `loading="lazy"` ✅
- **Decoding asynchrone** : `decoding="async"` ✅
- **Performance** : Améliore le temps de chargement initial

### 🔧 Traitement backend

**Status** : ⚠️ **Préparé mais non activé**

**Fichier** : `app/utils/image-pipeline.js`

- **Configuration** : `IMAGE_CONFIG.RECIPE_CARD`
  - `maxWidth: 640`
  - `maxHeight: 360`
  - `quality: 85`
  - `format: "webp"` (format de sortie prévu pour meilleure compression)
- **Dossier de stockage** : `/app/public/images/recipes/` (fichiers racine) ou `/recipes/cards/` (dans le pipeline préparé)
- **Upload middleware** : `app/middlewares/upload.middleware.js`
  - Filtre : JPG, JPEG, PNG, WEBP
  - Taille max : 5 MB
  - Nom généré : `recipe-{originalname}-{random}.{ext}`

---

## Backend - Traitement des images

### 📦 Modules centralisés

#### 1. Configuration d'upload (`app/utils/upload-config.js`)

**Fonctionnalités :**

- Types MIME autorisés : `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
- Taille maximale : 5 MB
- Filtre Multer réutilisable : `createImageFilter()`
- Configuration commune : `MULTER_COMMON_CONFIG`

#### 2. Utilitaires images (`app/utils/image-utils.js`)

**Fonctionnalités :**

- `slugifier(name)` : Transforme un nom en slug URL-safe
- `generateRandom()` : Génère un identifiant unique (timestamp + random)
- `determineImageFolder(type)` : Détermine le dossier selon le type
- Constantes : `IMAGE_TYPES` (MOVIE_CARD, MOVIE_BANNER, RECIPE_CARD)

#### 3. Pipeline de traitement (`app/utils/image-pipeline.js`)

**Status** : ⚠️ **Préparé mais NON ACTIVÉ**

**Fonctionnalités préparées :**

- Structure complète pour crop, resize, optimize
- Configuration par type d'image
- Journalisation intégrée (`logger.js`)
- **Limitations actuelles :**
  - ❌ Sharp non intégré → Pas de redimensionnement réel
  - ❌ face-api.js non intégré → Pas de crop intelligent
  - ✅ Copie de fichier avec renommage fonctionnelle

**Configuration prévue :**

```javascript
IMAGE_CONFIG = {
  MOVIE_CARD: { maxWidth: 640, maxHeight: 960, quality: 85, format: "jpg" },
  MOVIE_BANNER: { maxWidth: 1920, maxHeight: 600, quality: 90, format: "jpg" },
  RECIPE_CARD: { maxWidth: 640, maxHeight: 360, quality: 85, format: "webp" },
};
```

**Activation :**
Pour activer le pipeline, passer `enableCrop`, `enableResize`, `enableOptimize` à `true` dans `processImage()` (nécessite d'abord l'intégration de Sharp).

#### 4. Middlewares d'upload

**Fichiers :**

- `app/middlewares/upload-movie.middleware.js` : Upload des images de films
- `app/middlewares/upload.middleware.js` : Upload des images de recettes

**Caractéristiques :**

- Utilisation des modules centralisés (pas de duplication)
- Stockage avec Multer `diskStorage`
- Génération de noms uniques avec timestamp + random
- Validation des types et tailles

---

## Structure des dossiers

```
app/public/images/
├── movies/
│   ├── cards/              # ⚠️ Dossier préparé pour le pipeline (peu utilisé actuellement)
│   │   └── movie-*.jpg
│   ├── banners/            # ⚠️ Dossier préparé pour le pipeline (non utilisé actuellement)
│   └── *.jpg               # ✅ Images actuelles stockées à la racine
├── recipes/
│   ├── cards/              # ⚠️ Dossier préparé pour le pipeline (peu utilisé actuellement)
│   │   └── recipe-*.jpg
│   └── *.jpg               # ✅ Images actuelles stockées à la racine
├── image-banner-movies.jpg # Image statique bannière /movies
└── ...
```

**Note** : Les dossiers `cards/` et `banners/` sont préparés pour le pipeline mais les images sont actuellement majoritairement stockées à la racine de `movies/` et `recipes/`.

---

## Optimisations futures prévues

### 🎯 Pipeline de traitement (Préparé, non activé)

1. **Redimensionnement automatique avec Sharp**

   - Respect des dimensions max configurées
   - Conservation du ratio d'aspect
   - Format de sortie optimisé (JPG/WebP)

2. **Crop intelligent avec face-api.js**

   - Détection de visages dans les images
   - Crop centré sur les éléments importants
   - Adaptation au ratio cible

3. **Compression et optimisation**

   - Compression selon qualité configurée (85-90%)
   - Conversion WebP pour les cards de recettes
   - Nettoyage des métadonnées EXIF

4. **Génération de variantes**
   - Images pour différentes tailles d'écran (srcset)
   - Miniatures pour prévisualisation
   - Formats multiples (JPG, WebP, AVIF)

### 📝 Journalisation

**Fichier** : `app/utils/logger.js`

- Logs de toutes les opérations d'upload
- Erreurs tracées avec contexte
- Niveaux : INFO, WARNING, ERROR

### 🧹 Nettoyage automatique

**Fichier** : `app/utils/cleanup.js` (préparé, désactivé)

- Suppression des images orphelines
- Nettoyage des uploads échoués
- Archivage des anciennes versions

---

## 📊 Résumé comparatif

| Type d'image       | Crop serveur | Redimensionnement serveur | Lazy loading | Format optimisé | Pipeline activé |
| ------------------ | ------------ | ------------------------- | ------------ | --------------- | --------------- |
| **Bannière films** | ❌ Non       | ❌ Non                    | ❌ Non       | ❌ Non          | ⚠️ Préparé      |
| **Card films**     | ❌ Non       | ❌ Non                    | ❌ Non       | ❌ Non          | ⚠️ Préparé      |
| **Card recettes**  | ❌ Non       | ❌ Non                    | ✅ Oui       | ❌ Non          | ⚠️ Préparé      |

---

## 🔍 Points d'attention

1. **Pas de redimensionnement serveur actuel**

   - Les images sont servies à leur taille originale
   - Impact sur la performance (bande passante, temps de chargement)

2. **Lazy loading partiel**

   - Seules les cards de recettes ont `loading="lazy"`
   - Les cards de films pourraient bénéficier du lazy loading

3. **Pas de crop automatique**

   - Les images doivent être pré-formatées manuellement
   - Risque de distorsion avec `object-fit: cover`

4. **Pipeline non activé**

   - Toute la structure est en place mais nécessite Sharp/face-api.js
   - Activation future possible sans refactoring majeur

5. **Organisation des dossiers**
   - Images actuellement à la racine de `movies/` et `recipes/`
   - Dossiers `cards/` et `banners/` préparés mais peu utilisés

---

## 📚 Références techniques

### Fichiers clés

- **CSS** :
  - `app/public/css/movies.css`
  - `app/public/css/recipes-movie.css`
- **Backend** :
  - `app/utils/image-pipeline.js`
  - `app/utils/image-utils.js`
  - `app/utils/upload-config.js`
  - `app/middlewares/upload-movie.middleware.js`
  - `app/middlewares/upload.middleware.js`
- **Vues** :
  - `app/views/movies.ejs`
  - `app/views/recipes-movie.ejs`

### Documentation associée

- Voir `docs/SEB le Fourbe/` pour les phases d'implémentation (PHASE 2, 3, 6, 7)

---

**Fin du document**
