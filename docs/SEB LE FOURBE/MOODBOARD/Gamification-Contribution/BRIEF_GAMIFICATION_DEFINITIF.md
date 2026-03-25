# BRIEF DÉFINITIF — Système de Gamification Ciné Délices
> Pour Claude Pro (IDE) · Version finale · Tous les éléments validés

---

## 1. PHILOSOPHIE

La gamification de Ciné Délices a **un seul objectif** : encourager les contributions (recettes, avis, films) et la fidélisation. Chaque déblocage récompense l'implication réelle — jamais le temps passé ou les actions artificielles.

**Principe fondamental :**
- Déblocage automatique au franchissement de niveau
- Équipement volontaire (l'utilisateur choisit)
- Équiper un cadre n'octroie **aucun XP** — c'est purement cosmétique

---

## 2. TABLE DE PROGRESSION COMPLÈTE

### Table XP — Source de vérité unique (`utils/xp.js`)
```javascript
const XP_TABLE = [
  0,      // niv. 1
  100,    // niv. 2
  300,    // niv. 3
  600,    // niv. 4
  1100,   // niv. 5
  1800,   // niv. 6
  2800,   // niv. 7
  4200,   // niv. 8
  6000,   // niv. 9
  8500,   // niv. 10
  11500,  // niv. 11
  15000,  // niv. 12
  20000,  // niv. 13
  26000,  // niv. 14
  33000,  // niv. 15
  41000,  // niv. 16
  50000,  // niv. 17
  60000,  // niv. 18
  72000,  // niv. 19
];
```

### Progression complète

| Niv. | XP requis | Cadre débloqué | Thème | Autre déblocage | Titre de rang |
|------|-----------|----------------|-------|-----------------|---------------|
| 1 | 0 | 🎬 Ciné Délices | Cinéma | 🎁 Inscription | Spectateur Curieux |
| 2 | 100 | 🔍 Sherlock Holmes | Policier · Enquête | — | Cinéphile Amateur |
| 3 | 300 | — | — | — | Fin Palais |
| 4 | 600 | 💊 Matrix | Science-Fiction | — | Analyste du Goût |
| 5 | 1 100 | — | — | 📄 Page Auteur + bannière perso | Connaisseur |
| 6 | 1 800 | 🎩 Indiana Jones | Aventure | — | Explorateur Cuisinier |
| 7 | 2 800 | — | — | — | Détective des Saveurs |
| 8 | 4 200 | ✨ Harry Potter | Magie | 🏆 TOP Contributeurs + 🗳️ Droit de vote | Critique Éclairé |
| 9 | 6 000 | *(à définir)* | — | — | Maître Cinéaste |
| 10 | 8 500 | *(à définir)* | — | — | Grand Gastronome |
| 11 | 11 500 | *(à définir)* | — | — | Virtuose Cinéphile |
| 12 | 15 000 | *(à définir)* | — | — | Légende de Ciné Délices |
| 13 | 20 000 | *(à définir)* | — | — | Ambassadeur |
| 14 | 26 000 | *(à définir)* | — | — | Visionnaire |
| 15 | 33 000 | *(à définir)* | — | — | Architecte des Saveurs |
| 16 | 41 000 | *(à définir)* | — | — | Maître des Écrans |
| 17 | 50 000 | *(vote communautaire)* | — | — | Gardien du Temple |
| 18 | 60 000 | *(vote communautaire)* | — | — | Élu de Ciné Délices |
| 19 | 72 000 | *(vote communautaire)* | — | — | Mythe Vivant |

> **Niveaux 9-16** : niveaux réservés, cadres à définir au fur et à mesure. Rien à implémenter maintenant.
> **Niveaux 17-19** : réservés aux cadres issus des votes communautaires.
> **Niveaux 3, 7** : pas de cadre — paliers de progression pure.

---

## 3. BARÈME XP DES ACTIONS

```javascript
// services/xpService.js — XP_ACTIONS
const XP_ACTIONS = {
  recipe_published  : 50,   // Recette publiée
  recipe_approved   : 30,   // Recette approuvée par la modération
  movie_accepted    : 25,   // Film proposé et accepté
  review_approved   : 10,   // Avis approuvé
  comment_posted    : 5,    // Commentaire posté
  like_received     : 2,    // Like reçu sur une recette
  daily_login       : 3,    // Connexion quotidienne
  streak_7_days     : 15,   // 7 jours de connexion consécutifs
  first_recipe_month: 20,   // Première recette du mois
};
```

---

## 4. DÉBLOCAGES SPÉCIAUX

### 4a. Page Auteur (niv. 5)
Page publique de l'auteur listant toutes ses recettes.
```javascript
// Dans xpService.awardXP(), après calcul du nouveau niveau :
if (prevLevel < 5 && newLevel >= 5) {
  await user.update({ author_page_unlocked: true });
}
```

### 4b. Bannière personnalisée (niv. 5 — même palier que page auteur)
L'utilisateur peut uploader sa propre bannière sur sa page auteur.
```javascript
// Route upload — vérifie le niveau avant d'accepter
if (req.user.level < 5) {
  return res.status(403).json({ error: 'Niveau 5 requis pour personnaliser la bannière' });
}
// Stocker dans : uploads/banners/<userId>.<ext>
// Sauvegarder le chemin dans users.banner_url
```

### 4c. TOP Contributeurs (niv. 8)
Classement public des meilleurs membres. Visible uniquement pour les niv. 8+.

**Formule de score :**
```javascript
function computeContributorScore(user) {
  return (
    user.totalXP       * 0.50 +   // 50% — régularité
    user.recipesCount  * 0.30 +   // 30% — contribution recettes (pondéré ×100 pour équilibrer)
    user.avgRating     * 0.20     // 20% — qualité (note moyenne sur 5, pondéré ×1000)
  );
}
// En pratique, normaliser les valeurs avant de combiner
```

**Affichage :**
- Top 10 visible par tous les niv. 8+
- En dehors du top 10 : l'utilisateur voit son propre rang ("Tu es #47")
- Chaque entrée : rang + pseudo + badge actif + score + nb de recettes

### 4d. Droit de vote (niv. 8)
Accès au système de vote pour le prochain cadre communautaire.

---

## 5. SYSTÈME DE VOTE COMMUNAUTAIRE

### Fonctionnement
- **Qui vote** : membres niv. 8+ uniquement
- **Fréquence** : un vote tous les 2-3 mois, synchronisé avec la sortie d'un cadre
- **Candidats** : 3 options maximum, choisies par l'administrateur
- **Durée** : 14 jours
- **Résultat** : le cadre gagnant est développé et annoncé avec mention "choisi par la communauté"
- **Droit de veto** : l'administrateur peut passer au 2e si le gagnant est trop complexe

### Candidats en réserve (à proposer aux votes futurs)
```
Le Bon, la Brute et le Truand  (Western)
Silence des Agneaux            (Thriller psychologique)
Star Wars                      (Épopée spatiale)
```

---

## 6. STRUCTURE BASE DE DONNÉES

### Tables existantes (à vérifier)
```sql
-- Probablement déjà présentes selon l'audit
user_points           (userId, totalXp, currentStreak)
signature_badges      (id, name, engine_id, theme, unlock_level)
user_signature_badges (id, userId, signatureBadgeId, isActive, unlocked_at)
```

### Colonnes à ajouter sur `users`
```sql
ALTER TABLE users ADD COLUMN author_page_unlocked BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN banner_url VARCHAR(255) DEFAULT NULL;
```

### Nouvelles tables — Vote communautaire
```sql
CREATE TABLE frame_polls (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  title        VARCHAR(200) NOT NULL,
  candidates   JSON NOT NULL,        -- ['starwars','western','silence']
  closes_at    DATETIME NOT NULL,
  winner_id    VARCHAR(50),          -- rempli après clôture
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE frame_votes (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  poll_id       INT NOT NULL,
  user_id       INT NOT NULL,
  candidate_id  VARCHAR(50) NOT NULL,
  voted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (poll_id, user_id),  -- 1 vote par user par poll
  FOREIGN KEY (poll_id) REFERENCES frame_polls(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Données initiales — `signature_badges`
```sql
-- ✅ LANCEMENT — 5 cadres uniquement
-- Ne pas insérer les cadres futurs maintenant.
-- Ils seront ajoutés un par un via la checklist §10
-- au moment de leur création.
INSERT INTO signature_badges (name, engine_id, theme, unlock_level) VALUES
  ('Ciné Délices',   'cine',    'Cinéma',          0),
  ('Sherlock Holmes','sherlock', 'Policier',        2),
  ('Matrix',         'matrix',  'Science-Fiction', 4),
  ('Indiana Jones',  'indiana', 'Aventure',        6),
  ('Harry Potter',   'harry',   'Magie',           8);
```

---

## 7. SERVICES BACKEND

### `utils/xp.js`
```javascript
const XP_TABLE = [0,100,300,600,1100,1800,2800,4200,6000,8500,
                  11500,15000,20000,26000,33000,41000,50000,60000,72000];

const RANK_TITLES = {
  1:'Spectateur Curieux',    2:'Cinéphile Amateur',    3:'Fin Palais',
  4:'Analyste du Goût',      5:'Connaisseur',          6:'Explorateur Cuisinier',
  7:'Détective des Saveurs', 8:'Critique Éclairé',     9:'Maître Cinéaste',
  10:'Grand Gastronome',     11:'Virtuose Cinéphile',  12:'Légende de Ciné Délices',
  13:'Ambassadeur',          14:'Visionnaire',         15:'Architecte des Saveurs',
  16:'Maître des Écrans',    17:'Gardien du Temple',   18:'Élu de Ciné Délices',
  19:'Mythe Vivant',
};

function computeLevel(xp) {
  let level = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (xp >= XP_TABLE[i]) level = i + 1;
    else break;
  }
  return level;
}

