# 🎬 Upload d'Image de Film - Dashboard Admin

**Date de création :** 23 novembre 2025  
**Fonctionnalité :** Upload d'affiche de film avec Multer dans l'espace administrateur

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Fichiers modifiés/créés](#fichiers-modifiéscréés)
4. [Fonctionnement détaillé](#fonctionnement-détaillé)
5. [Utilisation](#utilisation)
6. [Tests](#tests)
7. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Cette fonctionnalité permet aux administrateurs d'uploader une image d'affiche de film lors de la validation d'un film en attente de modération.

### Caractéristiques :
- ✅ Upload via bouton dédié avec icône
- ✅ Prévisualisation instantanée de l'image
- ✅ Validation des formats (JPEG, JPG, PNG, WEBP)
- ✅ Limite de taille : 5 MB
- ✅ Noms de fichiers uniques (évite les conflits)
- ✅ Upload optionnel (on peut valider sans changer l'image)

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   admin-dashboard   │
│       (Vue EJS)     │
└──────────┬──────────┘
           │
           │ 1. Utilisateur clique sur bouton upload
           │ 2. Sélectionne une image
           │ 3. Prévisualisation affichée
           │ 4. Clique sur "Valider le film"
           │
           ▼
┌─────────────────────┐
│  admin-dashboard.js │
│   (Client JS)       │
└──────────┬──────────┘
           │
           │ 5. Transfert fichier dans formulaire
           │ 6. Soumission POST avec FormData
           │
           ▼
┌─────────────────────┐
│   admin.route.js    │
│   (Route Express)   │
└──────────┬──────────┘
           │
           │ 7. Middleware Multer intercepte
           │
           ▼
┌─────────────────────┐
│ upload-movie.mdlw   │
│   (Middleware)      │
└──────────┬──────────┘
           │
           │ 8. Sauvegarde fichier dans /images/movies/
           │ 9. Ajoute req.file avec infos fichier
           │
           ▼
┌─────────────────────┐
│ admin.controllers   │
│   (Contrôleur)      │
└──────────┬──────────┘
           │
           │ 10. Met à jour le champ 'picture' en BDD
           │ 11. Valide le film (status = true)
           │
           ▼
┌─────────────────────┐
│    Base de données  │
│    (PostgreSQL)     │
└─────────────────────┘
```

---

## 📁 Fichiers modifiés/créés

### ✅ Fichiers créés

#### 1. `/app/middlewares/upload-movie.middleware.js`
**Rôle :** Configuration Multer pour l'upload d'images de films

```javascript
// Configuration du stockage
- Destination : /app/public/images/movies/
- Nom de fichier : movie-{originalName}-{timestamp}-{random}.ext
- Formats acceptés : JPEG, JPG, PNG, WEBP
- Taille max : 5 MB
```

**Points clés :**
- Utilise `multer.diskStorage()` pour le stockage sur disque
- Génère des noms uniques avec timestamp + nombre aléatoire
- Filtre les fichiers par MIME type
- Préfixe "movie-" pour identifier les images de films

---

### ✏️ Fichiers modifiés

#### 2. `/app/routes/admin.route.js`
**Modifications :**
- Import du middleware `uploadMovie`
- Ajout du middleware sur la route de validation : `uploadMovie.single('filmImage')`

```javascript
// AVANT
adminRouter.post("/validateMovie/:id", adminController.validateMovie);

// APRÈS
adminRouter.post("/validateMovie/:id", uploadMovie.single('filmImage'), adminController.validateMovie);
```

---

#### 3. `/app/controllers/admin.controllers.js`
**Modifications :** Méthode `validateMovie()`

```javascript
async validateMovie(req, res) {
  const movieId = parseInt(req.params.id);
  const updateData = { status: true };
  
  // ⭐ NOUVEAU : Gestion de l'upload
  if (req.file) {
    updateData.picture = `/images/movies/${req.file.filename}`;
    console.log('✅ Image uploadée:', updateData.picture);
  }
  
  await Movie.update(updateData, { where: { id: movieId } });
  res.redirect('/admin?success=movie_validated');
}
```

**Logique :**
1. Vérifie si `req.file` existe (ajouté par Multer)
2. Si oui, ajoute le chemin de l'image à `updateData`
3. Met à jour le film avec le nouveau statut ET la nouvelle image

---

#### 4. `/app/views/admin-dashboard.ejs`
**Modifications :** Formulaire de validation

```html
<!-- AVANT -->
<form method="POST" action="/admin/validateMovie/<%= upMovie.id %>">

<!-- APRÈS -->
<form method="POST" action="/admin/validateMovie/<%= upMovie.id %>" 
      enctype="multipart/form-data" 
      id="validateMovieForm">
```

**Points clés :**
- `enctype="multipart/form-data"` : obligatoire pour l'upload de fichiers
- `id="validateMovieForm"` : pour le ciblage JavaScript

---

#### 5. `/app/public/js/admin-dashboard.js`
**Modifications :** Ajout de la gestion complète de l'upload

**Sections ajoutées :**

##### a) Récupération des éléments DOM
```javascript
const uploadFilmButton = document.getElementById("uploadFilmButton");
const filmImageInput = document.getElementById("filmImageInput");
const filmImagePreview = document.getElementById("filmImagePreview");
```

##### b) Ouverture du sélecteur de fichier
```javascript
uploadFilmButton.addEventListener("click", () => {
  filmImageInput.click(); // Ouvre le sélecteur
});
```

##### c) Prévisualisation de l'image
```javascript
filmImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (event) => {
      filmImagePreview.src = event.target.result; // Affiche l'image
    };
    reader.readAsDataURL(file);
  }
});
```

##### d) Transfert du fichier dans le formulaire
```javascript
validateMovieForm.addEventListener("submit", (e) => {
  if (filmImageInput.files.length > 0) {
    // Crée un input file dans le formulaire
    const formFileInput = document.createElement("input");
    formFileInput.type = "file";
    formFileInput.name = "filmImage";
    
    // Transfère le fichier
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(filmImageInput.files[0]);
    formFileInput.files = dataTransfer.files;
    
    // Ajoute au formulaire
    validateMovieForm.appendChild(formFileInput);
  }
});
```

---

#### 6. `/app/public/images/movies/`
**Nouveau dossier créé** pour stocker les images uploadées

---

## ⚙️ Fonctionnement détaillé

### Étape par étape

#### 1️⃣ **L'admin sélectionne un film à valider**
- Clique sur un film dans la sidebar
- Le film s'affiche dans la zone principale
- L'affiche actuelle (ou image par défaut) est visible

#### 2️⃣ **L'admin clique sur le bouton rouge 🔴**
```html
<button type="button" class="btn btn--red btn-upload-film" id="uploadFilmButton">
  <i class="fa-solid fa-upload"></i>
</button>
```
- JavaScript intercepte le clic
- Déclenche `filmImageInput.click()`
- Ouvre le sélecteur de fichier natif du navigateur

#### 3️⃣ **L'admin choisit une image**
- Navigateur retourne le fichier sélectionné
- JavaScript lit le fichier avec `FileReader`
- Affiche la prévisualisation immédiatement

#### 4️⃣ **L'admin clique sur "Valider le film"**
- JavaScript intercepte la soumission du formulaire
- Vérifie si un fichier a été sélectionné
- Crée un nouvel input dans le formulaire avec le fichier
- Laisse le formulaire se soumettre normalement

#### 5️⃣ **Le serveur reçoit la requête**
- Express route vers `/admin/validateMovie/:id`
- Multer middleware intercepte
- Vérifie le format et la taille
- Sauvegarde dans `/public/images/movies/`
- Ajoute `req.file` avec les infos du fichier

#### 6️⃣ **Le contrôleur met à jour la BDD**
```javascript
updateData = {
  status: true,
  picture: "/images/movies/movie-affiche-1732377600000-123456789.jpg"
}
```
- Le film est validé
- L'image est enregistrée en BDD
- Redirection vers `/admin?success=movie_validated`

#### 7️⃣ **Confirmation affichée**
```javascript
if (success === "movie_validated") {
  alert("✅ Film validé avec succès !");
}
```

---

## 💻 Utilisation

### Pour l'administrateur

1. **Se connecter** à l'espace administrateur
2. **Aller** dans "Validation des films"
3. **Sélectionner** un film en attente
4. **Cliquer** sur le bouton rouge 🔴 pour uploader une image
5. **Choisir** une image (JPG, PNG, WEBP max 5MB)
6. **Vérifier** la prévisualisation
7. **Cliquer** sur "Valider le film"
8. **Confirmer** le message de succès

### Cas particuliers

#### ✅ Valider sans changer l'image
- Ne pas cliquer sur le bouton upload
- Cliquer directement sur "Valider le film"
- L'image existante sera conservée

#### ✅ Changer l'image plusieurs fois
- Cliquer sur le bouton upload
- Sélectionner une nouvelle image
- La prévisualisation se met à jour
- Seule la dernière image sera envoyée

---

## 🧪 Tests

### Test 1 : Upload d'une nouvelle image
```
✓ Cliquer sur bouton upload → Sélecteur s'ouvre
✓ Sélectionner une image JPG → Prévisualisation s'affiche
✓ Cliquer "Valider le film" → Image uploadée
✓ Vérifier en BDD : champ 'picture' mis à jour
✓ Vérifier sur disque : fichier dans /images/movies/
```

### Test 2 : Format invalide
```
✓ Sélectionner un fichier PDF
✓ Vérifier : Alert "⚠️ Veuillez sélectionner une image"
✓ L'upload est bloqué
```

### Test 3 : Validation sans image
```
✓ Ne pas cliquer sur upload
✓ Cliquer directement "Valider le film"
✓ Le film est validé
✓ L'image existante est conservée
```

### Test 4 : Fichier trop lourd
```
✓ Sélectionner une image > 5 MB
✓ Multer rejette le fichier
✓ Erreur 500 renvoyée (à améliorer avec message user-friendly)
```

---

## 🔧 Dépannage

### Problème 1 : "Le bouton upload ne fait rien"
**Solutions :**
- Vérifier que `admin-dashboard.js` est bien chargé
- Ouvrir la console : vérifier les erreurs JS
- Vérifier les IDs : `uploadFilmButton`, `filmImageInput`

### Problème 2 : "Pas de prévisualisation"
**Solutions :**
- Vérifier l'ID : `filmImagePreview`
- Vérifier le format du fichier
- Console : regarder le log "✅ Prévisualisation de l'image"

### Problème 3 : "Erreur 500 lors de l'upload"
**Solutions :**
- Vérifier les permissions du dossier `/images/movies/`
- Vérifier la taille du fichier (< 5 MB)
- Console serveur : lire l'erreur Multer

### Problème 4 : "L'image ne s'enregistre pas en BDD"
**Solutions :**
- Vérifier que le formulaire a `enctype="multipart/form-data"`
- Console serveur : vérifier le log `console.log('fichierData:', updateData)`
- Vérifier que `req.file` existe dans le contrôleur

### Problème 5 : "Permission denied"
**Commandes :**
```bash
# Donner les permissions au dossier
chmod 755 /var/www/html/Cinédélices/dwwm-cinedelices/app/public/images/movies

# Vérifier le propriétaire
ls -la app/public/images/
```

---

## 📊 Base de données

### Champ concerné : `movies.picture`

```sql
-- Structure
picture VARCHAR(255) NULL

-- Exemple de valeur après upload
picture = '/images/movies/movie-affiche-1732377600000-987654321.jpg'

-- Requête pour voir les films avec image
SELECT id, title, picture, status FROM movies WHERE picture IS NOT NULL;
```

---

## 🚀 Améliorations futures possibles

### 🎨 UX
- [ ] Loader pendant l'upload
- [ ] Progress bar
- [ ] Drag & drop
- [ ] Crop/resize image côté client

### 🔒 Sécurité
- [ ] Validation côté serveur du type MIME réel
- [ ] Scan antivirus
- [ ] Limitation du nombre d'uploads par IP

### 🖼️ Images
- [ ] Génération automatique de miniatures
- [ ] Compression automatique
- [ ] Conversion en WebP
- [ ] Suppression de l'ancienne image lors du remplacement

### 🛠️ Technique
- [ ] Stockage cloud (AWS S3, Cloudinary)
- [ ] CDN pour la distribution
- [ ] Messages d'erreur plus explicites
- [ ] Historique des images uploadées

---

## 📝 Notes techniques

### Technologies utilisées
- **Multer** v2.0.2 : Middleware Node.js pour l'upload de fichiers
- **FileReader API** : API Web pour lire les fichiers côté client
- **DataTransfer API** : API Web pour transférer des fichiers entre éléments

### Sécurité
- ✅ Validation du type MIME
- ✅ Limite de taille
- ✅ Noms de fichiers uniques (évite écrasement)
- ⚠️ Pas de validation approfondie du contenu (à améliorer)

### Performance
- Upload synchrone (bloque le formulaire)
- Pas de compression côté serveur
- Stockage local (pas de CDN)

---

## 👨‍💻 Auteur

**GitHub Copilot**  
Date : 23 novembre 2025  
Contexte : Projet Ciné Délices - DWWM

---

## 📚 Ressources

- [Documentation Multer](https://github.com/expressjs/multer)
- [FileReader API - MDN](https://developer.mozilla.org/fr/docs/Web/API/FileReader)
- [FormData - MDN](https://developer.mozilla.org/fr/docs/Web/API/FormData)

---

**Fin de la documentation**
