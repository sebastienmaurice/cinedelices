# Ciné Délices — Guide Développement & Base de données

> **Mis à jour :** 2026-05-15
> **Setup :** Render (prod) · PostgreSQL local (dev) · Cloudinary (images) · Resend (emails)

---

## 🔗 URLs & accès

| Service | URL |
|---|---|
| Site prod | https://cinedelices.com |
| Render (interne) | https://cinedelices-fjc7.onrender.com |
| Local | http://localhost:3000 |
| Admin prod | https://cinedelices.com/admin |
| Google Search Console | https://search.google.com/search-console |
| Render Dashboard | https://dashboard.render.com |
| Cloudinary | https://cloudinary.com |

---

## 🖥️ Développement local (Windows)

### Lancer le serveur
```bash
npm install
npm run dev
# Accès : http://localhost:3000
```

### Connexion PostgreSQL locale
```bash
psql -U cinedelices -d cinedelices
# Mot de passe : cinedelices (local uniquement)
```

### Créer la BDD from scratch
```bash
# 1. Créer le schéma
npm run db:init

# 2. Appliquer toutes les migrations dans l'ordre
npm run db:migrate-all
```

### Commandes psql utiles
```sql
\dt              -- lister les tables
\d nom_table     -- décrire une table
\q               -- quitter psql
```

---

## 🚀 Production — Render

### Déployer une modification
```bash
git add .
git commit -m "description du changement"
git push origin feat/cinedelices-polish
# Render redéploie automatiquement en 2-3 min
```

### Appliquer une migration SQL sur Render
Via le **Shell Render** (Dashboard → ton service → Shell) :
```bash
# Option A — fichier SQL
psql $PG_URL -f app/data/ma_migration.sql

# Option B — commande directe
psql $PG_URL -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS ma_colonne VARCHAR(255);"

# Option C — via Node
node -e "
import('./app/database/sequelize-client.js').then(async ({ default: sequelize }) => {
  await sequelize.query('ALTER TABLE ...');
  console.log('OK');
  process.exit(0);
});
"
```

---

## 👤 Gestion des rôles utilisateurs

### Promouvoir un user en admin

**En local :**
```bash
psql -U cinedelices -d cinedelices
```
```sql
UPDATE users SET role = 'admin' WHERE pseudo = 'MonPseudo';
-- Superadmin (accès complet) :
UPDATE users SET role = 'superadmin' WHERE pseudo = 'MonPseudo';
-- Vérifier :
SELECT id, pseudo, email, role FROM users ORDER BY id;
```

**Sur Render (Shell) :**
```bash
psql $PG_URL -c "UPDATE users SET role = 'admin' WHERE pseudo = 'MonPseudo';"
```

### Rôles disponibles

| Rôle | Accès |
|---|---|
| `user` | Membre standard |
| `admin` | Dashboard admin |
| `superadmin` | Admin complet + actions destructives |

---

## 💾 Sauvegarde & export BDD

### Export données locales
```bash
pg_dump -U cinedelices -d cinedelices \
  --data-only --inserts --column-inserts \
  --no-privileges --no-owner \
  -t users -t movies -t recipes -t recipe_pictures \
  -t notices -t users_recipes -t favorites -t ratings -t user_points \
  -f "data_only.sql"
# Mot de passe : cinedelices
```

> ⚠️ `data_only.sql` contient des données utilisateurs — il est dans `.gitignore`, ne pas le committer.

### Import vers Render
```bash
# Depuis le PC (utiliser Get-Content sous PowerShell)
Get-Content data_only.sql | psql "postgresql://USER:PASS@HOST.frankfurt-postgres.render.com/DBNAME"
```

---

## 🔧 Scripts npm

| Commande | Action |
|---|---|
| `npm run dev` | Serveur local avec hot-reload |
| `npm run start` | Serveur production |
| `npm run db:init` | Crée le schéma BDD depuis `create_db.sql` |
| `npm run db:migrate-all` | Applique toutes les migrations dans l'ordre |

---

## 🛡️ Fichiers sensibles — ne jamais committer

Le `.gitignore` protège déjà :

| Fichier | Raison |
|---|---|
| `.env` | Clés API, JWT secret, DB credentials |
| `data_only.sql` | Données utilisateurs |
| `backup_*.sql` | Sauvegardes BDD |
| `sauvegarde.sql` | Sauvegarde BDD |
| `*.pem` / `*.key` | Certificats et clés privées |

Les vraies valeurs des variables d'environnement sont **uniquement** dans :
- `.env` en local (jamais commité)
- Le dashboard Render en production (Environment → Variables)

---

## 🔄 Checklist redéploiement from scratch

```
COMPTES EXTERNES
□ Cloudinary — cloud_name, api_key, api_secret
□ Resend — RESEND_API_KEY
□ Google Cloud Console — CLIENT_ID, CLIENT_SECRET

RENDER
□ Créer PostgreSQL (Frankfurt, Free)
□ Créer Web Service (branch feat/cinedelices-polish, Starter)
□ Renseigner les variables d'environnement
□ Build: npm install / Start: npm start / Health: /health

BASE DE DONNÉES (Shell Render)
□ psql $PG_URL -f app/data/create_db.sql
□ npm run db:migrate-all  ← ou appliquer les fichiers un par un
□ Ajouter colonnes manquantes (createdAt, updatedAt, pending_picture)
□ Importer les données via data_only.sql

VÉRIFICATIONS
□ GET /health → { "status": "ok" }
□ Homepage s'affiche
□ Login fonctionne
□ Upload avatar → URL Cloudinary en BDD
□ Google Search Console → soumettre sitemap.xml
```
