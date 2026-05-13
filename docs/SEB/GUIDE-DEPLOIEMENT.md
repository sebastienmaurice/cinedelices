# Guide de déploiement — Ciné Délices

> **Rédigé le :** 2026-04-29 — **Mis à jour le :** 2026-05-13  
> **Auteur :** Sébastien  
> **Infrastructure cible :** Render (PaaS) ou Hostinger VPS  
> **Stack :** Node.js / Express / PostgreSQL / Cloudinary

---

## État du projet

| | |
|---|---|
| **Score de préparation** | **94 / 100** |
| **Code prêt** | ✅ OUI |
| **Prêt à déployer maintenant** | ⚠️ NON — configuration externe manquante |

---

## Ce qui a été fait dans le code ✅

| Correction | Fichier |
|---|---|
| Script `"start": "node index.js"` | `package.json` |
| Node.js `"engines": { "node": ">=20.0.0" }` | `package.json` |
| `process.exit(1)` si BDD inaccessible | `sequelize-client.js` |
| Helmet (headers sécurité HTTP) | `index.js` |
| Healthcheck `GET /health` | `index.js` |
| Rate limiting login + forgot-password (20 req/15 min) | `auth.route.js` |
| `sameSite: "strict"` sur tous les cookies JWT | `auth.controller.js` |
| Cloudinary — avatars | `upload-avatar.middleware.js` |
| Cloudinary — films (admin) | `upload-movie.middleware.js` |
| Cloudinary — recettes (Sharp → buffer → Cloudinary) | `recipe-image-processor.js` |
| Cloudinary — bannières (Sharp → buffer → Cloudinary) | `auth.controller.js` |
| Cloudinary — affiches TMDB (buffer → Cloudinary) | `tmdb-image-downloader.js` |
| `deleteAsset()` remplace `unlinkIfExists()` partout | `asset-manager.js` |
| `.env.example` complet avec toutes les variables | `.env.example` |
| `robots.txt` | `app/public/robots.txt` |
| `sitemap.xml` | `app/public/sitemap.xml` |

**Packages installés :**
```
cloudinary  multer-storage-cloudinary  helmet  express-rate-limit
```

---

## Ce qu'il reste à faire ❌

### Bloquant pour la prod

