# Guide d'Installation des Dépendances - Ciné Délices

**Date :** 2025-01-26  
**Pour :** Équipe de développement

---

## 📦 Installation des dépendances Node.js

### Commande principale

```bash
npm install
```

Cette commande installera automatiquement toutes les dépendances listées dans `package.json`.

---

## 📋 Liste des dépendances

### Dépendances principales

| Package                   | Version  | Description                           |
| ------------------------- | -------- | ------------------------------------- |
| **argon2**                | ^0.44.0  | Hash de mots de passe sécurisé        |
| **cookie-parser**         | ^1.4.7   | Parsing des cookies HTTP              |
| **dotenv**                | ^17.2.3  | Gestion des variables d'environnement |
| **ejs**                   | ^3.1.10  | Moteur de template EJS                |
| **express**               | ^5.1.0   | Framework web Node.js                 |
| **express-xss-sanitizer** | ^2.0.1   | Protection XSS                        |
| **http-status-codes**     | ^2.3.0   | Constantes pour codes HTTP            |
| **joi**                   | ^17.13.3 | Validation de schémas                 |
| **jsonwebtoken**          | ^9.0.2   | Génération et vérification de JWT     |
| **multer**                | ^2.0.2   | Middleware pour upload de fichiers    |
| **pg**                    | ^8.16.3  | Client PostgreSQL                     |
| **sequelize**             | ^6.37.7  | ORM pour PostgreSQL                   |
| **sharp**                 | ^0.33.5  | Traitement et optimisation d'images   |

---

## 🚀 Étapes d'installation

### 1. Cloner le projet (si pas déjà fait)

```bash
git clone <url-du-repo>
cd dwwm-cinedelices
```

### 2. Installer les dépendances

```bash
npm install
```

Cette commande va :

- Lire le fichier `package.json`
- Télécharger toutes les dépendances listées
- Installer `sharp` (nécessaire pour le traitement d'images)
- Créer le dossier `node_modules/`

**Temps estimé :** 1-3 minutes selon la connexion

### 3. Vérifier l'installation

```bash
npm list --depth=0
```

Vous devriez voir toutes les dépendances listées ci-dessus.

---

## 🔧 Configuration requise

### Node.js

- **Version minimale :** Node.js 18.x ou supérieur
- **Vérifier votre version :**
  ```bash
  node --version
  ```

### PostgreSQL

- **Version :** PostgreSQL 12.x ou supérieur
- **Base de données :** `cinedelices`
- **Utilisateur :** `cinedelices`

### Système

- **OS :** Linux, macOS, ou Windows (avec WSL recommandé)
- **Espace disque :** ~200 MB pour `node_modules/`

---

## ⚙️ Configuration post-installation

### 1. Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cinedelices
DB_USER=cinedelices
DB_PASSWORD=votre_mot_de_passe

TMDB_API_KEY=votre_clé_api_tmdb
TMDB_API_URL=https://api.themoviedb.org/3

JWT_SECRET=votre_secret_jwt
```

### 2. Initialisation de la base de données

```bash
npm run db:init
```

Cette commande va créer toutes les tables et insérer les données initiales.

---

## 🎯 Dépendances critiques

### Sharp (Traitement d'images)

**Nouveau depuis l'activation du pipeline d'images**

- **Usage :** Traitement, redimensionnement et optimisation des images
- **Version :** ^0.33.5
- **Installation automatique :** Oui, via `npm install`

Si vous rencontrez des problèmes avec Sharp, vérifiez :

- Node.js version 18+ requis
- Compilateurs natifs disponibles (gcc, python, etc.)

### Multer (Upload de fichiers)

- **Usage :** Gestion des uploads d'images (films, recettes)
- **Limite :** 5 MB par fichier
- **Formats acceptés :** JPG, JPEG, PNG, WEBP

---

## 🔍 Vérification rapide

Après installation, vérifiez que tout fonctionne :

```bash
# Vérifier les dépendances
npm list --depth=0

# Lancer le serveur en mode dev
npm run dev
```

Le serveur devrait démarrer sur `http://localhost:3000` (ou le PORT configuré).

---

## ❓ Problèmes courants

### Erreur : "sharp installation failed"

**Solution :**

```bash
# Sur Ubuntu/Debian
sudo apt-get install build-essential

# Puis réinstaller Sharp
npm rebuild sharp
```

### Erreur : "Cannot find module"

**Solution :**

```bash
# Supprimer node_modules et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### Erreur : "Port already in use"

**Solution :**

- Changer le PORT dans `.env`
- Ou tuer le processus : `lsof -ti:3000 | xargs kill`

---

## 📚 Ressources

- **Documentation Sharp :** https://sharp.pixelplumbing.com/
- **Documentation Express :** https://expressjs.com/
- **Documentation Sequelize :** https://sequelize.org/

---

**Fin du guide**
