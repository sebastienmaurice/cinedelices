# Corrections Multer - Films et Recettes

**Date :** 2025-12-18  
**Statut :** ✅ **CORRECTIONS EFFECTUÉES**

---

## 📋 RÉSUMÉ DES CORRECTIONS

Mise à jour du processus d'upload pour respecter les règles définies :

- **Films (admin)** : Utilisation de `file.originalname`, stockage dans `originals/`
- **Recettes (utilisateur)** : Génération de noms uniques (déjà correct)

---

## 🔧 MODIFICATIONS EFFECTUÉES

### 1. `app/middlewares/upload-movie.middleware.js`

#### Avant

```javascript
destination: (req, file, cb) => {
  const uploadPath = path.join(__dirname, "../public/images/movies");
  cb(null, uploadPath);
},
filename: (req, file, cb) => {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname);
  const nameWithoutExt = path.basename(file.originalname, ext);
  cb(null, "movie-" + nameWithoutExt + "-" + uniqueSuffix + ext);
},
```

#### Après

```javascript
/**
 * Nettoie le nom de fichier pour éviter les caractères problématiques
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase();
}

destination: (req, file, cb) => {
  // Les images seront stockées dans app/public/images/movies/originals
  const uploadPath = path.join(__dirname, "../public/images/movies/originals");
  cb(null, uploadPath);
},
filename: (req, file, cb) => {
  // Utiliser le nom original du fichier (l'admin prépare les images avec le nom final)
  const sanitized = sanitizeFilename(file.originalname);
  cb(null, sanitized);
},
```

**Changements** :

- ✅ Destination : `movies/originals/` au lieu de `movies/`
- ✅ Filename : Utilise `file.originalname` (nettoyé) au lieu de générer un nom avec timestamp
- ✅ Ajout d'une fonction `sanitizeFilename()` pour nettoyer les noms de fichiers

---

### 2. `app/controllers/admin.controllers.js`

#### Avant

```javascript
if (req.file) {
  updateData.picture = `/images/movies/${req.file.filename}`;
}
```

#### Après

```javascript
if (req.file) {
  // Les images admin sont stockées dans movies/originals/
  updateData.picture = `/images/movies/originals/${req.file.filename}`;
}
```

**Changements** :

- ✅ Chemin stocké : `/images/movies/originals/${req.file.filename}` au lieu de `/images/movies/${req.file.filename}`

---

### 3. `app/middlewares/upload.middleware.js` (Recettes)

**Statut** : ✅ **Aucune modification nécessaire**

Le middleware pour les recettes est déjà correct :

- ✅ Stocke dans `recipes/`
- ✅ Génère un nom unique avec timestamp
- ✅ Format : `recipe-{name}-{timestamp}-{random}.ext`

---

## ✅ RÉSULTAT

### Films (Admin)

**Workflow** :

1. L'admin prépare les images avec le nom final (ex: `original-indiana-jones.jpg`)
2. Upload → Multer stocke dans `movies/originals/` avec le nom original (nettoyé)
3. Chemin stocké en BDD : `/images/movies/originals/{filename}`
4. Les versions banners/cards sont créées manuellement par l'admin et placées dans leurs dossiers respectifs

**Caractéristiques** :

- ✅ Pas de numéro aléatoire pour les films
- ✅ Nom de fichier lisible et fixe
- ✅ Stockage dans `originals/`
- ✅ Chemin correct en BDD

### Recettes (Utilisateur)

**Workflow** :

1. L'utilisateur upload via formulaire
2. Multer stocke dans `recipes/` avec un nom unique
3. Chemin stocké en BDD : `/images/recipes/{filename}`
4. Affichage full-size : `/images/recipes/{filename}`

**Caractéristiques** :

- ✅ Nom unique avec timestamp (évite les collisions)
- ✅ Stockage dans `recipes/`
- ✅ Chemin correct en BDD

---

## 🧪 VALIDATION

### Tests à Effectuer

1. ✅ **Upload d'un film (admin)** :

   - Vérifier que le fichier est stocké dans `movies/originals/`
   - Vérifier que le nom de fichier est celui de l'original (pas de timestamp)
   - Vérifier que le chemin en BDD est `/images/movies/originals/{filename}`

2. ✅ **Upload d'une recette (utilisateur)** :

   - Vérifier que le fichier est stocké dans `recipes/`
   - Vérifier que le nom de fichier contient un timestamp (nom unique)
   - Vérifier que le chemin en BDD est `/images/recipes/{filename}`

3. ✅ **Affichage des images** :
   - Vérifier que les images s'affichent correctement sur le site
   - Vérifier que les chemins sont accessibles

---

## 📝 NOTES IMPORTANTES

### Fonction `sanitizeFilename()`

La fonction `sanitizeFilename()` :

- Remplace les espaces par des tirets
- Supprime les caractères spéciaux (sauf tirets, underscores, points)
- Convertit en minuscules

**Exemples** :

- `Original Indiana Jones.jpg` → `original-indiana-jones.jpg`
- `Banner - American Pie!.png` → `banner---american-pie.png`
- `card_harry_potter.jpg` → `card_harry_potter.jpg`

### Séparation Films / Recettes

- ✅ **Films (admin)** : Pas de mélange, workflow séparé
- ✅ **Recettes (utilisateur)** : Pas de mélange, workflow séparé
- ✅ **Noms de fichiers** : Films = nom original, Recettes = nom unique

---

## ✅ CONCLUSION

Les corrections ont été effectuées avec succès. Le pipeline d'upload respecte maintenant les règles définies :

- ✅ Films (admin) : Nom original, stockage dans `originals/`
- ✅ Recettes (utilisateur) : Nom unique, stockage dans `recipes/`
- ✅ Pas de mélange entre les deux workflows
- ✅ Chemins corrects en BDD
- ✅ Validation MIME et taille max respectées

**Le système est prêt pour les tests.**

---

**Fin du document**
