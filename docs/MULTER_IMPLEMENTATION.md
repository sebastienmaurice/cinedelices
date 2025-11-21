# 📸 Implémentation de Multer pour l'Upload d'Images

## 📅 Date : 20 novembre 2025
## 🔄 Dernière mise à jour : 20 novembre 2025

---

## 🎯 Objectif

Mettre en place un système d'upload d'images pour les recettes dans le formulaire `add-recipes-movies.ejs`, avec prévisualisation en temps réel avant soumission.

---

## 📁 Fichiers Créés

### 1. **`app/middlewares/upload.middleware.js`** ✨ NOUVEAU

**Rôle** : Configuration de Multer pour gérer l'upload de fichiers

**Fonctionnalités** :

- 📂 **Destination** : Les images sont stockées dans `app/public/images/recipes/`
- 🏷️ **Nommage** : Génération de noms uniques avec timestamp pour éviter les conflits
  - Format : `nom-original-{timestamp}-{random}.extension`
- 🛡️ **Sécurité** :
  - Filtre des types de fichiers acceptés (JPG, JPEG, PNG, WEBP uniquement)
  - Limite de taille de fichier à 5 MB maximum
- ⚠️ **Gestion d'erreurs** : Messages d'erreur explicites en cas de format non supporté

**⚠️ CORRECTION IMPORTANTE** : Le chemin a été ajusté de `../../public/images/recipes` à `../public/images/recipes` pour correspondre à la structure réelle du projet (`app/public/images/recipes/`).

---

### 2. **`app/public/js/recipe-image-upload.js`** ✨ NOUVEAU

**Rôle** : Script JavaScript pour la prévisualisation d'image côté client

**Fonctionnalités** :
- 🖱️ **Déclenchement** : Le bouton "Je télécharge mon image" ouvre la sélection de fichier
- 👁️ **Prévisualisation** : Affichage immédiat de l'image sélectionnée avant soumission
- ✅ **Validation côté client** :
  - Vérification du type de fichier (images uniquement)
  - Vérification de la taille (max 5 MB)
  - Alertes utilisateur en cas d'erreur
- 📊 **Feedback** : Logs console avec nom et taille du fichier sélectionné

---

## 🔧 Fichiers Modifiés

### 3. **`app/routes/add-recipes-movies.route.js`** 🔄 MODIFIÉ

**Modification** : Ajout du middleware Multer sur la route POST `/recipe`

```javascript
// AVANT
addRecipesMoviesRouter.post("/recipe", addRecipesMoviesController.addRecipe);

// APRÈS
import upload from "../middlewares/upload.middleware.js";

addRecipesMoviesRouter.post(
  "/recipe",
  upload.single("recipeImage"),
  addRecipesMoviesController.addRecipe
);
```

**Explication** :
- `upload.single("recipeImage")` : Middleware qui traite UN seul fichier avec le nom "recipeImage"
- Le fichier uploadé sera disponible dans `req.file` dans le contrôleur

---

### 4. **`app/controllers/add-recipes-movies.controllers.js`** 🔄 MODIFIÉ

**Modification** : Gestion de l'image uploadée dans la méthode `addRecipe`

**Ajout** :

```javascript
// Récupération du chemin de l'image uploadée (si présente)
let imagePath = null;
if (req.file) {
  // Chemin relatif pour l'affichage dans le HTML
  imagePath = `/images/recipes/${req.file.filename}`;
  console.log("Image uploadée :", imagePath);
}

// Ajout de la recette avec l'image
const newRecipe = await Recipe.create({
  // ... autres champs
  picture: imagePath, // Ajout du chemin de l'image (colonne 'picture')
});
```

**Explication** :

- Vérifie si un fichier a été uploadé via `req.file`
- Construit le chemin relatif `/images/recipes/nom-du-fichier.jpg`
- Sauvegarde ce chemin dans la colonne `picture` de la table `recipes`

**⚠️ CORRECTION IMPORTANTE** : La colonne dans le modèle `Recipe` s'appelle `picture` et non `image`. Le contrôleur a été corrigé pour utiliser `picture: imagePath` au lieu de `image: imagePath`.

---

### 5. **`app/views/add-recipes-movies.ejs`** 🔄 MODIFIÉ

**Modifications multiples** :

#### a) Attribut `enctype` sur le formulaire
```html
<!-- AVANT -->
<form action="/add-recipes-movies/recipe" method="post">

<!-- APRÈS -->
<form action="/add-recipes-movies/recipe" method="post" enctype="multipart/form-data">
```
**Explication** : `enctype="multipart/form-data"` est obligatoire pour envoyer des fichiers

---

#### b) Input file caché et bouton stylisé
```html
<!-- Ajout de l'input file (caché) -->
<input 
  type="file" 
  name="recipeImage" 
  id="recipeImageInput" 
  accept="image/jpeg,image/jpg,image/png,image/webp"
  style="display: none;"
/>

<!-- Bouton visible qui déclenche l'input -->
<button type="button" class="btn btn--red btn-upload" id="uploadButton">
  Je télécharge mon image
  <i class="fa-solid fa-upload btn-upload-icon"></i>
</button>
```
**Explication** :
- L'input file natif est caché (peu esthétique)
- Le bouton stylisé déclenche l'ouverture de la sélection de fichier
- `accept` limite les types de fichiers affichés dans la sélection

---

#### c) ID pour la prévisualisation
```html
<!-- AVANT -->
<img src="/images/bg-img-default-boys.jpg" alt="Image par défaut Ciné Délices" />

<!-- APRÈS -->
<img 
  id="recipeImagePreview"
  src="/images/bg-img-default-boys.jpg" 
  alt="Image par défaut Ciné Délices" 
/>
```
**Explication** : L'ID `recipeImagePreview` permet au JavaScript de cibler cette image pour la mise à jour

