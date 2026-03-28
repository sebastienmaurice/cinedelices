# Système de Gamification — Ciné Délices

> **Version :** 3.0
> **Fichiers concernés :** `xpService.js`, `UserPoints.model.js`, `xp.js`, `user-profile.ejs`

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Système XP et niveaux](#2-système-xp-et-niveaux)
3. [Cadres de profil](#3-cadres-de-profil)
4. [Base de données](#4-base-de-données)
5. [Fichiers clés](#5-fichiers-clés)
6. [Ajouter un nouveau cadre](#6-ajouter-un-nouveau-cadre)
7. [Étendre les niveaux](#7-étendre-les-niveaux)

---

## 1. Vue d'ensemble

La gamification récompense les utilisateurs pour leurs contributions au site :

| Action | XP gagnés |
|--------|-----------|
| Recette publiée et approuvée | +50 XP |
| Film soumis et accepté | +25 XP |
| Avis (notice) approuvé | +10 XP |

Le calcul des XP est **dynamique et idempotent** : il est recalculé depuis les données existantes à chaque visite du profil. Aucun risque de dérive ou de double comptage.

---

## 2. Système XP et niveaux

### Paliers XP (`app/utils/xp.js` — `XP_TABLE`)

| Niveau | XP requis | Titre |
|--------|-----------|-------|
| 1 | 0 | Spectateur Curieux |
| 2 | 100 | Cinéphile Amateur |
| 3 | 300 | Critique en Herbe |
| 4 | 600 | Gastronome Éclairé |
| 5 | 1 100 | Connaisseur du 7e Art |
| 6 | 1 800 | Chroniqueur Passionné |
| 7 | 2 800 | Expert Culinaire |
| 8 | 4 200 | Maître des Saveurs |
| 9 | 6 000 | Ambassadeur Cinéphile |
| 10 | 8 500 | Légende du Ciné-Délices |
| 11 | 11 500 | — |
| 12 | 15 000 | — |
| 13 | 20 000 | — |
| 14 | 26 000 | — |
| 15 | 33 000 | — |
| 16 | 41 000 | — |
| 17 | 50 000 | — |
| 18 | 60 000 | — |
| 19 | 72 000 | — |

> Les niveaux 11–19 n'ont pas encore de titre ni de cadre associé — voir [§7 Étendre les niveaux](#7-étendre-les-niveaux).

### Fonctions utilitaires (`app/utils/xp.js`)

```js
computeLevel(xp)          // retourne le niveau (1–19) depuis un total XP
xpProgress(xp, level)     // retourne { current, needed, percent } pour la barre de progression
```

---

## 3. Cadres de profil

Les cadres sont des overlays visuels affichés autour de la photo de profil. Ils se débloquent automatiquement lorsque l'utilisateur atteint le niveau minimum requis.

### Cadres disponibles

| Code | Label | Niveau min | Animation canvas |
|------|-------|-----------|-----------------|
| `cine` | Ciné Délices | 1 | Non (défaut, toujours disponible) |
| `sherlock` | Sherlock Holmes | 2 | Oui (brouillard) |
| `matrix` | Matrix | 4 | Oui (pluie de code) |
| `indiana` | Indiana Jones | 6 | Oui (flammes) |
| `harry` | Harry Potter | 8 | Oui (sorts magiques) |

### Logique de déverrouillage

Le déverrouillage est **passif et automatique** — aucune action utilisateur requise. À chaque chargement du profil, `xpService.js` calcule quels cadres sont accessibles :

```js
const unlockedFrames = FRAME_UNLOCKS.filter(f => userLevel >= f.minLvl);
```

L'utilisateur peut ensuite **équiper** un cadre débloqué via le bouton "Équiper" dans l'onglet `#contributions`. Le cadre actif est stocké en base (`active_frame_code` dans `user_points`).

### Assets requis par cadre

Chaque cadre doit avoir :

```
app/public/images/cadres-gamification/
└── [NomDuFilm]/
    └── img/
        └── cadre-[code]-260x260.png   ← overlay PNG transparent 260×260px
```

Si le cadre a une animation canvas (`hasAnim: true`), un fichier HTML de référence peut exister dans :

```
docs/cadres-gamification/[NomDuFilm].html
```

---

## 4. Base de données

### Table `user_points`

| Colonne | Type | Description |
|---------|------|-------------|
| `id_user` | INTEGER | FK vers `users.id` |
| `points` | INTEGER | Total XP calculé |
| `level_code` | VARCHAR(20) | Slug du niveau actuel (ex: `maitre`) |
| `active_frame_code` | VARCHAR(20) | Code du cadre équipé (ex: `matrix`) |
| `last_weekly_login_at` | DATE | Dernière connexion hebdomadaire |

> La colonne `active_frame_code` est ajoutée par la migration `app/data/migration_add_gamif_columns.sql`.

---

## 5. Fichiers clés

| Fichier | Rôle |
|---------|------|
| `app/utils/xp.js` | Source de vérité : `XP_TABLE`, `RANK_TITLES`, `XP_ACTIONS`, `computeLevel()`, `xpProgress()` |
| `app/models/UserPoints.model.js` | Modèle Sequelize pour `user_points` |
| `app/services/xpService.js` | Calcul XP, liste des cadres, activity feed — fonctions `syncUserXP()` et `getUserGamificationData()` |
| `app/controllers/auth.controller.js` | Appel `getUserGamificationData()` dans `profil()`, passage des variables au template |
| `app/views/user-profile.ejs` | Onglet `#contributions` : affichage XP, cadres, activity feed. Tableau `_allFrames` à maintenir en sync avec `FRAME_UNLOCKS` |
| `app/routes/gamification.route.js` | Route `POST /auth/equip-frame` |
| `app/public/js/contributions.js` | Client-side : animation barres XP, filtres activité, clic "Équiper" |
| `app/public/js/badge-engine.js` | Moteur canvas générique pour les animations de cadres |
| `app/data/migration_add_gamif_columns.sql` | Migration SQL à exécuter une fois en production |

---

## 6. Ajouter un nouveau cadre

Exemple : ajouter un cadre **"Interstellar"** qui se déverrouille au niveau 10.

### Étape 1 — Préparer l'asset PNG

Créer un overlay PNG transparent **260×260px** :

```
app/public/images/cadres-gamification/Interstellar/img/cadre-interstellar-260x260.png
```

Le PNG doit avoir le fond transparent — seul le cadre/bordure est dessiné. La photo de profil de l'utilisateur s'affiche en dessous.

### Étape 2 — Déclarer le cadre dans le service XP

Dans `app/services/xpService.js`, ajouter une entrée à `FRAME_UNLOCKS` :

```js
const FRAME_UNLOCKS = [
  { code:'cine',         label:'Ciné Délices',   minLvl:1,  pngUrl:'/images/cadres-gamification/Ciné Délices/img/cadre-cine-delices-2.png',        hasAnim:false },
  { code:'sherlock',     label:'Sherlock Holmes', minLvl:2,  pngUrl:'/images/cadres-gamification/Sherlock Holmes/img/cadre-sherlock-holmes-1440.png', hasAnim:true  },
  { code:'matrix',       label:'Matrix',          minLvl:4,  pngUrl:'/images/cadres-gamification/Matrix/img/cadre-matrix-260x260.png',               hasAnim:true  },
  { code:'indiana',      label:'Indiana Jones',   minLvl:6,  pngUrl:'/images/cadres-gamification/Indiana Jones/img/cadre-indiana-jones-260x260.png',  hasAnim:true  },
  { code:'harry',        label:'Harry Potter',    minLvl:8,  pngUrl:'/images/cadres-gamification/Harry Potter/img/cadre-harry-potter-260x260.png',    hasAnim:true  },
  // ✦ Nouveau cadre :
  { code:'interstellar', label:'Interstellar',    minLvl:10, pngUrl:'/images/cadres-gamification/Interstellar/img/cadre-interstellar-260x260.png',   hasAnim:false },
];
```

### Étape 3 — Déclarer le cadre dans le template EJS

Dans `app/views/user-profile.ejs`, ajouter une entrée à `_allFrames` (section script de l'onglet contributions) :

```js
const _allFrames = [
  { id:'cine',         label:'Ciné Délices',   theme:'Cinéma',         icon:'🎬', minLvl:1,  bg:'rgba(196,160,82,.18)', border:'rgba(196,160,82,.5)',  hasRealFrame:false },
  { id:'sherlock',     label:'Sherlock Holmes', theme:'Policier',        icon:'🔍', minLvl:2,  bg:'rgba(160,120,55,.22)', border:'rgba(188,148,78,.45)', hasRealFrame:true  },
  { id:'matrix',       label:'Matrix',          theme:'Science-Fiction', icon:'🟢', minLvl:4,  bg:'rgba(0,190,75,.18)',   border:'rgba(0,205,80,.4)',    hasRealFrame:true  },
  { id:'indiana',      label:'Indiana Jones',   theme:'Aventure',        icon:'🎩', minLvl:6,  bg:'rgba(180,100,20,.22)', border:'rgba(190,135,55,.5)',  hasRealFrame:true  },
  { id:'harry',        label:'Harry Potter',    theme:'Magie',           icon:'⚡', minLvl:8,  bg:'rgba(80,130,255,.22)', border:'rgba(130,185,255,.5)', hasRealFrame:true  },
  // ✦ Nouveau cadre :
  { id:'interstellar', label:'Interstellar',    theme:'Science-Fiction', icon:'🌌', minLvl:10, bg:'rgba(20,30,80,.28)',   border:'rgba(80,120,255,.45)', hasRealFrame:true  },
];
```

### Étape 4 (optionnel) — Animation canvas

Si le cadre doit avoir une animation canvas (`hasAnim: true`), ajouter un cas dans `app/public/js/badge-engine.js` :

```js
case 'interstellar':
  this._initInterstellar(); // implémenter l'animation
  break;
```

### Récapitulatif

```
✅ Asset PNG 260×260 transparent
✅ Une ligne dans FRAME_UNLOCKS  (xpService.js)
✅ Une ligne dans _allFrames     (user-profile.ejs)
⬜ Animation canvas              (badge-engine.js) — optionnel
```

Aucune migration SQL, aucun changement de logique. Le déverrouillage est automatique.

---

## 7. Étendre les niveaux

Le système supporte jusqu'au **niveau 19** nativement. Pour aller au-delà ou ajouter des titres aux niveaux 11–19 :

### Ajouter des titres de rang (`app/utils/xp.js`)

```js
export const RANK_TITLES = {
  1:  'Spectateur Curieux',
  2:  'Cinéphile Amateur',
  3:  'Critique en Herbe',
  4:  'Gastronome Éclairé',
  5:  'Connaisseur du 7e Art',
  6:  'Chroniqueur Passionné',
  7:  'Expert Culinaire',
  8:  'Maître des Saveurs',
  9:  'Ambassadeur Cinéphile',
  10: 'Légende du Ciné-Délices',
  // Compléter à partir d'ici :
  11: '...',
};
```

### Ajouter des paliers XP au-delà du niveau 19

Dans `XP_TABLE`, chaque valeur est le seuil cumulé pour atteindre ce niveau. Il suffit d'appender des valeurs :

```js
export const XP_TABLE = [
  0, 100, 300, 600, 1100, 1800, 2800, 4200, 6000, 8500,
  11500, 15000, 20000, 26000, 33000, 41000, 50000, 60000, 72000,
  // Niveau 20 → 21 → ...
  86000, 102000,
];
```

`computeLevel()` s'adapte automatiquement à la longueur du tableau — aucune autre modification requise.
