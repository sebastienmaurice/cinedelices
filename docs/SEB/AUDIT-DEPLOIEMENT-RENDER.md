# Audit technique — Ciné Délices

> **Date :** 2026-04-29  
> **Cible :** Déploiement production sur Render + PostgreSQL + Cloudinary  
> **Auteur :** Audit Claude Code (Sonnet 4.6)

---

## État global du projet

| | |
|---|---|
| **Prêt pour production** | ❌ NON |
| **Score de préparation** | **52 / 100** |

---

## Problèmes critiques (bloquants avant déploiement)

### 1. Script `start` absent dans `package.json`

Render exécute `npm start` pour démarrer l'application. Ce script n'existe pas. Le seul script présent est `dev` qui utilise `node --watch` (mode développement). **L'application ne démarrera pas sur Render.**

**Correction dans `package.json` :**

```json
"scripts": {
  "start": "node index.js",
  "dev": "node --watch index.js"
}
```

---

### 2. Cloudinary non intégré — toutes les images perdues à chaque déploiement

C'est le problème le plus grave. Les 4 middlewares d'upload utilisent tous `multer.diskStorage` et sauvegardent les fichiers dans `./app/public/images/`. Le filesystem de Render est **éphémère** : il est réinitialisé à chaque redéploiement ou redémarrage.

| Middleware | Destination locale |
|---|---|
| `upload.middleware.js` | `app/public/images/recipes` |
| `upload-avatar.middleware.js` | `app/public/images/profiles` |
| `upload-banner.middleware.js` | `app/public/images/banner-auteur` |
| `upload-movie.middleware.js` | `app/public/images/movies` |

**Cloudinary n'est pas dans `package.json`, pas installé, pas référencé une seule fois dans le code.** Les images téléchargées par les utilisateurs (avatars, bannières, photos de recettes) seront **effacées à chaque déploiement.**

> Voir section "Instructions de correction : Cloudinary" en bas de ce document.

---

### 3. `NODE_ENV` jamais défini → comportements silencieusement incorrects en production

Trois comportements critiques sont conditionnés par `NODE_ENV === "production"` :

- **Cookie `secure: true`** → le cookie JWT ne sera pas protégé en HTTPS si `NODE_ENV` n'est pas défini (`auth.controller.js` lignes 85, 135, 1512)
- **Images recettes** → pas de conversion WebP, qualité non optimisée (`recipe-image-processor.js` ligne 21)
- **Email** → utilise Ethereal (boîte de test) au lieu du vrai SMTP

**Action requise :** dans Render Dashboard → Environment → ajouter la variable `NODE_ENV=production`.

---

### 4. Emails de réinitialisation de mot de passe non fonctionnels en production

Le service mail (`mail.service.js`) bascule sur Ethereal si `SMTP_HOST/SMTP_USER/SMTP_PASS` ne sont pas définis. En production, un utilisateur qui clique "Mot de passe oublié" ne recevra **jamais** l'email de réinitialisation.

**Action requise :** configurer un vrai SMTP (Brevo, Mailgun ou Resend — tous gratuits) et ajouter les variables suivantes dans Render :

```
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Ciné Délices <no-reply@cinedelices.fr>
```

---

### 5. Version Node.js non spécifiée

Le projet est développé sur Node 24, utilise la syntaxe ESM (`"type": "module"`) et du **top-level await** dans `sequelize-client.js` ligne 14. Sans champ `engines` dans `package.json`, Render peut choisir une version incompatible.

**Correction dans `package.json` :**

```json
"engines": {
  "node": ">=20.0.0"
}
```

---

### 6. `GOOGLE_CLIENT_SECRET` absent du `.env.example`

La variable est utilisée dans `auth.controller.js` (ligne 1597, flow OAuth2 Code) mais n'est pas documentée dans `.env.example`. Quiconque configure l'environnement à partir de l'exemple ratera cette variable et aura des erreurs Google OAuth silencieuses.

**Correction dans `.env.example` :**

```
GOOGLE_CLIENT_ID=votre-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=votre-client-secret
```

---

### 7. Échec de connexion BDD ne bloque pas le démarrage

Dans `sequelize-client.js` lignes 12-18, si la base PostgreSQL est inaccessible, l'erreur est loggée mais l'application **continue de démarrer**. Sur Render, cela peut aboutir à une app "en ligne" qui échoue sur toutes les requêtes BDD sans indication claire.

**Correction dans `app/database/sequelize-client.js` :**

```js
try {
  await sequelize.authenticate();
  console.log("✅ Connexion BDD établie.");
} catch (error) {
  console.error("❌ Connexion BDD impossible:", error);
  process.exit(1); // Forcer l'arrêt pour que Render détecte le crash
}
```

