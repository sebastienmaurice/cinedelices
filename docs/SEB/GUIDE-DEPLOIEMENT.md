# Guide de déploiement — Ciné Délices

> **Rédigé le :** 2026-04-29  
> **Auteur :** Sébastien  
> **Infrastructure cible :** Render (PaaS) ou Hostinger VPS  
> **Stack :** Node.js / Express / PostgreSQL / Cloudinary

---

## Résumé de l'état du projet

Le projet a subi un **audit technique complet** suivi d'une **mise en conformité production**.  
Toutes les corrections bloquantes identifiées ont été appliquées directement dans le code.

| | |
|---|---|
| **Score avant corrections** | 52 / 100 |
| **Score après corrections** | 94 / 100 |
| **Prêt pour déploiement** | ✅ OUI — sous réserve de configurer les variables d'environnement |

---

## Ce qui a été fait (corrections appliquées dans le code)

### Infrastructure & démarrage

- **Script `start` ajouté** dans `package.json` → `"start": "node index.js"`  
  Sans ce script, Render ne savait pas comment démarrer l'application.

- **Version Node.js spécifiée** dans `package.json` → `"engines": { "node": ">=20.0.0" }`  
  Évite qu'un hébergeur utilise une version incompatible.

- **Crash au démarrage si la BDD est inaccessible** dans `sequelize-client.js`  
  Le serveur s'arrête proprement (`process.exit(1)`) au lieu de démarrer en état cassé.

---

### Cloudinary — stockage des images

C'était le problème le plus critique. Sur Render et Hostinger VPS (sans volume persistant), les fichiers uploadés sont **perdus à chaque redémarrage**. Tout le système d'upload a été migré vers Cloudinary.

**Fichiers créés :**

- `app/utils/cloudinary-config.js` — connexion Cloudinary via variables d'environnement
- `app/utils/asset-manager.js` — fonctions `deleteAsset()`, `uploadToCloudinary()`, `uploadBufferToCloudinary()`

**Middlewares Multer migrés :**

| Middleware | Avant | Après |
|---|---|---|
| `upload-avatar.middleware.js` | Disque local `/images/profiles/` | Cloudinary `cinedelices/profiles/` |
| `upload-banner.middleware.js` | Disque local `/images/banner-auteur/` | Temp `/tmp` → Sharp → Cloudinary `cinedelices/banners/` |
| `upload.middleware.js` (recettes) | Disque local `/images/recipes/` | Temp `/tmp` → Sharp → Cloudinary `cinedelices/recipes/` |
| `upload-movie.middleware.js` | Disque local `/images/movies/originals/` | Cloudinary `cinedelices/movies/` |

**Utilitaires migrés :**

- `recipe-image-processor.js` — Sharp valide le ratio, redimensionne en WebP, envoie le buffer sur Cloudinary
- `tmdb-image-downloader.js` — télécharge l'affiche TMDB en mémoire puis l'envoie sur Cloudinary

**Suppression des anciens fichiers :**  
La fonction `unlinkIfExists()` (suppression disque local) est remplacée par `deleteAsset()` dans :
- `auth.controller.js` (avatars, bannières, photos de recettes utilisateur)
- `admin.controllers.js` (toutes les suppressions admin)

---

### Sécurité HTTP

- **Helmet installé et activé** dans `index.js`  
  Ajoute automatiquement les headers de sécurité : `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, etc.

- **Rate limiting** sur les endpoints d'authentification dans `auth.route.js`  
  - `POST /auth/login` → 20 tentatives max / 15 min / IP  
  - `POST /auth/forgot-password` → 20 tentatives max / 15 min / IP

- **`sameSite: "strict"`** ajouté sur tous les cookies JWT  
  Dans `auth.controller.js` — login, register, Google OAuth.

---

### Monitoring & disponibilité

- **Route healthcheck** ajoutée dans `index.js`  
  `GET /health` → `{ "status": "ok" }`  
  Render et les load balancers Hostinger peuvent l'utiliser pour détecter si le service est opérationnel.

---

### Documentation

- **`.env.example` complété** avec toutes les variables nécessaires :  
  `NODE_ENV`, `GOOGLE_CLIENT_SECRET`, `TMDB_API_KEY`, `CLOUDINARY_*`, `SMTP_*`

- **`AUDIT-DEPLOIEMENT-RENDER.md`** mis à jour pour refléter l'état après corrections.

---

### Packages installés

```
cloudinary               ^1.41.3
multer-storage-cloudinary ^4.0.0
helmet                   ^8.1.0
express-rate-limit       ^8.4.1
```

---

## Ce qu'il reste à faire avant de déployer

### Étape 1 — Créer un compte Cloudinary (gratuit)

1. Aller sur [cloudinary.com](https://cloudinary.com/) → créer un compte gratuit
2. Dans le Dashboard → **Product Environment Credentials**, noter :
   - `Cloud Name`
   - `API Key`
   - `API Secret`

---

### Étape 2 — Choisir et configurer le SMTP pour les emails

La réinitialisation de mot de passe (« Mot de passe oublié ») nécessite un vrai SMTP en production.

Options gratuites recommandées :

| Service | Emails gratuits/mois | Lien |
|---|---|---|
| **Brevo** (ex-Sendinblue) | 300/jour | [brevo.com](https://www.brevo.com/) |
| **Resend** | 3 000/mois | [resend.com](https://resend.com/) |
| **Mailgun** | 100/jour | [mailgun.com](https://www.mailgun.com/) |

Après inscription, récupérer : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.

---

### Étape 3A — Déploiement sur Render

#### 3A.1 — Créer le service PostgreSQL

1. Render Dashboard → **New** → **PostgreSQL**
2. Choisir le plan Free (ou payant si besoin)
3. Après création, copier l'**Internal Database URL** (format `postgresql://...`)