function xpProgress(xp, level) {
  const start = XP_TABLE[level - 1] ?? 0;
  const end   = XP_TABLE[level]     ?? XP_TABLE[XP_TABLE.length - 1];
  return {
    current : xp - start,
    needed  : end - xp,
    span    : end - start,
    pct     : Math.round(((xp - start) / (end - start)) * 100),
  };
}

module.exports = { XP_TABLE, RANK_TITLES, computeLevel, xpProgress };
```

### `services/xpService.js`
```javascript
const { Op }  = require('sequelize');
const { UserPoints, SignatureBadge, UserSignatureBadge, User } = require('../models');
const { computeLevel, XP_ACTIONS } = require('../utils/xp');

const XP_ACTIONS = {
  recipe_published: 50, recipe_approved: 30, movie_accepted: 25,
  review_approved: 10,  comment_posted: 5,   like_received: 2,
  daily_login: 3,       streak_7_days: 15,   first_recipe_month: 20,
};

async function awardXP(userId, action) {
  const amount = XP_ACTIONS[action];
  if (!amount) throw new Error(`Action XP inconnue : ${action}`);

  const [points] = await UserPoints.findOrCreate({
    where: { userId },
    defaults: { totalXp: 0, currentStreak: 0 },
  });

  const prevLevel = computeLevel(points.totalXp);
  const newXP     = points.totalXp + amount;
  const newLevel  = computeLevel(newXP);
  await points.update({ totalXp: newXP });

  const unlockedFrames = [];
  if (newLevel > prevLevel) {
    // Débloquer les cadres entre les deux niveaux
    const frames = await SignatureBadge.findAll({
      where: { unlockLevel: { [Op.between]: [prevLevel + 1, newLevel] } },
    });
    for (const frame of frames) {
      const [, created] = await UserSignatureBadge.findOrCreate({
        where: { userId, signatureBadgeId: frame.id },
        defaults: { isActive: false },
      });
      if (created) unlockedFrames.push(frame);
    }

    // Débloquer page auteur + bannière au niv. 5
    if (prevLevel < 5 && newLevel >= 5) {
      await User.update({ author_page_unlocked: true }, { where: { id: userId } });
    }
  }

  return { newXP, newLevel, levelUp: newLevel > prevLevel, unlockedFrames };
}

