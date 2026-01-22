# AUDIT COMPLET - PROCESSUS D'IMPORT D'IMAGES

**Date :** 2025-01-XX  
**Projet :** Ciné Délices  
**Objectif :** Analyse complète du système d'upload et de gestion des images

---

## 1. ANALYSE DES IMPORTS EXISTANTS

### 1.1. Images des Recettes (`/add-recipes-movies/`)

#### **Flux d'upload :**

1. **Route :** `POST /add-recipes-movies/recipe`
2. **Middleware :** `upload.single("recipeImage")` (depuis `upload.middleware.js`)
3. **Destination :** `app/public/images/recipes/`
4. **Controller :** `addRecipesMoviesController.addRecipe()` (lignes 76-126)

#### **Processus détaillé :**

```12:20:app/middlewares/upload.middleware.js
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "recipe-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
```

- **Format de nommage :** `recipe-{nomOriginal}-{timestamp}-{random}.{extension}`
- **Stockage en BDD :** Chemin relatif `/images/recipes/{filename}` dans la colonne `picture` de la table `recipes`
- **Validation :** Format accepté lors de l'upload (JPG, JPEG, PNG, WEBP) + limite 5 MB

#### **Fichiers impliqués :**

- **Route :** `app/routes/add-recipes-movies.route.js` (lignes 28-33)
- **Controller :** `app/controllers/add-recipes-movies.controllers.js` (lignes 76-126)
- **Middleware :** `app/middlewares/upload.middleware.js`
- **Frontend :** `app/public/js/recipe-image-upload.js`
- **Vue :** `app/views/add-recipes-movies.ejs` (lignes 218-224)

---

### 1.2. Images des Films (`/admin/`)

#### **Flux d'upload :**

1. **Route :** `POST /admin/validateMovie/:id`
2. **Middleware :** `uploadMovie.single("filmImage")` (depuis `upload-movie.middleware.js`)
3. **Destination :** `app/public/images/movies/`
4. **Controller :** `adminController.validateMovie()` (lignes 111-145)

#### **Processus détaillé :**

```15:21:app/middlewares/upload-movie.middleware.js
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "movie-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
```

- **Format de nommage :** `movie-{nomOriginal}-{timestamp}-{random}.{extension}`
- **Stockage en BDD :** Chemin relatif `/images/movies/{filename}` dans la colonne `picture` de la table `movies`
- **Particularité :** L'upload se fait **lors de la validation** du film par l'admin, pas lors de la création initiale
- **Validation :** Format accepté (JPG, JPEG, PNG, WEBP) + limite 5 MB

#### **Fichiers impliqués :**

- **Route :** `app/routes/admin.route.js` (lignes 43-47)
- **Controller :** `app/controllers/admin.controllers.js` (lignes 111-145)
- **Middleware :** `app/middlewares/upload-movie.middleware.js`
- **Frontend :** `app/public/js/admin-picture-upload.js`
- **Vue :** `app/views/admin-dashboard.ejs` (lignes 116-150)

---

## 2. VÉRIFICATION DES DOSSIERS ET PROCESSUS

### 2.1. Structure des dossiers d'images

```
app/public/images/
├── movies/          → Images des films (uploadées par admin)
│   ├── movie-harry_potter-1763858232674-340071843.png
│   ├── movie-american_pie-1764103560707-335098533.png
│   └── ...
├── recipes/         → Images des recettes (uploadées par utilisateurs)
│   ├── recipe-brownies_willy_le_borgne-1764262264623-479036853.png
│   ├── tarte_melasse-1764137492266-726416795.jpeg
│   └── ...
├── event/           → Images du hero slider (statiques, non uploadées)
│   ├── hero-slider-01-harry-potter.jpg
│   ├── hero-slider-02-pirates-caraibes.jpg
│   ├── hero-slider-03-commando.jpg
│   └── hero-slider-04-home-alone.jpg
├── profil-contact/  → Images de profil de l'équipe (statiques)
└── [autres dossiers statiques]
```

### 2.2. Processus par type d'image

#### **A. Images de Recettes**

