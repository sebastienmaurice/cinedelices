# Correction des Chemins d'Images - Films

**Date :** 2025-12-18  
**Problème :** Images non affichées sur le site  
**Statut :** ✅ **CORRIGÉ**

---

## 🔍 PROBLÈME IDENTIFIÉ

Deux films avaient des incohérences entre les chemins stockés en base de données et les noms de fichiers réels sur le disque.

### 1. "Le silence des agneaux" (ID: 4)

**Problème** :

- **Chemin BDD** : `/images/movies/movie-Le silence des agneaux-1764145159444-648907832.png` (avec **espaces**)
- **Fichier réel** : `movie-Le-silence-des-agneaux-1764145159444-648907832.png` (avec **tirets**)

**Impact** : Le navigateur ne trouvait pas le fichier car les espaces dans l'URL ne correspondaient pas au nom de fichier réel.

### 2. "Bienvenue chez les Ch'tis" (ID: 3)

**Problème** :

- **Chemin BDD** : `/images/movies/cards/movie-card-bienvenue-chez-les-ch-tis-17660602959699488.jpg` (fichier dans cards/)
- **Fichier réel** : `movie-bienvenue_chtis-1764103577240-542365048.png` (fichier original dans movies/)

**Impact** : Le chemin pointait vers un fichier qui n'existait pas ou avait été déplacé.

---

## ✅ CORRECTIONS APPLIQUÉES

### Correction 1: "Le silence des agneaux"

**Avant** :

```sql
picture: '/images/movies/movie-Le silence des agneaux-1764145159444-648907832.png'
```

**Après** :

```sql
picture: '/images/movies/movie-Le-silence-des-agneaux-1764145159444-648907832.png'
```

**Changement** : Espaces remplacés par des tirets pour correspondre au nom de fichier réel.

### Correction 2: "Bienvenue chez les Ch'tis"

**Avant** :

```sql
picture: '/images/movies/cards/movie-card-bienvenue-chez-les-ch-tis-17660602959699488.jpg'
```

**Après** :

```sql
picture: '/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png'
```

**Changement** : Chemin corrigé pour pointer vers le fichier original dans `movies/` au lieu d'un fichier inexistant dans `cards/`.

---

## ✅ VALIDATION

### Vérification des fichiers

- ✅ **Fichier "Le silence des agneaux"** : Existe et accessible

  - Chemin : `app/public/images/movies/movie-Le-silence-des-agneaux-1764145159444-648907832.png`
  - Taille : 2.5 MB
  - HTTP Status : 200 ✅

- ✅ **Fichier "Bienvenue chez les Ch'tis"** : Existe et accessible
  - Chemin : `app/public/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png`
  - Taille : 3.7 MB
  - HTTP Status : 200 ✅

### Vérification de l'accès HTTP

```bash
# Test "Le silence des agneaux"
curl -I http://localhost:3000/images/movies/movie-Le-silence-des-agneaux-1764145159444-648907832.png
# Résultat : HTTP/1.1 200 OK ✅

# Test "Bienvenue chez les Ch'tis"
curl -I http://localhost:3000/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png
# Résultat : HTTP/1.1 200 OK ✅
```

---

## 📝 CAUSES DU PROBLÈME

### 1. Espaces dans les noms de fichiers

**Cause** : Lors de l'upload initial, le nom du film a été utilisé tel quel dans le nom de fichier, créant des espaces. Plus tard, le fichier a été renommé avec des tirets, mais la BDD n'a pas été mise à jour.

**Solution** : Normaliser les noms de fichiers (remplacer espaces par tirets) et s'assurer que la BDD correspond toujours aux fichiers réels.

### 2. Déplacement de fichiers

**Cause** : Le fichier "Bienvenue chez les Ch'tis" a été traité par le pipeline et déplacé dans `cards/`, mais le fichier original a été conservé. La BDD pointait vers le fichier traité qui n'existait plus.

**Solution** : Utiliser le fichier original dans `movies/` ou s'assurer que les fichiers traités existent bien.

---

## 🔧 SCRIPT DE CORRECTION

Un script a été créé pour détecter et corriger automatiquement ces problèmes :

**Fichier** : `app/utils/fix-movie-picture-paths.js`

**Fonctionnalités** :

- ✅ Vérifie tous les films
- ✅ Compare les chemins BDD avec les fichiers réels
- ✅ Détecte les incohérences (espaces vs tirets)
- ✅ Corrige automatiquement les chemins

**Usage** :

```bash
node app/utils/fix-movie-picture-paths.js
```

---

## ✅ RÉSULTAT

Les deux images sont maintenant **accessibles et affichées correctement** sur le site :

1. ✅ **"Le silence des agneaux"** : Image visible
2. ✅ **"Bienvenue chez les Ch'tis"** : Image visible

Les chemins en base de données correspondent maintenant exactement aux noms de fichiers réels.

---

## 📋 RECOMMANDATIONS

### Pour éviter ce problème à l'avenir

1. **Normaliser les noms de fichiers** :

   - Toujours utiliser des tirets au lieu d'espaces
   - Utiliser `slugifier()` pour générer les noms de fichiers

2. **Vérifier la cohérence** :

   - Après chaque upload, vérifier que le chemin BDD correspond au fichier réel
   - Utiliser le script de vérification régulièrement

3. **Gestion des fichiers traités** :
   - Si un fichier est traité et déplacé, mettre à jour la BDD
   - Ou conserver le fichier original et pointer vers lui

---

**Fin du document**
