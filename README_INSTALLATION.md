# Guide d'Installation — Ciné Délices

Pour l'équipe de développement

---

## 📦 Installation des dépendances

```bash
npm install
```

---

## 📋 Dépendances principales

### Core Backend

- **express** ^5.x — Framework web
- **sequelize** ^6.x — ORM pour PostgreSQL
- **pg** ^8.x — Client PostgreSQL

### Authentification & Sécurité

- **argon2** — Hash de mots de passe
- **jsonwebtoken** — JWT pour authentification
- **express-xss-sanitizer** — Protection XSS

### Templates & Frontend

- **ejs** — Moteur de templates
- **cookie-parser** — Gestion des cookies

### Upload & Images

- **multer** ^2.x — Upload de fichiers
- **sharp** ^0.33.x — Traitement et optimisation d'images (crop, resize, compress)

### Utilitaires

- **dotenv** — Variables d'environnement
- **joi** — Validation de données
- **http-status-codes** — Constantes HTTP

---

## 🚀 Étapes d'installation complète

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd dwwm-cinedelices
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer l'environnement

Copier `.env.example` en `.env` et remplir les valeurs :

```env
PORT=3000
BASE_URL=http://localhost:3000

PG_URL=postgresql://utilisateur:mot_de_passe@localhost:5432/cinedelices

JWT_SECRET=<générer avec : openssl rand -hex 64>

TMDB_API_KEY=<votre clé API The Movie Database>
TMDB_API_URL=https://api.themoviedb.org/3
```

> **Obtenir une clé TMDB** : [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)

### 4. Initialiser la base de données

```bash
npm run db:init
```

### 5. Appliquer les migrations

Les migrations doivent être jouées dans l'ordre suivant :

```bash
psql $PG_URL -f app/data/migration_gamification.sql
psql $PG_URL -f app/data/migration_add_gamif_columns.sql
```

Voir aussi les scripts npm disponibles :

```bash
npm run db:migrate               # migration principale
npm run db:migrate-genres        # ajout genres
npm run db:migrate-type          # colonne type films
npm run db:migrate-user-preferences
npm run db:migrate-user-picture-status
npm run db:migrate-user-ownership
npm run db:migrate-movie-delete-request
npm run db:migrate-pending-edits
```

### 6. Lancer le serveur

```bash
npm run dev
```

---

## ⚠️ Dépendance critique : Sharp

Sharp est nécessaire pour le traitement des photos de profil et des affiches.

Si l'installation échoue sur Linux/Ubuntu :

```bash
sudo apt-get install build-essential
npm rebuild sharp
```

---

## 📝 Commandes npm disponibles

| Commande | Description |
| -------- | ----------- |
| `npm run dev` | Serveur en mode développement (nodemon) |
| `npm run db:init` | Initialiser la base de données depuis zéro |
| `npm run db:migrate` | Migration principale |
| `npm run db:migrate-*` | Migrations spécifiques (voir package.json) |
