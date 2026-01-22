# Vérification et Mise à Jour Multer - Rapport

**Date :** 2025-12-18  
**Objectif :** Vérifier et mettre à jour le processus d'upload pour les films (admin) et les recettes (utilisateur)

---

## 📋 ÉTAT ACTUEL - VÉRIFICATIONS

### 1️⃣ Structure des Dossiers

#### Films (Admin)

✅ **Dossiers existants** :

- `app/public/images/movies/originals/` - ✅ Existe
- `app/public/images/movies/banners/` - ✅ Existe
- `app/public/images/movies/cards/` - ✅ Existe

**Fichiers dans `originals/`** :

- `original-american-pie.png`
- `original-bienvenue-chez-les-chtis.png`
- `original-harry-potter.png`
- `original-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- `original-le-silence-des-agneaux.png`

**Fichiers dans `banners/`** :

- `banner-american-pie.jpg`
- `banner-bienvenue-chez-les-chtis.jpg`
- `banner-harry-potter.jpg`
- `banner-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- `banner-le-silence-des-agneaux.jpg`

**Fichiers dans `cards/`** :

- `card-american-pie.jpg`
- `card-bienvenue-chez-les-chtis.jpg`
- `card-harry-potter.jpg`
- `card-indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg`
- `card-le-silence-des-agneaux.jpg`

**Fichiers à la racine de `movies/`** (anciens fichiers avec timestamp) :

- `movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg`
- `movie-american_pie-1764103560707-335098533.png`
- `movie-bienvenue_chtis-1764103577240-542365048.png`
- `movie-harry_potter-1763858232674-340071843.png`
- `movie-Le-silence-des-agneaux-1764145159444-648907832.png`

#### Recettes (Utilisateur)

✅ **Dossiers existants** :

- `app/public/images/recipes/` - ✅ Existe
- `app/public/images/recipes/cards/` - ✅ Existe

**Fichiers dans `recipes/`** :

- `applepie-1764137966385-745300976.jpg`
- `biereaubeurre-1764137132022-745397718.jpeg`
- `carbonnade_chtis-1764138416283-708167994.jpeg`
- `recipe-brownies_willy_le_borgne-1764262264623-479036853.png`
- etc.

---

### 2️⃣ Configuration Multer Actuelle

#### Films (Admin) - `upload-movie.middleware.js`

**État actuel** :

```javascript
destination: app / public / images / movies; // ❌ Devrait être originals/
filename: "movie-" + nameWithoutExt + "-" + uniqueSuffix + ext; // ❌ Devrait utiliser file.originalname
```

**Problèmes identifiés** :

- ❌ Stocke dans `movies/` au lieu de `movies/originals/`
- ❌ Génère un nom avec timestamp au lieu d'utiliser `file.originalname`
- ❌ Format actuel : `movie-{name}-{timestamp}-{random}.ext`

**Attendu** :

