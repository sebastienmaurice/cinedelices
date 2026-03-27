# Checklist avant mise en production — Ciné Délices

> Dernière mise à jour : 2026-03-27
> État du projet : développement actif, audit frontend complet effectué.

---

## 🔴 Bloquant — À faire absolument avant la prod

### Sécurité

- [ ] **CSRF** — Installer `csurf` ou `csrf-csrf` et protéger tous les formulaires POST :
  - `/contact-about/contact`
  - `/recipes-movie/details/:id/avis`
  - `/auth/profil/:id` (mise à jour profil / photo)
  - `/add-recipes-movies/movie-and-recipe`
  - `/auth/equip-frame`

- [ ] **Rate limiting** — Installer `express-rate-limit` et appliquer :
  - `POST /auth/login` — max 10 tentatives / 15 min par IP (anti brute-force)
  - `POST /contact-about/contact` — max 5 messages / heure par IP (anti spam)
  - `POST /auth/register` — max 5 inscriptions / heure par IP

- [ ] **Helmet.js** — Ajouter les headers HTTP de sécurité :
  ```bash
  npm install helmet
  ```
  ```js
  import helmet from 'helmet';
  app.use(helmet());
  ```
  Headers activés : `X-Frame-Options`, `X-Content-Type-Options`, `HSTS`, `Referrer-Policy`, etc.

- [ ] **Variables d'environnement** — Vérifier que `.env` de prod contient :
  - `NODE_ENV=production`
  - `BASE_URL=https://votre-domaine.fr` (remplacer `http://localhost:3000`)
  - `JWT_SECRET` — clé forte générée (`openssl rand -hex 64`), différente du dev
  - `PG_URL` — base de données de production

- [ ] **Cookies JWT** — Vérifier les flags de sécurité sur le cookie de session :
  - `httpOnly: true`
  - `secure: true` (HTTPS uniquement)
  - `sameSite: 'strict'` ou `'lax'`

### Formulaire de contact

- [ ] **Brancher un vrai service d'envoi d'email** — actuellement les messages sont seulement loggés en console (`console.info`).
  Options recommandées :
  - **Resend** (100 emails/jour gratuit, API simple)
  - **Brevo** (300 emails/jour gratuit)
  - **Nodemailer + SMTP Gmail**

---

## 🟡 Important — Fortement recommandé avant la prod

### Configuration & déploiement

- [ ] **`BASE_URL`** dans le `.env` de prod — remplacer `http://localhost:3000` par le vrai domaine (utilisé pour les balises Open Graph et les canonical URLs)

- [ ] **Variables TMDB** — S'assurer que `TMDB_API_KEY` est configurée en prod

- [ ] **Logs** — Remplacer tous les `console.log/info/error` par un vrai logger (`winston`, `pino`) avec rotation des fichiers

- [ ] **Uploads** — Vérifier que les dossiers d'upload (`/public/images/profiles/`, `/public/images/recipes/`) sont persistants sur le serveur de prod (non écrasés lors des déploiements)

### SEO

- [ ] **Images Open Graph dédiées** — Créer une image OG optimisée (1200×630px) pour la home (`/images/og-home.jpg`), actuellement `background-page.jpg` est utilisé en fallback

- [ ] **`sitemap.xml`** — Générer un sitemap dynamique listant les fiches films et recettes approuvées (aide à l'indexation Google)

- [ ] **`robots.txt`** — Vérifier ou créer le fichier pour interdire l'indexation des pages admin, profil, erreur

- [ ] **Vérifier les rich snippets** — Tester le JSON-LD Recipe sur `recipe-detail` avec l'outil [Google Rich Results Test](https://search.google.com/test/rich-results)

### Qualité & UX

- [ ] **Liens réseaux sociaux** — Remplacer les `href="#"` sur LinkedIn/GitHub dans `contact-about.ejs` par les vraies URLs de l'équipe

- [ ] **Page d'erreur** — Tester les routes `/404` et `/500` en prod pour vérifier l'affichage de la nouvelle `error.ejs`

- [ ] **Images `width`/`height`** — Ajouter des attributs `width` et `height` explicites sur les `<img>` principaux pour éviter le Cumulative Layout Shift (CLS)

---

## 🟢 Optionnel — Bonus qualité

### Performance

- [ ] **Pagination** — Vérifier les pages avec de grandes listes (films, recettes) : ajouter une pagination côté serveur si le volume dépasse 100+ éléments

- [ ] **Images WebP** — Convertir les images de fond et bannières en `.webp` pour réduire le poids

- [ ] **Compression** — Activer `compression` middleware Express pour gzip sur les réponses HTML/CSS/JS

### Accessibilité

- [ ] **Audit WCAG 2.1 AA** — Passer Lighthouse ou axe sur les pages principales (home, fiche film, détail recette)
- [ ] **Focus visible** — Vérifier la navigation clavier sur tous les formulaires et modals
- [ ] **Contrastes** — Vérifier les ratios sur les textes `rgba(232,232,232,0.25)` et autres couleurs très atténuées

### Code

- [ ] **Supprimer les `console.log` de debug** restants dans les contrôleurs
- [ ] **`data-films='[]'`** dans `genres-section-v3.ejs` — implémenter les films par genre dans le tooltip du carousel (ou retirer la fonctionnalité)
- [ ] **Champ `prenom`** dans le formulaire contact — le contrôleur ne le récupère pas (`sendContact` ignore `prenom`)

---

## Migrations SQL à ne pas oublier

Les migrations suivantes ont déjà été jouées en dev. S'assurer qu'elles sont appliquées en prod dans cet ordre :

```bash
psql $PG_URL -f app/data/migration_gamification.sql
psql $PG_URL -f app/data/migration_add_gamif_columns.sql
# + toutes les autres migrations dans app/data/
```

---

## Commandes utiles pour la mise en prod

```bash
# Vérifier les dépendances de sécurité
npm audit

# Build / démarrage production
NODE_ENV=production node server.js

# Vérifier les variables d'environnement chargées
node -e "import('dotenv/config').then(() => console.log(process.env.NODE_ENV, process.env.BASE_URL))"
```
