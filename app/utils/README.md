# Module Utilitaire Images - image-utils.js

## Description

Module centralisé pour la gestion des images dans Ciné Délices (PHASE 2).

## Fonctions disponibles

### `slugifier(name)`

Transforme un nom de film ou recette en slug compatible URL.

**Exemple d'utilisation :**

```javascript
import { slugifier } from "./utils/image-utils.js";

slugifier("Harry Potter"); // "harry-potter"
slugifier("La tarte à la Mélasse"); // "la-tarte-a-la-melasse"
slugifier("Indiana Jones et les Aventuriers de l'Arche perdue"); // "indiana-jones-et-les-aventuriers-de-l-arche-perdue"
```

**Caractéristiques :**

- Gère les accents (é → e, à → a, etc.)
- Convertit en minuscules
- Remplace les espaces et caractères spéciaux par des tirets
- Limite à 100 caractères

---

### `generateRandom()`

Génère un entier aléatoire long (17 chiffres) pour garantir l'unicité des noms de fichiers.

**Exemple d'utilisation :**

```javascript
import { generateRandom } from "./utils/image-utils.js";

const random = generateRandom(); // 17645830421209820
```

**Caractéristiques :**

- Combine un timestamp (13 chiffres) avec un nombre aléatoire (4 chiffres)
- Garantit un nombre unique à chaque appel
- Minimum 17 chiffres (dépasse largement les 10+ requis)

---

### `determineImageFolder(type)`

Détermine le dossier de destination selon le type d'image.

**Exemple d'utilisation :**

```javascript
import { determineImageFolder, IMAGE_TYPES } from "./utils/image-utils.js";

// Utilisation avec constantes (recommandé)
const movieCardPath = determineImageFolder(IMAGE_TYPES.MOVIE_CARD);
// Retourne: "/path/to/app/public/images/movies/cards"

const movieBannerPath = determineImageFolder(IMAGE_TYPES.MOVIE_BANNER);
// Retourne: "/path/to/app/public/images/movies/banners"

const recipeCardPath = determineImageFolder(IMAGE_TYPES.RECIPE_CARD);
// Retourne: "/path/to/app/public/images/recipes/cards"

// Ou avec des strings (non recommandé, risque d'erreur de frappe)
const path = determineImageFolder("movie-card");
```

**Types acceptés :**

- `"movie-card"` → `app/public/images/movies/cards`
- `"movie-banner"` → `app/public/images/movies/banners`
- `"recipe-card"` → `app/public/images/recipes/cards`

**⚠️ Erreur :** Lance une exception si le type n'est pas reconnu.

---

## Constantes

### `IMAGE_TYPES`

Constantes pour éviter les erreurs de frappe :

```javascript
import { IMAGE_TYPES } from "./utils/image-utils.js";

IMAGE_TYPES.MOVIE_CARD; // "movie-card"
IMAGE_TYPES.MOVIE_BANNER; // "movie-banner"
IMAGE_TYPES.RECIPE_CARD; // "recipe-card"
```

---

## Exemple d'utilisation complète

```javascript
import {
  slugifier,
  generateRandom,
  determineImageFolder,
  IMAGE_TYPES,
} from "./utils/image-utils.js";

// Exemple: Générer un nom de fichier pour une image de film
const movieTitle = "Harry Potter";
const movieId = 1;
const slug = slugifier(movieTitle); // "harry-potter"
const random = generateRandom(); // 17645830421209820
const extension = ".jpg";
const filename = `movie-card-${slug}-${random}${extension}`;
// Résultat: "movie-card-harry-potter-17645830421209820.jpg"

// Déterminer le dossier de destination
const destinationFolder = determineImageFolder(IMAGE_TYPES.MOVIE_CARD);
```

---

## Intégration dans les middlewares Multer

Ce module sera utilisé dans les middlewares pour :

1. Générer des noms de fichiers intelligents avec slugs
2. Déterminer automatiquement les dossiers de destination
3. Garantir l'unicité avec des nombres aléatoires longs

---

## Notes

- **PHASE 2** : Module préparé et prêt à être utilisé
- **Pas encore intégré** : Les middlewares utilisent encore l'ancien système de nommage
- **Prochaine étape** : Intégration dans les middlewares pour le renommage automatique intelligent