- ✅ Stocker dans `movies/originals/`
- ✅ Utiliser `file.originalname` (nom lisible et fixe)
- ✅ Format attendu : `original-{nom-du-film}.{ext}` (ou directement le nom original si l'admin le prépare correctement)

#### Recettes (Utilisateur) - `upload.middleware.js`

**État actuel** :

```javascript
destination: app / public / images / recipes; // ✅ Correct
filename: "recipe-" + nameWithoutExt + "-" + uniqueSuffix + ext; // ✅ Correct (nom unique)
```

**Statut** :

- ✅ Stocke dans `recipes/` (correct)
- ✅ Génère un nom unique avec timestamp (correct pour éviter collisions)
- ✅ Format actuel : `recipe-{name}-{timestamp}-{random}.ext` (correct)

---

### 3️⃣ Controllers - Stockage en BDD

#### Films (Admin) - `admin.controllers.js`

**État actuel** :

```javascript
if (req.file) {
  updateData.picture = `/images/movies/${req.file.filename}`;
}
```

**Problèmes identifiés** :

- ❌ Stocke le chemin vers `/images/movies/{filename}` au lieu de `/images/movies/originals/{filename}`
- ❌ Ne gère pas les chemins pour `banners/` et `cards/`

**Attendu** :

- ✅ Stocker le chemin vers `/images/movies/originals/{filename}`
- ⚠️ **Note** : Les versions banners/cards sont créées manuellement par l'admin et placées dans leurs dossiers respectifs. Le workflow actuel ne les gère pas automatiquement.

#### Recettes (Utilisateur) - `add-recipes-movies.controllers.js`

**État actuel** :

```javascript
if (req.file) {
  imagePath = `/images/recipes/${req.file.filename}`;
}
```

**Statut** :

- ✅ Stocke correctement dans `/images/recipes/{filename}`
- ✅ Format correct pour l'affichage

---

### 4️⃣ Base de Données

**Chemins stockés actuellement** :

```sql
'/images/movies/movie-harry_potter-1763858232674-340071843.png'
'/images/movies/movie-american_pie-1764103560707-335098533.png'
'/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png'
'/images/movies/movie-Le silence des agneaux-1764145159444-648907832.png'
'/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg'
```

**Problèmes identifiés** :

- ❌ Chemins pointent vers `/images/movies/` au lieu de `/images/movies/originals/`
- ❌ Noms de fichiers avec timestamp (ancien format)

---

## 🔧 CORRECTIONS NÉCESSAIRES

### 1. Modifier `upload-movie.middleware.js`

**Changements** :

1. Destination : `movies/originals/` au lieu de `movies/`
2. Filename : Utiliser `file.originalname` au lieu de générer un nom avec timestamp
3. Sanitizer : Nettoyer le nom de fichier pour éviter les caractères problématiques

### 2. Modifier `admin.controllers.js`

**Changements** :

1. Chemin stocké : `/images/movies/originals/${req.file.filename}` au lieu de `/images/movies/${req.file.filename}`

### 3. Vérifier `upload.middleware.js` (Recettes)

**Statut** : ✅ Aucune modification nécessaire (déjà correct)

---

## ⚠️ POINTS D'ATTENTION

### Workflow Films (Admin)

**Workflow attendu** :

1. L'admin prépare les images avec le nom final (ex: `original-indiana-jones.jpg`, `banner-indiana-jones.jpg`, `card-indiana-jones.jpg`)
2. Upload de l'original → Multer stocke dans `originals/` avec le nom original
3. Les versions banners/cards sont déjà créées et placées dans leurs dossiers respectifs
4. Sauvegarder le chemin de l'original en BDD : `/images/movies/originals/{filename}`

**Note** : Pour l'instant, le workflow ne gère pas automatiquement les banners/cards. L'admin doit les créer manuellement et les placer dans les dossiers appropriés.

### Workflow Recettes (Utilisateur)

**Workflow actuel** :

1. L'utilisateur upload via formulaire
2. Multer stocke dans `recipes/` avec un nom unique
3. Chemin stocké en BDD : `/images/recipes/{filename}`
4. Affichage full-size : `/images/recipes/{filename}`
5. Card : `/images/recipes/cards/{filename}` si crop côté serveur ou CSS crop frontend

**Statut** : ✅ Workflow correct, aucune modification nécessaire

---

## ✅ VALIDATION

### Tests à Effectuer Après Correction

1. ✅ Upload d'un film (admin) :

   - Vérifier que le fichier est stocké dans `movies/originals/`
   - Vérifier que le nom de fichier est celui de l'original (pas de timestamp)
   - Vérifier que le chemin en BDD est `/images/movies/originals/{filename}`

2. ✅ Upload d'une recette (utilisateur) :

   - Vérifier que le fichier est stocké dans `recipes/`
   - Vérifier que le nom de fichier contient un timestamp (nom unique)
   - Vérifier que le chemin en BDD est `/images/recipes/{filename}`

3. ✅ Affichage des images :
   - Vérifier que les images s'affichent correctement sur le site
   - Vérifier que les chemins sont accessibles

---

**Fin du rapport de vérification**