| # | Quoi | Où | Temps estimé |
|---|---|---|---|
| 1 | Créer un compte **Cloudinary** et renseigner les 3 clés | `.env` / dashboard hébergeur | 5 min |
| 2 | Configurer un **SMTP** (emails reset mdp + contact) | `.env` / dashboard hébergeur | 10 min |
| 3 | Mettre à jour le domaine dans **Google Cloud Console** | console.cloud.google.com | 5 min |
| 4 | Renseigner **toutes les variables d'environnement** | dashboard Render ou `.env` VPS | 15 min |
| 5 | Exécuter les **migrations SQL** (19 fichiers dans l'ordre) | psql / Render Shell | 10 min |
| 6 | Remplacer `cinedelices.com` par le **vrai domaine** dans `robots.txt` et `sitemap.xml` | 2 fichiers | 2 min |

### Non bloquant (à faire après la mise en ligne)

| # | Quoi | Détail |
|---|---|---|
| 7 | **Formulaire contact** ne envoie pas d'email | `contact-about.controllers.js` ligne 33 — `TODO` à brancher sur le service mail |
| 8 | **CORS** non configuré | À ajouter si un front externe ou une app mobile consomme l'API |
| 9 | **CI/CD** (pipeline GitHub Actions) | Déploiement automatique à chaque push sur `develop` |
| 10 | **Script d'installation VPS** | Script bash pour automatiser toute l'installation serveur |
| 11 | `error.message` exposé dans certaines routes admin | Remplacer par un message générique, logger côté serveur |
| 12 | `_navCache` sans limite d'éviction | Potentielle fuite mémoire sur fort trafic |
| 13 | Sitemap dynamique (fiches film/recette) | Route `/sitemap.xml` générée depuis la BDD |
| 14 | Logs structurés | Remplacer `console.log` par `pino` pour des logs exploitables |
| 15 | Compression gzip | Installer le package `compression` |

---

## Variables d'environnement

### Toutes obligatoires

```env
PORT=3000
NODE_ENV=production
BASE_URL=https://votre-domaine.com

# Base de données
PG_URL=postgresql://user:password@host:5432/cinedelices

# Sécurité
JWT_SECRET=      # openssl rand -hex 64

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# TMDB
TMDB_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### SMTP (obligatoire pour les emails)

```env
SMTP_HOST=smtp.brevo.com
SMTP_PORT=587
SMTP_USER=votre-email@domaine.com
SMTP_PASS=
SMTP_FROM=Ciné Délices <no-reply@cinedelices.fr>
```

**Services SMTP gratuits recommandés :**

| Service | Gratuit | Lien |
|---|---|---|
| Brevo | 300 emails/jour | brevo.com |
| Resend | 3 000 emails/mois | resend.com |
| Mailgun | 100 emails/jour | mailgun.com |

---

## Migrations SQL — ordre d'exécution

```bash
psql $PG_URL -f app/data/create_db.sql
psql $PG_URL -f app/data/migration_add_tmdb_id.sql
psql $PG_URL -f app/data/migration_update_genres.sql
psql $PG_URL -f app/data/migration_add_type_column.sql
psql $PG_URL -f app/data/migration_add_user_preferences.sql
psql $PG_URL -f app/data/migration_add_user_picture_status.sql
psql $PG_URL -f app/data/migration_add_user_ownership.sql
psql $PG_URL -f app/data/migration_add_pending_pseudo.sql
psql $PG_URL -f app/data/migration_add_recipe_pictures.sql
psql $PG_URL -f app/data/migration_add_slugs.sql
psql $PG_URL -f app/data/migration_add_synopsis.sql
psql $PG_URL -f app/data/migration_add_movie_delete_request.sql
psql $PG_URL -f app/data/migration_add_pending_edits.sql
psql $PG_URL -f app/data/migration_create_favorites.sql
psql $PG_URL -f app/data/migration_create_ratings.sql
psql $PG_URL -f app/data/migration_gamification.sql
psql $PG_URL -f app/data/migration_add_gamif_columns.sql
psql $PG_URL -f app/data/migration_add_google_auth.sql
psql $PG_URL -f app/data/migration_phase2_admin.sql
```

---

## Déploiement sur Render

### 1 — Service PostgreSQL

Render Dashboard → **New → PostgreSQL** → copier l'**Internal Database URL**

### 2 — Service Web

Render Dashboard → **New → Web Service** → connecter GitHub

```
Build Command  : npm install
Start Command  : npm start
Health Check   : /health
Node version   : 20+ (auto-détecté via engines)
```

### 3 — Variables d'environnement

Onglet **Environment** → ajouter toutes les variables listées ci-dessus.

---

## Déploiement sur Hostinger VPS

### 1 — Installer le serveur

```bash
# Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# PM2 + Nginx
npm install -g pm2
sudo apt-get install -y nginx
```

### 2 — Créer la base de données

```bash
sudo -u postgres psql
CREATE DATABASE cinedelices;
CREATE USER cinedelices WITH PASSWORD 'mot_de_passe_fort';
GRANT ALL PRIVILEGES ON DATABASE cinedelices TO cinedelices;
\q
```

### 3 — Cloner et configurer

```bash
git clone https://github.com/O-clock-Dundee/dwwm-cinedelices.git
cd dwwm-cinedelices
npm install
cp .env.example .env
nano .env   # remplir toutes les valeurs
```

### 4 — Exécuter les migrations

```bash
source .env
psql $PG_URL -f app/data/create_db.sql
# puis les 18 migrations dans l'ordre (voir section ci-dessus)
```

### 5 — Démarrer avec PM2

```bash
pm2 start index.js --name cinedelices --env production
pm2 save
pm2 startup
```

### 6 — Nginx + HTTPS

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo certbot --nginx -d votre-domaine.com
```

### 7 — Google OAuth

[console.cloud.google.com](https://console.cloud.google.com) → Identifiants → ajouter :
- Origines autorisées : `https://votre-domaine.com`
- URI de redirection : `https://votre-domaine.com/auth/google`

---

## Checklist finale

```
CONFIGURATION
□ Compte Cloudinary créé — 3 clés dans .env
□ SMTP configuré — 5 variables dans .env
□ JWT_SECRET généré (openssl rand -hex 64)
□ NODE_ENV=production
□ BASE_URL = domaine réel avec https
□ Google OAuth — domaine prod ajouté dans Google Cloud Console
□ robots.txt et sitemap.xml — remplacer cinedelices.com par le vrai domaine

BASE DE DONNÉES
□ create_db.sql exécuté
□ 18 migrations exécutées dans l'ordre

VÉRIFICATIONS POST-DÉPLOIEMENT
□ GET /health → { "status": "ok" }
□ Page d'accueil s'affiche
□ Login / Register fonctionne
□ Upload avatar → URL https://res.cloudinary.com/... en BDD
□ Mot de passe oublié → email reçu
□ Google OAuth fonctionne
□ Interface admin accessible
□ Logs sans erreurs au démarrage

À FAIRE APRÈS MISE EN LIGNE
□ Brancher le formulaire de contact sur le service mail (contact-about.controllers.js)
□ Configurer CORS si besoin d'un accès API externe
□ Mettre en place un pipeline CI/CD GitHub Actions
□ Créer un script d'installation automatisé pour le VPS
```
