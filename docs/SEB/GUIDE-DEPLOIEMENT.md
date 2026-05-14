# Guide de déploiement — Ciné Délices

> **Rédigé le :** 2026-04-29 — **Mis à jour le :** 2026-05-14  
> **Auteur :** Sébastien  
> **Infrastructure :** Render (PaaS) + PostgreSQL + Cloudinary + Resend  
> **URL prod :** https://cinedelices.com  
> **URL Render :** https://cinedelices-fjc7.onrender.com

---

## État du projet

|                     |                                           |
| ------------------- | ----------------------------------------- |
| **Site en ligne**      | ✅ OUI — cinedelices.com                      |
| **Base de données**    | ✅ PostgreSQL Render (Frankfurt)              |
| **Stockage images**    | ✅ Cloudinary                                 |
| **Emails**             | ✅ Resend + domaine cinedelices.com vérifié   |
| **Domaine custom**     | ✅ cinedelices.com → Render (HTTPS actif)     |
| **Google OAuth**       | ✅ Redirect flow (popup flow bloqué Chrome)   |
| **Page maintenance**   | ✅ MAINTENANCE=true/false dans Render Env     |

---

## Ce qui a été fait dans le code

| Correction                                  | Fichier                       |
| ------------------------------------------- | ----------------------------- |
| Script `"start": "node index.js"`           | `package.json`                |
| Node.js `"engines": { "node": ">=20.0.0" }` | `package.json`                |
| `process.exit(1)` si BDD inaccessible       | `sequelize-client.js`         |
| **Fix search_path PostgreSQL Render**       | `sequelize-client.js`         |
| Helmet (headers sécurité HTTP)              | `index.js`                    |
| Healthcheck `GET /health`                   | `index.js`                    |
| Rate limiting login + forgot-password       | `auth.route.js`               |
| `sameSite: "strict"` cookies JWT            | `auth.controller.js`          |
| Cloudinary — avatars                        | `upload-avatar.middleware.js` |
| Cloudinary — films (admin)                  | `upload-movie.middleware.js`  |
| Cloudinary — recettes (Sharp → Cloudinary)  | `recipe-image-processor.js`   |
| Cloudinary — bannières (Sharp → Cloudinary) | `auth.controller.js`          |
| Cloudinary — affiches TMDB                  | `tmdb-image-downloader.js`    |
| `deleteAsset()` remplace `unlinkIfExists()` | `asset-manager.js`            |
| Service mail migré vers **Resend**          | `mail.service.js`             |
| `robots.txt`                                | `app/public/robots.txt`       |
| `sitemap.xml`                               | `app/public/sitemap.xml`      |
| `.env.example` complet                      | `.env.example`                |
| Google OAuth redirect flow                  | `google-auth.js` + `auth.controller.js` |
| Page de maintenance + bypass admin          | `index.js` + `maintenance.ejs` |
| Formulaire contact branché Resend           | `contact-about.controllers.js` |
| Logo animé page maintenance                 | `maintenance.ejs` |
| Login standalone `/auth/login`              | `login-standalone.ejs` |
| `super_admin` reconnu partout               | `is-admin`, `is-superadmin`, `admin.controllers` |

**Packages installés :**

```
cloudinary  multer-storage-cloudinary  helmet  express-rate-limit  resend
```

---

## Déploiement pas à pas — ce qu'on a fait le 2026-05-13

### 1. Comptes externes créés

| Service        | Usage                            | Clés dans `.env`                                 |
| -------------- | -------------------------------- | ------------------------------------------------ |
| **Cloudinary** | Stockage images                  | `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET` |
| **Resend**     | Emails transactionnels           | `RESEND_API_KEY`                                 |
| **Hostinger**  | Nom de domaine `cinedelices.com` | —                                                |

### 2. Render — Base de données PostgreSQL

1. Render Dashboard → **New → PostgreSQL**
2. Nom : `cinedelices-db` / Région : Frankfurt / Plan : **Free**
3. Récupérer l'**Internal Database URL** → mise dans `PG_URL`

### 3. Render — Web Service