- **Quand :** Lors de l'ajout d'une recette par un utilisateur
- **Où :** Formulaire `/add-recipes-movies` → Section 2
- **Stockage :** `app/public/images/recipes/`
- **Nommage :** `recipe-{nomOriginal}-{timestamp}-{random}.{ext}`
- **Enregistrement BDD :** Immédiat lors de la création (status = false)
- **Validation :** Admin doit valider la recette (status = true)

#### **B. Images de Films**

- **Quand :** Lors de la validation d'un film par un admin
- **Où :** Dashboard admin → Validation d'un film
- **Stockage :** `app/public/images/movies/`
- **Nommage :** `movie-{nomOriginal}-{timestamp}-{random}.{ext}`
- **Enregistrement BDD :** Lors de la validation (mise à jour du film existant)
- **Particularité :** Le film peut être créé SANS image, l'image est ajoutée plus tard

#### **C. Images Event (Hero Slider)**

- **Quand :** Statique, pas d'upload
- **Où :** Dossier `app/public/images/event/`
- **Gestion :** Lecture automatique du dossier par `homeController.home()`
- **Processus :**

```61:77:app/controllers/home.controllers.js
      // Lister les images du dossier recipes
      let recipeImages = []; // création d'un tableau vide
      try {
        const imagesDir = path.join(__dirname, "../public/images/event"); // Chemin vers le dossier des images
        const files = await fs.readdir(imagesDir);

        // Filtrer uniquement les fichiers images
        recipeImages = files
          .filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
          })
          .map((file) => `/images/event/${file}`); // Créer le chemin relatif pour l'affichage dans la vue. map rempli le tableau recipeImages.
      } catch (error) {
        console.error("Erreur lors de la lecture du dossier recipes:", error);
        // Si le dossier n'existe pas ou erreur, on continue avec un tableau vide
      }
```

- **Note :** Les images sont lues dynamiquement, mais pas uploadées via l'interface

#### **D. Images de Profil Utilisateur**

- **Statut :** ⚠️ **NON IMPLÉMENTÉ**
- **Où :** Interface présente dans `user-profile.ejs` (lignes 81-87)
- **Problème :** Aucune route, controller ou middleware pour gérer l'upload
- **Champ BDD :** Existe dans la table `users` (colonne `picture`), mais jamais utilisé

---

## 3. ANALYSE DU FONCTIONNEMENT DE MULTER

### 3.1. Configuration Multer pour les Recettes

```1:54:app/middlewares/upload.middleware.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Les images seront stockées dans app/public/images/recipes
    const uploadPath = path.join(__dirname, "../public/images/recipes");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "recipe-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
});

// Filtre pour accepter uniquement les images
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

// Configuration de Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 MB
  },
});

export default upload;
```

### 3.2. Configuration Multer pour les Films

```1:54:app/middlewares/upload-movie.middleware.js
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration du stockage pour les films
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Les images seront stockées dans app/public/images/movies
    const uploadPath = path.join(__dirname, "../public/images/movies");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Génération d'un nom de fichier unique
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    cb(null, "movie-" + nameWithoutExt + "-" + uniqueSuffix + ext);
  },
});

// Filtre pour accepter uniquement les images
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

// Configuration de Multer pour les films
const uploadMovie = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite de 5 MB
  },
});

export default uploadMovie;
```

### 3.3. Caractéristiques communes

| Caractéristique      | Valeur                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| **Stockage**         | `diskStorage` (fichiers sur disque)                                             |
| **Formats acceptés** | JPEG, JPG, PNG, WEBP                                                            |
| **Taille max**       | 5 MB                                                                            |
| **Nommage**          | Préfixe (`recipe-` ou `movie-`) + nom original + timestamp + random + extension |
| **Validation**       | Par MIME type uniquement                                                        |

---

## 4. PROBLÈMES ET INCOHÉRENCES IDENTIFIÉS

### 4.1. ⚠️ Problèmes Critiques

#### **A. Images de Profil Utilisateur non fonctionnelles**

