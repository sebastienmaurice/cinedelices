# 07 - Déploiement & Environnement

## 📚 Table des matières

1. [Installation locale](#installation-locale)
2. [Configuration](#configuration)
3. [Variables d'environnement](#variables-denvironnement)
4. [Base de données](#base-de-données)
5. [Démarrage du projet](#démarrage-du-projet)
6. [Dépannage](#dépannage)

---

## Installation locale

### Prérequis

Avant de commencer, vous devez avoir installé :

- ✅ **Node.js** (version 18 ou supérieure)
- ✅ **PostgreSQL** (version 12 ou supérieure)
- ✅ **npm** (gestionnaire de paquets Node.js)

### Vérifier les installations

```bash
# Vérifier Node.js
node --version
# Doit afficher : v18.x.x ou supérieur

# Vérifier npm
npm --version
# Doit afficher : 9.x.x ou supérieur

# Vérifier PostgreSQL
psql --version
# Doit afficher : psql (PostgreSQL) 12.x ou supérieur
```

### Étapes d'installation

#### 1. Cloner ou télécharger le projet

```bash
# Si vous avez accès au dépôt Git
git clone <url-du-depot>

# Sinon, téléchargez et décompressez le projet
cd dwwm-cinedelices
```

#### 2. Installer les dépendances

```bash
# Installer toutes les bibliothèques nécessaires
npm install
```

**Ce que ça fait** :
- Lit le fichier `package.json`
- Télécharge toutes les bibliothèques listées
- Les installe dans le dossier `node_modules/`

**Temps estimé** : 1-2 minutes

#### 3. Créer la base de données PostgreSQL

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE cinedelices;

# Créer un utilisateur (optionnel, pour la sécurité)
CREATE USER cinedelices WITH PASSWORD 'votre_mot_de_passe';

# Donner les permissions
GRANT ALL PRIVILEGES ON DATABASE cinedelices TO cinedelices;

# Quitter PostgreSQL
\q
```

#### 4. Initialiser la base de données

```bash
# Créer les tables et insérer les données de base
npm run db:init
```

**Ce que ça fait** :
- Exécute le script `app/data/create_db.sql`
- Crée toutes les tables (users, movies, recipes, notices, etc.)
- Insère des données de test

---

## Configuration

### Fichier `.env`

Le fichier `.env` contient toutes les **variables d'environnement** (informations sensibles).

**Important** : Ce fichier ne doit **jamais** être partagé ou versionné dans Git.

#### Créer le fichier `.env`

```bash
# Créer le fichier .env à la racine du projet
touch .env
```

#### Contenu du fichier `.env`

```env
# Base de données PostgreSQL
PG_URL=postgresql://cinedelices:votre_mot_de_passe@localhost:5432/cinedelices

# Port du serveur
PORT=3000

# JWT Secret (clé pour chiffrer les tokens)
JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire

# TMDB API (optionnel, pour la recherche de films)
TMDB_API_KEY=votre_cle_api_tmdb
TMDB_API_URL=https://api.themoviedb.org/3
```

### Explication des variables

#### `PG_URL`

**Format** : `postgresql://utilisateur:mot_de_passe@hôte:port/nom_base`

**Exemple** :
```
postgresql://cinedelices:monpassword@localhost:5432/cinedelices
```

**Composants** :
- `cinedelices` : Nom d'utilisateur PostgreSQL
- `monpassword` : Mot de passe
- `localhost` : Adresse du serveur (localhost = votre machine)
- `5432` : Port PostgreSQL (par défaut)
- `cinedelices` : Nom de la base de données

#### `PORT`

**Rôle** : Port sur lequel le serveur écoute

**Par défaut** : `3000`

**URL complète** : `http://localhost:3000`

#### `JWT_SECRET`

**Rôle** : Clé secrète pour signer les tokens JWT (authentification)

**Important** : Doit être long, aléatoire et secret

**Générer un secret** :
```bash
# Générer un secret aléatoire
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### `TMDB_API_KEY` (optionnel)

**Rôle** : Clé API pour utiliser The Movie Database

**Comment l'obtenir** :
1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/)
2. Aller dans [Settings > API](https://www.themoviedb.org/settings/api)
3. Demander une clé API (gratuite)
4. Copier la clé dans `.env`

**Note** : Sans cette clé, la recherche TMDB ne fonctionnera pas, mais le reste du site fonctionne.

---

## Variables d'environnement

### Pourquoi utiliser des variables d'environnement ?

**Avantages** :
- ✅ **Sécurité** : Les mots de passe ne sont pas dans le code
- ✅ **Flexibilité** : Configuration différente selon l'environnement (dev, prod)
- ✅ **Simplicité** : Un seul fichier à modifier

### Comment les utiliser dans le code

```javascript
// Dans index.js ou un contrôleur
import "dotenv/config";

// Accéder à une variable
const port = process.env.PORT || 3000;
const dbUrl = process.env.PG_URL;
```

**Note** : `dotenv/config` charge automatiquement le fichier `.env`

---

## Base de données

### Structure de la base de données

Le projet utilise **5 tables principales** :

1. **`users`** : Utilisateurs du site
2. **`movies`** : Films et séries
3. **`recipes`** : Recettes
4. **`notices`** : Avis/commentaires sur les recettes
5. **`users_recipes`** : Relation entre utilisateurs et recettes favorites

### Scripts SQL disponibles

#### Créer la base de données

```bash
npm run db:init
```

**Fichier** : `app/data/create_db.sql`

**Ce que ça fait** :
- Crée toutes les tables
- Insère des données de test

#### Migrations (ajout de colonnes)

```bash
# Ajouter la colonne tmdb_id
npm run db:migrate

# Ajouter la colonne type (film/série)
npm run db:migrate-type

# Mettre à jour les genres
npm run db:migrate-genres
```

**Fichiers** :
- `app/data/migration_add_tmdb_id.sql`
- `app/data/migration_add_type_column.sql`
- `app/data/migration_update_genres.sql`

### Accéder à la base de données

```bash
# Se connecter avec psql
psql -U cinedelices -d cinedelices

# Ou avec l'utilisateur postgres
sudo -u postgres psql -d cinedelices
```

**Commandes utiles** :
```sql
-- Voir toutes les tables
\dt

-- Voir la structure d'une table
\d movies

-- Voir toutes les données d'une table
SELECT * FROM movies;

-- Quitter
\q
```

---

## Démarrage du projet

### Mode développement

```bash
# Démarrer le serveur en mode développement
npm run dev
```

**Ce que ça fait** :
- Démarre le serveur sur `http://localhost:3000`
- Redémarre automatiquement si vous modifiez le code (watch mode)

**Message attendu** :
```
Le serveur est démarré sur http://localhost:3000
✅ Connexion à la base de données établie avec succès.
```

### Accéder au site

Ouvrez votre navigateur et allez sur :
```
http://localhost:3000
```

### Arrêter le serveur

Appuyez sur `Ctrl + C` dans le terminal.

---

## Dépannage

### Problème : "Cannot find module"

**Erreur** :
```
Error: Cannot find module 'express'
```

**Solution** :
```bash
# Réinstaller les dépendances
rm -rf node_modules
npm install
```

### Problème : "Connection refused" (PostgreSQL)

**Erreur** :
```
❌ Impossible de se connecter à la base de données
```

**Solutions** :

1. **Vérifier que PostgreSQL est démarré** :
```bash
# Linux
sudo systemctl status postgresql
sudo systemctl start postgresql

# macOS
brew services start postgresql
```

2. **Vérifier la connexion** :
```bash
psql -U cinedelices -d cinedelices
```

3. **Vérifier le fichier `.env`** :
- Le `PG_URL` est-il correct ?
- Les identifiants sont-ils bons ?

### Problème : "Port 3000 already in use"

**Erreur** :
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions** :

1. **Changer le port** dans `.env` :
```env
PORT=3001
```

2. **Tuer le processus qui utilise le port** :
```bash
# Trouver le processus
lsof -i :3000

# Tuer le processus (remplacer PID par le numéro)
kill -9 PID
```

### Problème : "Table does not exist"

**Erreur** :
```
Error: relation "movies" does not exist
```

**Solution** :
```bash
# Réinitialiser la base de données
npm run db:init
```

### Problème : Les images ne s'affichent pas

**Vérifications** :

1. **Le dossier `app/public/images/` existe-t-il ?**
2. **Les chemins dans la base de données sont-ils corrects ?**
   - Doivent commencer par `/images/...`
3. **Le serveur sert-il les fichiers statiques ?**
   - Vérifier `index.js` : `app.use(express.static("./app/public"));`

---

## 🎯 Ce que vous avez appris

✅ Comment installer le projet localement  
✅ Comment configurer les variables d'environnement  
✅ Comment initialiser la base de données  
✅ Comment démarrer le serveur  
✅ Comment résoudre les problèmes courants  

---

## 📖 Prochaines étapes

Maintenant que vous savez installer et configurer le projet, vous pouvez :

→ **[Consulter le bilan pédagogique](./../08-BILAN-PEDAGOGIQUE/README.md)**

---

**Retour à l'[index principal](./../README.md)**