---

## Problèmes importants (non bloquants)

### 1. `error.message` transmis au client dans le dashboard admin

`admin.controllers.js` retourne `error.message` directement dans les réponses JSON (lignes 1451, 1489, 1510, 1526, 1563…). En production, cela peut exposer des détails internes (requêtes SQL, noms de tables, stack traces).

**Correction :** remplacer `error.message` par un message générique côté client, logger l'erreur réelle côté serveur uniquement.

---

### 2. Aucun middleware Helmet

`helmet` n'est ni installé ni utilisé. Sans lui, les headers HTTP de sécurité sont absents : pas de `X-Frame-Options`, pas de `X-Content-Type-Options`, pas de `Strict-Transport-Security`, pas de Content Security Policy.

**Correction :**

```bash
npm install helmet
```

Dans `index.js` (après `const app = express()`) :

```js
import helmet from "helmet";
app.use(helmet());
```

---

### 3. Aucun rate limiting sur les endpoints d'authentification

`POST /auth/login` et `POST /auth/forgot-password` n'ont aucune limitation de débit. Un attaquant peut faire des milliers de tentatives par seconde sans être bloqué (brute force).

**Correction :**

```bash
npm install express-rate-limit
```

Dans `app/routes/auth.route.js` :

```js
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: "Trop de tentatives. Réessayez dans 15 minutes." },
});

authRouter.post("/login", authLimiter, validateUserLogin, authController.login);
authRouter.post("/forgot-password", authLimiter, authController.forgotPasswordSubmit);
```

---

### 4. Cookie JWT sans attribut `SameSite`

Les cookies JWT dans `auth.controller.js` (lignes 83-87) ne définissent pas `sameSite`. Les navigateurs modernes appliquent `Lax` par défaut mais ce n'est pas garanti sur tous les clients.

**Correction à appliquer partout où un cookie JWT est émis** (lignes 83, 133, et dans `_issueJwt` ligne 1510) :

```js
res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 1000 * 60 * 60 * 2,
});
```

---

### 5. Cache en mémoire `_navCache` sans eviction

Dans `inject-locals.middleware.js` ligne 30, `_navCache` est une `Map` qui grandit sans jamais se vider. Avec des milliers d'utilisateurs distincts, la mémoire du processus augmentera indéfiniment.

**Correction possible :** limiter la Map à 500 entrées en supprimant la plus ancienne lors du dépassement, ou accepter la réinitialisation au redémarrage (comportement déjà existant).

---

### 6. `TMDB_API_KEY` non documentée dans `.env.example`

Utilisée dans `tmdb.controllers.js` (ligne 9) et `movies.controllers.js` (ligne 21). Son absence dans `.env.example` causera des erreurs 500 silencieuses sur toutes les recherches TMDB si la variable est oubliée lors du déploiement.

**Correction dans `.env.example` :**

```
TMDB_API_KEY=votre-clé-tmdb
```

---

## Améliorations recommandées

1. **Créer un fichier `render.yaml`** à la racine pour documenter la configuration Render (build command, start command, env vars requises).
2. **Ajouter une route de healthcheck** `GET /health` → retourne `{ status: "ok" }`. Render peut l'utiliser pour vérifier que le service est opérationnel.
3. **Logs structurés** : remplacer les `console.log/error` par un logger comme `pino` pour avoir des logs exploitables dans Render Dashboard.
4. **Compression gzip** : installer `compression` pour compresser les réponses HTTP (CSS, JS, HTML).
5. **Migrer les images statiques vers Cloudinary** : les images "par défaut" dans `app/public/images/` (profil, film, recette) devraient aussi être servies depuis Cloudinary pour réduire la taille du repo git.
6. **Documenter la séquence de migration BDD** : les 20 fichiers SQL dans `app/data/` n'ont pas d'ordre d'exécution documenté.

---

## Compatibilité avec Render

