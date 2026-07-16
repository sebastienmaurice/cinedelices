# Système de Gamification — Ciné Délices

> **Version :** 4.0 — Mise à jour 2026-05-15
> **Fichiers concernés :** `gamification.utils.js`, `gamification.service.js`, `UserPoints.model.js`, `user-profile.ejs`

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Actions XP](#2-actions-xp)
3. [Niveaux et titres de rang](#3-niveaux-et-titres-de-rang)
4. [Cadres de profil](#4-cadres-de-profil)
5. [Base de données](#5-base-de-données)
6. [Fichiers clés](#6-fichiers-clés)
7. [Ajouter un nouveau cadre](#7-ajouter-un-nouveau-cadre)
8. [Étendre les niveaux](#8-étendre-les-niveaux)
9. [Dashboard admin — Gamification](#9-dashboard-admin--gamification)

---

## 1. Vue d'ensemble

La gamification récompense les membres pour leurs contributions. Le système repose sur deux mécanismes complémentaires :

- **`syncUserXP`** — recalcul dynamique depuis le contenu approuvé (idempotent, appelé à chaque visite du profil). Garantit que les points ne dérivent jamais en dessous du contenu réel.
- **`awardActionXP`** — points bonus cumulatifs pour des actions ponctuelles (connexion, favoris, notes…). S'ajoutent au-dessus du contenu XP.

Le niveau est calculé automatiquement depuis le total de points via `computeLevel()`. Aucun recalcul manuel nécessaire.

---

## 2. Actions XP

### Tableau complet (`app/utils/gamification.utils.js` — `XP_ACTIONS`)

| Code action | Points | Déclencheur |
|---|---|---|
| `recipe_published` | +50 | Recette approuvée (via `syncUserXP`, calculé depuis le contenu) |
| `recipe_approved` | +30 | Bonus immédiat quand l'admin valide une recette |
| `movie_accepted` | +25 | Bonus immédiat quand l'admin valide un film |
| `review_approved` | +10 | Bonus immédiat quand l'admin valide un avis |
| `comment_posted` | +5 | Réservé — non encore déclenché |
| `favorite_added` | +1 | Membre ajoute un favori |
| `rating_given` | +2 | Membre donne une note (première fois seulement) |
| `like_received` | +2 | Réservé — non encore déclenché |
| `daily_login` | +3 | Connexion hebdomadaire (une fois par semaine max) |
| `streak_7_days` | +15 | Réservé — non encore déclenché |
| `first_recipe_month` | +20 | Réservé — non encore déclenché |

### Où sont déclenchés les XP

| Fichier | Action déclenchée |
|---|---|
| `admin.controllers.js` → `validateRecipe` | `recipe_approved` (+30) pour le contributeur |
| `admin.controllers.js` → `validateNotice` | `review_approved` (+10) pour le contributeur |
| `admin.controllers.js` → `validateMovie` | `movie_accepted` (+25) pour le contributeur |
| `favorites.controllers.js` | `favorite_added` (+1) pour le membre |
| `ratings.controllers.js` | `rating_given` (+2) à la création uniquement |
| `auth.controller.js` → `login` | `daily_login` (+3) via `awardWeeklyLoginXP` |

> **Note :** `syncUserXP` est appelé automatiquement à chaque visite du profil et recalcule le minimum XP garanti depuis le contenu approuvé. Le total final est toujours `Math.max(points_db, content_xp)`.

---

## 3. Niveaux et titres de rang

### Paliers XP (`app/utils/gamification.utils.js` — `XP_TABLE`)

| Niveau | XP requis | Titre (`RANK_TITLES`) |
|---|---|---|
| 1 | 0 | Spectateur Curieux |
| 2 | 100 | Cinéphile Amateur |
| 3 | 300 | Fin Palais |
| 4 | 600 | Analyste du Goût |
| 5 | 1 100 | Connaisseur |
| 6 | 1 800 | Explorateur Cuisinier |
| 7 | 2 800 | Détective des Saveurs |
| 8 | 4 200 | Critique Éclairé |
| 9 | 6 000 | Maître Cinéaste |
| 10 | 8 500 | Grand Gastronome |
| 11 | 11 500 | Virtuose Cinéphile |
| 12 | 15 000 | Légende de Ciné Délices |
| 13 | 20 000 | Ambassadeur |
| 14 | 26 000 | Visionnaire |
| 15 | 33 000 | Architecte des Saveurs |
| 16 | 41 000 | Maître des Écrans |
| 17 | 50 000 | Gardien du Temple |
| 18 | 60 000 | Élu de Ciné Délices |
| 19 | 72 000 | Mythe Vivant |

> ⚠️ Les titres de rang sont la **source de vérité** dans `RANK_TITLES` (gamification.utils.js). L'EJS (user-profile.ejs) utilise le même tableau dans les deux sections hero et contributions — toute modification doit se faire dans `gamification.utils.js` uniquement.

### Temps estimé pour atteindre les cadres (membre actif)

Un membre actif (1 recette/mois + connexions régulières + quelques favoris) gagne environ **150–200 pts/mois**.

| Cadre | Niveau | Estimation |
|---|---|---|
| Sherlock Holmes | 2 | ~2 semaines ✅ |
| Matrix | 4 | ~3 mois |
| Indiana Jones | 5 | ~5 mois |
| Harry Potter | 7 | ~10 mois |

---

## 4. Cadres de profil

Les cadres sont des overlays PNG affichés autour de la photo de profil. Ils se débloquent automatiquement quand le membre atteint le niveau requis. Le membre peut ensuite les équiper depuis l'onglet **Contributions** de son profil.

### Cadres disponibles

| Code | Label | Niveau min | Animation |
|---|---|---|---|
| `none` | Sans cadre | 1 | Non |
| `cine` | Ciné Délices | 1 | Non |
| `sherlock` | Sherlock Holmes | 2 | Oui |
| `matrix` | Matrix | 4 | Oui |
| `indiana` | Indiana Jones | **5** | Oui |
| `harry` | Harry Potter | **7** | Oui |

### Logique de déverrouillage

```js
// Dans gamification.service.js
const unlockedFrames = FRAME_UNLOCKS.filter(f => userLevel >= f.minLvl);
```

Le cadre actif est stocké dans `user_points.active_frame_code`. L'équipement se fait via `POST /auth/equip-frame`.

### Tooltip sur les cadres verrouillés

Chaque cadre verrouillé affiche au hover un tooltip avec :
- Niveau requis
- XP manquants (calculé depuis `XP_TABLE[fr.minLvl - 1] - xp_actuel`)
- Équivalent concret : *≈ X recettes validées* ou *≈ Y avis approuvés*

### Assets requis par cadre

```
app/public/images/cadres-gamification/
└── [NomDuFilm]/
    └── img/
        └── cadre-[code]-260x260.png   ← overlay PNG transparent 260×260px
```

---

## 5. Base de données

### Table `user_points`

| Colonne | Type | Description |
|---|---|---|
| `id` | INTEGER | PK |
| `id_user` | INTEGER | FK vers `users.id` |
| `points` | INTEGER | Total de points accumulés |
| `level_code` | VARCHAR | Niveau actuel en string (`"1"`, `"2"`, etc.) |
| `active_frame_code` | VARCHAR | Code du cadre équipé (`"sherlock"`, `"matrix"`…) |
| `last_weekly_login_at` | TIMESTAMP | Date de la dernière attribution XP de connexion |
| `updated_at` | TIMESTAMP | Dernière mise à jour |

> `level_code` est stocké comme string numérique (`"2"` pas `"niveau_2"`). Il est recalculé et mis à jour automatiquement par `awardActionXP` et `syncUserXP`.

---

## 6. Fichiers clés

| Fichier | Rôle |
|---|---|
| `app/utils/gamification.utils.js` | **Source de vérité** : `XP_TABLE`, `RANK_TITLES`, `XP_ACTIONS`, `FRAME_UNLOCKS`, `computeLevel()`, `xpProgress()` |
| `app/services/gamification.service.js` | Logique métier : `syncUserXP()`, `awardActionXP()`, `awardWeeklyLoginXP()`, `getUserGamificationData()` |
| `app/models/UserPoints.model.js` | Modèle Sequelize pour la table `user_points` |
| `app/controllers/auth.controller.js` | Appel `getUserGamificationData()` dans `profil()` + `awardWeeklyLoginXP()` au login |
| `app/controllers/admin.controllers.js` | `awardActionXP` déclenché lors de la validation de recette/avis/film |
| `app/controllers/favorites.controllers.js` | `awardActionXP("favorite_added")` à l'ajout d'un favori |
| `app/controllers/ratings.controllers.js` | `awardActionXP("rating_given")` à la création d'une note |
| `app/views/user-profile.ejs` | Onglet `#contributions` : XP, cadres, milestone card, tooltip déblocage. Le tableau `_allFrames` doit rester synchronisé avec `FRAME_UNLOCKS` |
| `app/routes/auth.route.js` | Route `POST /auth/equip-frame` |
| `app/public/js/admin-dashboard.js` | Chargement des stats gamification via `loadGamificationStats()` |

---

## 7. Ajouter un nouveau cadre

Exemple : ajouter un cadre **"Interstellar"** au niveau 10.

### Étape 1 — Préparer l'asset PNG

```
app/public/images/cadres-gamification/Interstellar/img/cadre-interstellar-260x260.png
```
PNG transparent 260×260px — seul le cadre/bordure est dessiné, la photo de profil s'affiche en dessous.

### Étape 2 — Déclarer dans `FRAME_UNLOCKS`

Dans `app/utils/gamification.utils.js` :

```js
export const FRAME_UNLOCKS = [
  // ... cadres existants ...
  {
    code:     'interstellar',
    label:    'Interstellar',
    theme:    'Science-Fiction',
    icon:     '🌌',
    minLvl:   10,
    pngUrl:   '/images/cadres-gamification/Interstellar/img/cadre-interstellar-260x260.png',
    thumbUrl: '/images/cadres-gamification/thumbs/thumb-interstellar.jpg',
    hasAnim:  false,
  },
];
```

### Étape 3 — Déclarer dans `_allFrames` (EJS)

Dans `app/views/user-profile.ejs`, section script onglet contributions :

```js
const _allFrames = [
  // ... cadres existants ...
  {
    id: 'interstellar', label: 'Interstellar', theme: 'Science-Fiction',
    icon: '🌌', minLvl: 10,
    bg: 'rgba(20,30,80,.28)', border: 'rgba(80,120,255,.45)',
    hasRealFrame: true,
    pngUrl: '/images/cadres-gamification/Interstellar/img/cadre-interstellar-260x260.png'
  },
];
```

### Étape 4 (optionnel) — Animation canvas

Si `hasAnim: true`, implémenter le cas dans `app/public/js/badge-engine.js` :

```js
case 'interstellar':
  this._initInterstellar();
  break;
```

### Récapitulatif

```
✅ Asset PNG 260×260 transparent
✅ Entrée dans FRAME_UNLOCKS  (gamification.utils.js)
✅ Entrée dans _allFrames     (user-profile.ejs)
⬜ Animation canvas            (badge-engine.js) — optionnel
```

Aucune migration SQL. Le déverrouillage est automatique.

---

## 8. Étendre les niveaux

Le système supporte jusqu'au **niveau 19** nativement. Pour ajouter des niveaux supplémentaires :

### Ajouter des paliers XP

Dans `app/utils/gamification.utils.js` — `XP_TABLE` :

```js
export const XP_TABLE = [
  0, 100, 300, 600, 1100, 1800, 2800, 4200, 6000, 8500,
  11500, 15000, 20000, 26000, 33000, 41000, 50000, 60000, 72000,
  // Niveau 20, 21...
  86000, 102000,
];
```

`computeLevel()` s'adapte automatiquement à la longueur du tableau.

### Ajouter des titres de rang

```js
export const RANK_TITLES = {
  // ... existants ...
  20: 'Titre niveau 20',
};
```

> Mettre à jour également le tableau `_heroRanks` dans `user-profile.ejs` (section hero) pour qu'il reste synchronisé avec `RANK_TITLES`.

---

## 9. Dashboard admin — Gamification

L'onglet **Gamification** du dashboard admin (`/admin` → sidebar) affiche en temps réel :

- **XP total distribué** — somme des points de toute la communauté
- **Membres avec XP** — nombre de lignes dans `user_points`
- **XP moyen / membre**
- **Niveau moyen**
- **Top 15 membres par points** — pseudo, avatar, niveau, points

Les données sont chargées à la demande via `GET /admin/gamification/stats` (contrôleur `getGamificationStats`). Aucun chargement au démarrage — le fetch se déclenche au premier clic sur l'onglet.