---

#### d) Inclusion du script JavaScript
```html
<!-- Ajout en bas de page -->
<script src="/js/recipe-image-upload.js" defer></script>
```

---

## 🗂️ Structure du Projet

```
app/
├── controllers/
│   └── add-recipes-movies.controllers.js    🔄 MODIFIÉ
├── middlewares/
│   └── upload.middleware.js                 ✨ NOUVEAU
├── routes/
│   └── add-recipes-movies.route.js          🔄 MODIFIÉ
├── views/
│   └── add-recipes-movies.ejs               🔄 MODIFIÉ
└── public/
    ├── images/
    │   └── recipes/                         📁 Dossier de destination
    └── js/
        └── recipe-image-upload.js           ✨ NOUVEAU
```

---

## 🚀 Fonctionnement Complet

### 1. **Sélection de l'image**
- L'utilisateur clique sur "Je télécharge mon image"
- Une fenêtre de sélection de fichier s'ouvre
- L'utilisateur sélectionne une image (JPG, PNG, WEBP)

### 2. **Prévisualisation (client-side)**
- Le JavaScript lit le fichier sélectionné
- Valide le type et la taille
- Affiche l'image dans la zone de prévisualisation
- L'utilisateur voit l'image avant de soumettre le formulaire

### 3. **Soumission du formulaire**
- L'utilisateur remplit les autres champs et clique sur "Je valide ma fiche"
- Le formulaire est soumis avec `enctype="multipart/form-data"`

### 4. **Traitement côté serveur**
- La route `/add-recipes-movies/recipe` reçoit la requête
- Le middleware Multer intercepte le fichier :
  - Vérifie le type et la taille
  - Génère un nom unique
  - Sauvegarde dans `public/images/recipes/`
  - Ajoute l'objet `file` à `req.file`

### 5. **Sauvegarde en base de données**

- Le contrôleur récupère `req.file.filename`
- Construit le chemin `/images/recipes/nom-fichier.jpg`
- Sauvegarde ce chemin dans la colonne `picture` de la table `recipes`

### 6. **Affichage**

- L'image peut être affichée avec `<img src="<%= recipe.picture %>" />`

---

## ⚙️ Configuration Requise

### Dossier de destination

Le dossier existe déjà dans la structure du projet :

```bash
/var/www/html/Cinédélices/dwwm-cinedelices/app/public/images/recipes/
```

Si vous avez des problèmes de permissions :

```bash
chmod 755 /var/www/html/Cinédélices/dwwm-cinedelices/app/public/images/recipes
```

### Base de données

La table `recipes` a déjà une colonne `picture` de type `VARCHAR(255)` qui stocke le chemin de l'image.

**Structure du modèle Recipe** :

```javascript
picture: { type: DataTypes.STRING(255) }
```

✅ Aucune modification de base de données nécessaire !

---

## 🛡️ Sécurité

### Validations mises en place :

1. **Côté Client** (JavaScript)
   - Types de fichiers : JPG, JPEG, PNG, WEBP
   - Taille max : 5 MB

2. **Côté Serveur** (Multer)
   - Types MIME autorisés : `image/jpeg`, `image/jpg`, `image/png`, `image/webp`
   - Taille max : 5 MB
   - Noms de fichiers uniques (évite l'écrasement)

3. **Stockage**
   - Fichiers stockés dans `public/images/recipes/` (accessible publiquement)
   - Noms randomisés pour éviter les conflits et prédictions

---

## 📝 Notes Importantes

- ✅ **Colonne BDD** : La colonne `picture` existe déjà dans la table `recipes`
- 📂 **Dossier** : Le dossier `app/public/images/recipes/` existe et est accessible
- 🎨 **Design** : Le bouton et la prévisualisation respectent le design existant
- 🔄 **Formulaire** : L'attribut `enctype="multipart/form-data"` est OBLIGATOIRE

---

## 🔧 Corrections Apportées

### 1. Chemin du dossier de destination

**Problème initial** : Le middleware pointait vers un chemin incorrect

```javascript
// ❌ AVANT (INCORRECT)
const uploadPath = path.join(__dirname, "../../public/images/recipes");

// ✅ APRÈS (CORRECT)
const uploadPath = path.join(__dirname, "../public/images/recipes");
```

**Explication** : Le fichier middleware est dans `app/middlewares/`, donc il faut remonter d'un seul niveau (`..`) pour atteindre `app/`, puis descendre dans `public/images/recipes/`.

### 2. Nom de la colonne dans le modèle

**Problème initial** : Le contrôleur utilisait `image` alors que la colonne s'appelle `picture`

```javascript
// ❌ AVANT (INCORRECT)
const newRecipe = await Recipe.create({
  // ...
  image: imagePath
});

// ✅ APRÈS (CORRECT)
const newRecipe = await Recipe.create({
  // ...
  picture: imagePath
});
```

**Explication** : Le modèle `Recipe` définit la colonne comme `picture: { type: DataTypes.STRING(255) }`, il faut donc utiliser ce nom exact.

---

## 🎉 Résultat

✅ Upload d'image fonctionnel avec prévisualisation  
✅ Validation côté client et serveur  
✅ Noms de fichiers uniques et sécurisés  
✅ Intégration transparente dans le design existant  
✅ Sauvegarde du chemin dans la colonne `picture` en base de données  
✅ Chemin de destination correct (`app/public/images/recipes/`)

---

## 🎬 Ciné Délices

Développé avec 💜 pour Ciné Délices