1. **New → Web Service** → connecter GitHub `sebastienmaurice/cinedelices`
2. Branch : `feat/cinedelices-polish`
3. Build : `npm install` / Start : `npm start`
4. Plan : **Starter ($7/mois)** — pas de mise en veille
5. Health Check : `/health`
6. Variables d'environnement collées via "Add from .env"

### 4. Migrations SQL (dans le Shell Render)

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

### 5. Fix search_path PostgreSQL — problème rencontré et solution

**Problème :** Render PostgreSQL ne cherche pas dans le schéma `public` par défaut.  
L'erreur était : `relation "recipes" does not exist` alors que la table existait.

**Solution appliquée** dans `sequelize-client.js` :

```js
hooks: {
  afterConnect: async (connection) => {
    await connection.query("SET search_path TO public;");
  },
},
```

### 6. Import des données locales vers Render

**Problème rencontré :** la BDD locale avait des colonnes `createdAt`, `updatedAt`, `pending_picture` absentes de Render.

**Solution :** ajouter les colonnes manquantes dans le Shell Render :

```bash
psql $PG_URL -c "
ALTER TABLE movies ADD COLUMN IF NOT EXISTS \"createdAt\" TIMESTAMP;
ALTER TABLE movies ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS \"createdAt\" TIMESTAMP;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS \"updatedAt\" TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_picture VARCHAR(255);
"
```

**Export depuis le PC local (PowerShell) :**

```bash
pg_dump postgresql://cinedelices:cinedelices@localhost:5432/cinedelices --data-only --inserts --column-inserts --no-privileges --no-owner -t users -t movies -t recipes -t recipe_pictures -t notices -t users_recipes -t favorites -t ratings -t user_points > data_only.sql
```

**Import vers Render (PowerShell — utiliser `Get-Content` car `<` non supporté) :**

```bash
Get-Content data_only.sql | psql postgresql://USER:PASS@HOST.frankfurt-postgres.render.com/DBNAME
```

> ⚠️ Utiliser l'**External Database URL** (avec `.frankfurt-postgres.render.com`) depuis le PC, pas l'Internal URL.

### 7. Encodage des données — problème rencontré et solution

**Problème :** Les données locales contenaient du double-encodage UTF-8 (`Ã©` au lieu de `é`). PowerShell corrompt les bytes UTF-8 lors du piping vers psql.

**Solution :** Re-fetch des synopsis/genres/titres directement depuis l'API TMDB via un script Node.js dans le Shell Render :

```bash
node --input-type=module << 'EOF'
import sequelize from './app/database/sequelize-client.js';
const movies = await sequelize.query(
  "SELECT id, tmdb_id, type FROM movies WHERE tmdb_id IS NOT NULL",
  { type: 'SELECT' }
);
const KEY = process.env.TMDB_API_KEY;
for (const m of movies) {
  const r = await fetch(`https://api.themoviedb.org/3/movie/${m.tmdb_id}?api_key=${KEY}&language=fr-FR`);
  const data = await r.json();
  if (data.overview) {
    await sequelize.query('UPDATE movies SET synopsis = :s WHERE id = :id',
      { replacements: { s: data.overview, id: m.id } });
  }
}
await sequelize.close(); process.exit(0);
EOF
```

Pour les descriptions de recettes (contenu utilisateur) : exporter avec `cmd /c pg_dump > file.sql` (bypass PowerShell), commiter le fichier, et importer avec `psql $PG_URL -f file.sql` dans le Shell Render.

### 8. Attribution des données — problème rencontré et solution

**Problème :** Lors de l'import, les IDs utilisateurs locaux ne correspondaient pas aux IDs Render. Les recettes de SEB (id=3 local) étaient attribuées à La Malice (id=3 sur Render).

**Solution :** Corriger manuellement l'attribution via SQL dans le Shell Render :

```bash
psql $PG_URL -c "
UPDATE recipes SET id_user = 6 WHERE id IN (2,3,4,5,6,22);
UPDATE movies SET id_user = 6 WHERE id IN (31,33);
"
```

> Toujours vérifier les IDs après import : `SELECT id, pseudo FROM users ORDER BY id;`

### 9. Google OAuth — problème rencontré et solution

**Problème :** Le popup flow (`ux_mode: 'popup'`) ne fonctionnait pas — le callback `handleGoogleCode` n'était jamais déclenché. Chrome bloque le `postMessage` cross-origin entre la popup Google et la page.

**Solution :** Passer au redirect flow (`ux_mode: 'redirect'`) dans `google-auth.js` + nouvelle route `GET /auth/google/callback` dans le contrôleur.

**À ajouter dans Google Cloud Console** → URI de redirection autorisés :
```
https://cinedelices.com/auth/google/callback
```

### 10. Page de maintenance

**Activation :** Render Dashboard → Environment → `MAINTENANCE=true`  
**Désactivation :** Render Dashboard → Environment → `MAINTENANCE=false`

Les admins/superadmins passent automatiquement. En maintenance, aller sur `https://cinedelices.com/admin` → bouton "Se connecter" → formulaire de login admin.