// Cadre Ciné Délices offert à l'inscription
async function grantInscriptionFrame(userId) {
  const badge = await SignatureBadge.findOne({ where: { engineId: 'cine' } });
  if (!badge) return;
  await UserSignatureBadge.findOrCreate({
    where: { userId, signatureBadgeId: badge.id },
    defaults: { isActive: true },
  });
}

// Équiper un cadre — sans XP
async function equipFrame(userId, engineId) {
  const badge = await SignatureBadge.findOne({ where: { engineId } });
  if (!badge) throw new Error(`Cadre introuvable : ${engineId}`);

  const userBadge = await UserSignatureBadge.findOne({
    where: { userId, signatureBadgeId: badge.id },
  });
  if (!userBadge) throw new Error('Cadre non débloqué');

  await UserSignatureBadge.update({ isActive: false }, { where: { userId } });
  await userBadge.update({ isActive: true });
  return badge;
}

module.exports = { awardXP, equipFrame, grantInscriptionFrame, XP_ACTIONS };
```

---

## 8. ROUTES API

```javascript
// PATCH /api/user/equip-frame
router.patch('/user/equip-frame', requireAuth, async (req, res) => {
  try {
    const frame = await equipFrame(req.user.id, req.body.frameId);
    res.json({ success: true, frame });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/user/upload-banner (niv. 5+)
router.post('/user/upload-banner', requireAuth, upload.single('banner'), async (req, res) => {
  if (req.user.level < 5) return res.status(403).json({ error: 'Niveau 5 requis' });
  await User.update({ banner_url: req.file.path }, { where: { id: req.user.id } });
  res.json({ success: true, banner_url: req.file.path });
});

// GET /api/top-contributors (niv. 8+, visible par tous)
router.get('/top-contributors', async (req, res) => {
  // Requête à construire avec le score combiné XP×0.5 + recettes×0.3 + note×0.2
});

// POST /api/polls/:pollId/vote (niv. 8+)
router.post('/polls/:pollId/vote', requireAuth, async (req, res) => {
  if (req.user.level < 8) return res.status(403).json({ error: 'Niveau 8 requis' });
  // Insérer dans frame_votes avec UNIQUE KEY pour bloquer le double vote
});
```

---

## 9. STRUCTURE DES FICHIERS CADRES

```
app/public/images/cadres-gamification/
│
├── badge-engine.js                     ← moteur central unique
│
├── Ciné Délices/
│   ├── img/                            ← assets PNG
│   └── badge-cine-delices.js
│
├── Sherlock Holmes/
│   ├── img/
│   │   ├── frame-sherlock-4.png
│   │   ├── empreinte-mirror-sherlock-3.png
│   │   ├── empreinte-sherlock-3.png
│   │   ├── letters-sherlock-3.png
│   │   └── message-sherlock-3.png
│   └── badge-sherlock.js
│
├── Matrix/
│   ├── img/
│   │   └── matrix-frame-260x260.png
│   └── badge-matrix.js
│
├── Indiana Jones/
│   ├── img/
│   │   └── indiana-jones-frame-260x260.png
│   └── badge-indiana-jones.js
│
└── Harry Potter/
    ├── img/
    │   └── harry_potter_frame_260x260.png
    └── badge-harry-potter.js
```

**Tailles d'affichage par contexte :**

| Contexte | Taille CSS | Animé |
|----------|-----------|-------|
| Hero Mon Compte | 160 × 160 px | ✅ |
| Hero Page Auteur | 200 × 200 px | ✅ |
| Tableau des cadres | 80 × 80 px | ✅ |
| Badge sur carte recette | 52 × 52 px | ❌ PNG seul |
| Icône navigation | 42 × 42 px | ❌ PNG seul |

> Règle : **en dessous de 80px = statique (PNG seul)**. Canvas animations à partir de 80px.

---

## 10. AJOUTER UN NOUVEAU CADRE — CHECKLIST

Quand tu décides d'ajouter un cadre (ex: Ratatouille au niv. 9), donne simplement à Claude Pro :
- Le nom du film
- Le niveau de déblocage
- Le thème

Claude Pro suit cette checklist — **15 minutes maximum** :

- [ ] Créer `app/public/images/cadres-gamification/<NomFilm>/img/`
- [ ] Y déposer le PNG du cadre et les assets
- [ ] Créer `badge-<engineId>.js` dans ce dossier
- [ ] Remplacer toutes les URLs `postimg.cc` par les chemins locaux dans le JS
- [ ] Ajouter **une seule ligne SQL** :
  ```sql
  INSERT INTO signature_badges (name, engine_id, theme, unlock_level)
  VALUES ('<NomFilm>', '<engineId>', '<Thème>', <niveau>);
  ```
- [ ] Mettre à jour `RANK_TITLES` dans `utils/xp.js` si un nouveau rang est prévu
- [ ] **Aucune modification** de `xpService.js` ni du contrôleur — le système détecte automatiquement

> Le système est conçu pour que l'ajout d'un cadre ne nécessite **jamais** de ré-expliquer la logique métier.

---

## 11. ORDRE D'IMPLÉMENTATION RECOMMANDÉ

1. `utils/xp.js` — source de vérité XP
2. Migrations SQL (colonnes `users` + nouvelles tables)
3. Données initiales `signature_badges` (13 cadres)
4. `services/xpService.js`
5. Corriger les slugs dans favoris/créations (5 min)
6. Brancher `auth.controller.js` avec les données gamification
7. Routes API (equip-frame, upload-banner)
8. Intégrer les fichiers JS des cadres + `badge-engine.js`
9. Templates EJS (contributions tab, hero profil, hero auteur)
10. TOP Contributeurs (route + affichage)
11. Système de vote (tables + routes + UI)