- **Problème :** Interface présente mais aucun backend
- **Impact :** Fonctionnalité incomplète
- **Fichiers concernés :**
  - `app/views/user-profile.ejs` (lignes 81-87)
  - `app/routes/user-profile.route.js` (vide, ligne 7)
  - Pas de controller pour user-profile
  - Pas de middleware d'upload pour les profils

#### **B. Pas de validation des dimensions d'image**

- **Problème :** Aucune vérification de largeur/hauteur
- **Impact :** Risque d'images disproportionnées, problèmes d'affichage
- **Recommandation :** Ajouter validation des dimensions (min/max)

#### **C. Pas de traitement d'image (redimensionnement, optimisation)**

- **Problème :** Images stockées telles quelles
- **Impact :**
  - Taille de stockage élevée
  - Temps de chargement long
  - Pas de génération de thumbnails
- **Recommandation :** Intégrer Sharp pour traitement

#### **D. Gestion d'erreurs Multer incomplète**

- **Problème :** Erreurs Multer non gérées spécifiquement dans les controllers
- **Impact :** Messages d'erreur génériques pour l'utilisateur
- **Exemple :** Si fichier trop volumineux, erreur non capturée proprement

### 4.2. ⚠️ Incohérences

#### **A. Nommage des fichiers incohérent**

- **Recettes :** `recipe-{nom}-{timestamp}-{random}.ext`
- **Films :** `movie-{nom}-{timestamp}-{random}.ext`
- **Problème :** Le nom original peut contenir des caractères spéciaux, espaces, accents
- **Exemple réel :** `movie-Le silence des agneaux-1764145159444-648907832.png` (espaces dans le nom)
- **Recommandation :** Sanitizer le nom de fichier (supprimer espaces, caractères spéciaux)

#### **B. Chemins en BDD vs fichiers réels**

- **BDD :** `/images/recipes/recipe-...` (chemin relatif)
- **Réel :** `app/public/images/recipes/recipe-...`
- **Statut :** ✅ Correct (Express sert `/images` depuis `public/images`)

#### **C. Images Event non gérées via upload**

- **Problème :** Images du hero slider ajoutées manuellement dans le dossier
- **Impact :** Pas de gestion via interface admin
- **Recommandation :** Créer une interface d'upload pour les images event

#### **D. Pas de suppression des anciennes images**

- **Problème :** Si un film/recette est mis à jour avec une nouvelle image, l'ancienne reste sur le disque
- **Impact :** Accumulation de fichiers inutilisés
- **Recommandation :** Supprimer l'ancienne image lors d'un remplacement

### 4.3. ⚠️ Points d'amélioration

#### **A. Sécurité**

- ✅ Validation MIME type (présent)
- ⚠️ Pas de validation du contenu réel du fichier (magic number)
- ⚠️ Pas de scan antivirus
- ⚠️ Pas de limitation du nombre d'uploads par utilisateur

#### **B. Performance**

- ⚠️ Pas de compression d'images
- ⚠️ Pas de génération de formats multiples (WebP, AVIF)
- ⚠️ Pas de lazy loading côté serveur
- ⚠️ Pas de CDN

#### **C. Organisation**

- ⚠️ Pas de sous-dossiers par date/utilisateur
- ⚠️ Tous les fichiers dans un seul dossier
- ⚠️ Pas de nettoyage automatique des fichiers orphelins

#### **D. Logs et monitoring**

- ⚠️ Pas de logs d'upload
- ⚠️ Pas de statistiques (taille totale, nombre de fichiers)

---

## 5. RÉSUMÉ DES FLUX COMPLETS

### 5.1. Flux Upload Recette

```
1. Utilisateur → Formulaire /add-recipes-movies
2. Sélection image → recipe-image-upload.js (prévisualisation)
3. Soumission formulaire → POST /add-recipes-movies/recipe
4. Middleware upload.single("recipeImage") → Validation + Upload
5. Controller addRecipe() → Récupération req.file.filename
6. Enregistrement BDD → picture: "/images/recipes/{filename}"
7. Status = false → En attente validation admin
```

### 5.2. Flux Upload Film