---

## Variables d'environnement complètes

### `.env` local (développement)

```env
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
PG_URL=postgresql://cinedelices:cinedelices@localhost:5432/cinedelices
JWT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TMDB_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
```

### Render Dashboard (production)

```env
PORT=3000
NODE_ENV=production
BASE_URL=https://cinedelices.com
PG_URL=postgresql://...@dpg-xxx-a/cinedelices_db_xxx  ← Internal URL Render
JWT_SECRET=...  ← openssl rand -hex 64
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
TMDB_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
RESEND_API_KEY=...
```

---

## Workflow — modifier et déployer le site

```
1. Modifier le code dans VS Code
2. git add -A
3. git commit -m "description du changement"
4. git push origin feat/cinedelices-polish
         ↓
   Render détecte le push automatiquement
         ↓
   Redéploiement en 2-3 minutes
         ↓
   Site mis à jour sur cinedelices-fjc7.onrender.com
```

Render est configuré en **Auto-Deploy on Commit** — aucune action manuelle requise.

---

## Ce qui reste à faire

### Prioritaire

```
□ Pointer cinedelices.com → Render (DNS Hostinger)
  → Ajouter CNAME : cinedelices.com → cinedelices-fjc7.onrender.com
  → Ajouter le domaine custom dans Render Dashboard → Settings → Custom Domains

□ Mettre à jour BASE_URL dans Render → https://cinedelices.com

□ Vérifier le domaine cinedelices.com sur Resend
  → Resend Dashboard → Domains → Add domain → cinedelices.com
  → Ajouter les enregistrements DNS fournis par Resend dans Hostinger

□ Mettre à jour Google Cloud Console
  → Origines autorisées : https://cinedelices.com
  → URI de redirection : https://cinedelices.com/auth/google
```

### Après mise en ligne

```
□ Brancher le formulaire contact sur Resend (contact-about.controllers.js ligne 33)
□ Configurer CORS si accès API externe
□ Mettre en place CI/CD GitHub Actions
□ Mettre à jour robots.txt et sitemap.xml avec cinedelices.com
□ Page de maintenance (variable MAINTENANCE=true dans Render)
```

---

## Checklist si redéploiement from scratch

```
COMPTES EXTERNES
□ Cloudinary — récupérer cloud_name, api_key, api_secret
□ Resend — récupérer RESEND_API_KEY
□ Google Cloud Console — récupérer CLIENT_ID et CLIENT_SECRET

RENDER
□ Créer PostgreSQL (Frankfurt, Free)
□ Créer Web Service (branch feat/cinedelices-polish, Starter)
□ Renseigner toutes les variables d'environnement
□ Build: npm install / Start: npm start / Health: /health

BASE DE DONNÉES
□ Exécuter create_db.sql dans le Shell Render
□ Exécuter les 18 migrations dans l'ordre
□ Ajouter les colonnes manquantes (createdAt, updatedAt, pending_picture)
□ Importer les données via data_only.sql

VÉRIFICATIONS
□ GET /health → { "status": "ok" }
□ Homepage s'affiche
□ Login fonctionne
□ Upload avatar → URL Cloudinary en BDD
```