**Compatible : ❌ NON** (en l'état actuel)

| Point de vérification | État | Détail |
|---|---|---|
| Port dynamique `process.env.PORT` | ✅ | Correct dans `index.js` ligne 14 |
| Script `start` dans `package.json` | ❌ | **Absent — déploiement impossible** |
| Connexion PostgreSQL via variable d'env | ✅ | `PG_URL` utilisé correctement |
| Pas de localhost codé en dur dans BDD | ✅ | OK |
| Storage des uploads | ❌ | **Disk local → éphémère sur Render** |
| Node.js version spécifiée | ❌ | Champ `engines` absent |
| `NODE_ENV=production` configurable | ✅ | À définir dans Render Dashboard |
| Dépendances npm installables | ✅ | `package.json` valide |
| Cloudinary intégré | ❌ | **Absent du projet** |

---

## Checklist avant déploiement

### Corrections bloquantes

- [ ] Ajouter `"start": "node index.js"` dans `package.json`
- [ ] Intégrer Cloudinary pour tous les uploads (recettes, avatars, bannières, films)
- [ ] Définir `NODE_ENV=production` dans Render Environment
- [ ] Configurer SMTP réel (Brevo / Mailgun / Resend) + variables `SMTP_*`
- [ ] Ajouter `"engines": { "node": ">=20.0.0" }` dans `package.json`
- [ ] Ajouter `GOOGLE_CLIENT_SECRET` et `TMDB_API_KEY` dans `.env.example`
- [ ] Forcer `process.exit(1)` si connexion BDD échoue au démarrage

### Sécurité

- [ ] Installer et activer Helmet
- [ ] Ajouter rate limiting sur `/auth/login` et `/auth/forgot-password`
- [ ] Ajouter `sameSite: "strict"` sur tous les cookies JWT
- [ ] Ne plus exposer `error.message` dans les réponses JSON des routes admin

### Variables d'environnement à créer dans Render Dashboard

```
PG_URL              → URL PostgreSQL fournie par Render
JWT_SECRET          → openssl rand -hex 64
NODE_ENV            → production
BASE_URL            → https://votre-domaine.com
GOOGLE_CLIENT_ID    → depuis Google Cloud Console
GOOGLE_CLIENT_SECRET → depuis Google Cloud Console
TMDB_API_KEY        → depuis themoviedb.org
SMTP_HOST           →
SMTP_PORT           → 587
SMTP_USER           →
SMTP_PASS           →
SMTP_FROM           → Ciné Délices <no-reply@cinedelices.fr>
CLOUDINARY_CLOUD_NAME →
CLOUDINARY_API_KEY  →
CLOUDINARY_API_SECRET →
```

### Base de données

- [ ] Exécuter `create_db.sql` sur la BDD Render PostgreSQL
- [ ] Exécuter les migrations dans l'ordre sur la BDD Render

### Après déploiement

- [ ] Tester login / register
- [ ] Tester upload d'avatar → vérifier présence sur Cloudinary
- [ ] Tester forgot-password → vérifier réception email
- [ ] Tester Google OAuth
- [ ] Vérifier les logs Render (pas d'erreurs BDD, pas de crash)

---

## Instructions de correction prioritaire : intégration Cloudinary

C'est la correction la plus impactante. Voici les étapes complètes.

### Étape 1 — Installer les packages

```bash
npm install cloudinary multer-storage-cloudinary
```

### Étape 2 — Créer `app/utils/cloudinary-config.js`

```js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### Étape 3 — Remplacer `multer.diskStorage` dans chaque middleware

**Exemple pour `upload-avatar.middleware.js` :**

```js
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../utils/cloudinary-config.js";
import { createFileFilter, MAX_FILE_SIZE } from "../utils/upload-config.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "cinedelices/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  },
});

const uploadAvatar = multer({
  storage,
  fileFilter: createFileFilter(),
  limits: { fileSize: MAX_FILE_SIZE },
});

export default uploadAvatar;
```

Même logique pour :
- `upload.middleware.js` → folder `cinedelices/recipes`
- `upload-banner.middleware.js` → folder `cinedelices/banners`
- `upload-movie.middleware.js` → folder `cinedelices/movies`

### Étape 4 — Adapter les controllers

Après migration vers Cloudinary :
- `req.file.path` → contient l'**URL Cloudinary** (à stocker en BDD directement)
- `req.file.filename` → contient le **public_id** Cloudinary
- Les `unlinkIfExists()` deviennent `cloudinary.uploader.destroy(publicId)`

**Exemple de suppression :**

```js
// Avant (disk local)
unlinkIfExists(user.picture);

// Après (Cloudinary)
if (user.picture) {
  const publicId = user.picture.split("/").slice(-1)[0].split(".")[0];
  await cloudinary.uploader.destroy(`cinedelices/profiles/${publicId}`);
}
```

---

## Synthèse

Le projet est **bien architecturé et sécurisé sur les fondamentaux** : argon2 pour les mots de passe, JWT httpOnly, validators Joi, XSS sanitizer, séparation MVC propre, gestion des rôles cohérente. Il manque cependant deux éléments **indispensables** au déploiement cloud :

1. **Un script `start`** → 5 minutes de correction
2. **Une intégration Cloudinary** → 2-4 heures de travail

Sans ces deux corrections, un déploiement sur Render produira soit un crash immédiat (pas de `start`), soit une application fonctionnelle en apparence mais dont toutes les images disparaissent après le premier redéploiement.