```
1. Utilisateur → Création film (sans image) → POST /add-recipes-movies/movie
2. Film créé → Status = false
3. Admin → Dashboard → Sélection film à valider
4. Admin → Upload image → admin-picture-upload.js (prévisualisation)
5. Soumission → POST /admin/validateMovie/:id
6. Middleware uploadMovie.single("filmImage") → Validation + Upload
7. Controller validateMovie() → Mise à jour picture + status = true
8. Film validé → Visible sur le site
```

### 5.3. Flux Images Event (Hero Slider)

```
1. Admin → Ajout manuel fichier dans /images/event/
2. HomeController.home() → Lecture dossier event/
3. Filtrage fichiers images (.jpg, .jpeg, .png, .webp)
4. Génération tableau recipeImages
5. Passage à la vue home.ejs
6. Affichage dans hero slider
```

---

## 6. RECOMMANDATIONS POUR L'INTÉGRATION SHARP ET GOOGLE VISION API

### 6.1. Prérequis identifiés

#### **A. Structure actuelle compatible**

- ✅ Multer configuré et fonctionnel
- ✅ Chemins de stockage définis
- ✅ Validation MIME type en place
- ✅ Limite de taille configurée

#### **B. Points à modifier pour Sharp**

1. **Remplacer `diskStorage` par traitement en mémoire ou buffer**

   - Option 1 : `memoryStorage()` de Multer → Traitement Sharp → Sauvegarde
   - Option 2 : Garder `diskStorage` → Lire fichier → Traitement Sharp → Remplacer

2. **Ajouter middleware de traitement Sharp**

   - Redimensionnement (max width/height)
   - Compression (qualité)
   - Génération formats multiples (WebP, AVIF)
   - Génération thumbnails

3. **Modifier les controllers**
   - Après upload Multer → Appel Sharp
   - Sauvegarde des versions traitées
   - Mise à jour chemins BDD si nécessaire

#### **C. Points à modifier pour Google Vision API**

1. **Ajouter validation de contenu**

   - Après upload → Appel Vision API
   - Détection contenu inapproprié
   - Rejet si contenu non conforme

2. **Ajouter extraction de métadonnées**
   - Labels détectés
   - Textes détectés (OCR)
   - Stockage optionnel en BDD

### 6.2. Architecture proposée

```
┌─────────────────┐
│   Formulaire    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Multer Upload  │ (Validation MIME + Taille)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sharp Process  │ (Redimensionnement + Compression)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vision API      │ (Validation contenu)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sauvegarde     │ (Disque + BDD)
└─────────────────┘
```

### 6.3. Fichiers à créer/modifier

#### **Nouveaux fichiers :**

- `app/middlewares/sharp-process.middleware.js` → Traitement images
- `app/services/vision-api.service.js` → Appels Google Vision API
- `app/utils/image-utils.js` → Utilitaires (suppression, validation dimensions)

#### **Fichiers à modifier :**

- `app/middlewares/upload.middleware.js` → Intégrer Sharp
- `app/middlewares/upload-movie.middleware.js` → Intégrer Sharp
- `app/controllers/add-recipes-movies.controllers.js` → Gestion erreurs Vision API
- `app/controllers/admin.controllers.js` → Gestion erreurs Vision API

---

## 7. CONCLUSION

### 7.1. Points forts

- ✅ Système Multer bien configuré et fonctionnel
- ✅ Séparation claire entre recettes et films
- ✅ Validation MIME type et taille
- ✅ Nommage unique des fichiers
- ✅ Chemins BDD cohérents

### 7.2. Points faibles

- ⚠️ Images de profil non implémentées
- ⚠️ Pas de traitement d'image (redimensionnement, compression)
- ⚠️ Pas de validation de contenu (Google Vision)
- ⚠️ Pas de gestion des anciennes images
- ⚠️ Images Event non gérées via interface

### 7.3. Prochaines étapes recommandées

1. **Phase 1 :** Implémenter Sharp (redimensionnement, compression)
2. **Phase 2 :** Intégrer Google Vision API (validation contenu)
3. **Phase 3 :** Implémenter upload images de profil
4. **Phase 4 :** Interface admin pour images Event
5. **Phase 5 :** Nettoyage automatique des fichiers orphelins

---

**Fin du rapport d'audit**