#### 3A.2 — Créer le service Web

1. Render Dashboard → **New** → **Web Service**
2. Connecter le dépôt GitHub
3. Configurer :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Node Version** : 20 (ou laisser Render détecter via `engines`)
   - **Health Check Path** : `/health`

#### 3A.3 — Variables d'environnement dans Render

Dans l'onglet **Environment** du service web, ajouter :

```
PG_URL                → Internal Database URL du service PostgreSQL Render
JWT_SECRET            → générer avec : openssl rand -hex 64
NODE_ENV              → production
BASE_URL              → https://votre-domaine.com (ou URL Render)

GOOGLE_CLIENT_ID      → depuis Google Cloud Console
GOOGLE_CLIENT_SECRET  → depuis Google Cloud Console

TMDB_API_KEY          → depuis themoviedb.org/settings/api

CLOUDINARY_CLOUD_NAME → depuis Cloudinary Dashboard
CLOUDINARY_API_KEY    → depuis Cloudinary Dashboard
CLOUDINARY_API_SECRET → depuis Cloudinary Dashboard

SMTP_HOST             → smtp.brevo.com (ou autre)
SMTP_PORT             → 587
SMTP_USER             → votre-email@domaine.com
SMTP_PASS             → mot de passe SMTP
SMTP_FROM             → Ciné Délices <no-reply@cinedelices.fr>
```

---

### Étape 3B — Déploiement sur Hostinger VPS (alternative)

#### 3B.1 — Prérequis sur le VPS

```bash
# Installer Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Installer PM2 (gestionnaire de process Node.js)
npm install -g pm2
```

#### 3B.2 — Créer la base de données PostgreSQL

```bash
sudo -u postgres psql
CREATE DATABASE cinedelices;
CREATE USER cinedelices WITH PASSWORD 'mot_de_passe_fort';
GRANT ALL PRIVILEGES ON DATABASE cinedelices TO cinedelices;
\q
```

#### 3B.3 — Cloner et configurer le projet

```bash
git clone https://github.com/votre-repo/cinedelices.git
cd cinedelices
npm install

# Créer le .env à partir de l'exemple
cp .env.example .env
nano .env   # remplir toutes les valeurs
```

#### 3B.4 — Démarrer avec PM2

```bash
NODE_ENV=production pm2 start index.js --name cinedelices
pm2 save
pm2 startup   # pour redémarrer au reboot du VPS
```

#### 3B.5 — Configurer Nginx comme reverse proxy

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
# Activer HTTPS avec Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

### Étape 4 — Initialiser la base de données

Que ce soit sur Render ou Hostinger, exécuter les migrations dans cet ordre.

**Sur Render** (via Render Shell) :

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

**Sur Hostinger VPS** (même commandes, avec la variable `PG_URL` de ton `.env`) :

```bash
source .env
psql $PG_URL -f app/data/create_db.sql
# ... idem
```

---

### Étape 5 — Configurer Google OAuth pour la production

1. [Google Cloud Console](https://console.cloud.google.com/) → Identifiants → ton app OAuth
2. Ajouter dans **Origines JavaScript autorisées** :
   - `https://votre-domaine.com`
3. Ajouter dans **URI de redirection autorisés** :
   - `https://votre-domaine.com/auth/google`

---

## Checklist finale avant la mise en ligne

```
RENDER / VPS
□ Variables d'environnement toutes renseignées
□ PG_URL pointe vers la bonne base PostgreSQL
□ NODE_ENV=production défini
□ BASE_URL = URL publique du site (avec https)

BASE DE DONNÉES
□ create_db.sql exécuté
□ Toutes les migrations exécutées dans l'ordre

CLOUDINARY
□ Compte créé et clés API renseignées
□ Tester un upload avatar en local avec les clés Cloudinary prod

EMAIL
□ SMTP configuré (ou accepté que les emails ne fonctionnent pas encore)

GOOGLE OAUTH
□ Domaine de production ajouté dans Google Cloud Console

VÉRIFICATIONS POST-DÉPLOIEMENT
□ GET /health → { "status": "ok" }
□ Page d'accueil s'affiche
□ Login / Register fonctionne
□ Upload avatar → URL https://res.cloudinary.com/... visible dans la BDD
□ Mot de passe oublié → email reçu
□ Google OAuth fonctionne
□ Interface admin accessible
□ Logs sans erreurs au démarrage
```

---

## Ce qui reste à améliorer (non bloquant)

Ces points n'empêchent pas le déploiement mais sont à traiter pour une application robuste en production.

| Priorité | Sujet | Détail |
|---|---|---|
| Moyenne | Emails en production | Configurer SMTP (Brevo recommandé) |
| Faible | `error.message` dans les réponses admin | Remplacer par un message générique, logger côté serveur |
| Faible | Cache nav sans limite (`_navCache`) | Ajouter une taille max pour éviter les fuites mémoire sur le long terme |
| Info | Logs structurés | Envisager `pino` pour des logs exploitables en production |
| Info | Compression gzip | Installer `compression` pour améliorer les performances |
