# 🎬 Prompt — Système de Gamification Ciné Délices

## Contexte

Tu travailles sur le projet **Ciné Délices**, une application web Node.js / Express / EJS / PostgreSQL qui associe films et recettes de cuisine.

Le fichier de référence complet du système de gamification est disponible ici :

```
docs/SEB LE FOURBE/MOODBOARD/gamification-cine-delices-v3.md
```

Lis ce fichier **en priorité absolue** avant toute implémentation. Il contient la source de vérité du système.

---

## Ce qu'est le système de gamification

Le système repose sur **3 niveaux distincts** qui coexistent sur le profil utilisateur :

### Système 1 — Niveau Profil (actif dès le lancement)

L'utilisateur accumule des **points** via ses actions sur le site. Ces points déterminent son niveau global.

| Action                      | Points |
| --------------------------- | ------ |
| Créer une recette           | 10 pts |
| Contribuer un film manquant | 5 pts  |
| Poster un avis              | 2 pts  |
| Ajouter un favori           | 1 pt   |
| Connexion hebdomadaire      | 1 pt   |

Les 5 niveaux : **Figurant** (10 pts) → **Second Rôle** (25 pts) → **Acteur** (50 pts) → **Réalisateur** (100 pts) → **Légende** (200 pts)

### Système 2 — Badges Signature (actif dès le lancement)

6 badges liés à des films iconiques. Chaque badge se débloque en **créant 1 recette liée au film**.

| Badge               | Film                          | Thème       |
| ------------------- | ----------------------------- | ----------- |
| 🧙 Doctor Strange   | Doctor Strange                | Fantastique |
| ⚡ Harry Potter     | Harry Potter                  | Fantastique |
| 🎩 Indiana Jones    | Indiana Jones                 | Aventure    |
| 💊 Matrix           | Matrix                        | Sci-Fi      |
| 🔪 Freddy           | Freddy les griffes de la nuit | Horreur     |
| 🕹️ Ready Player One | Ready Player One              | Cyberpunk   |

Les badges non encore débloqués sont visibles en mode **verrouillé** sur le profil.

### Système 3 — Badges Thème (Phase 2 — ne pas implémenter maintenant)

22 thèmes × 6 niveaux = 132 badges. À activer dans 6 à 12 mois. **Ne pas implémenter au lancement.**

---

## Où ces badges apparaissent dans l'application

### 1. Page `/mon-compte` — affichage principal

```
┌──────────────────────────────────────────────────┐
│  [Avatar]  Nom d'utilisateur                      │
│            Niveau : 🎬 ACTEUR   ████░░  50/100 pts│
├──────────────────────────────────────────────────┤
│  Statistiques                                     │
│  [Recettes créées] [Avis postés] [Favoris] [Pts] │
├──────────────────────────────────────────────────┤
│  BADGES SIGNATURE                                 │
│  🧙 ✅  ⚡ ✅  🎩 🔒  💊 🔒  🔪 🔒  🕹️ 🔒        │
├──────────────────────────────────────────────────┤
│  BADGES THÈME            [ 🔜 Bientôt disponible ]│
└──────────────────────────────────────────────────┘
```

### 2. Navigation / Header — indicateur de niveau

- Niveau affiché à côté du pseudo : `Sébastien · 🎬 Acteur`
- Au clic → redirige vers `/mon-compte`

### 3. Page recette — toast de déverrouillage

Quand une recette est créée, vérifier côté serveur si un badge se débloque.

```
🏆 Badge débloqué ! Tu as obtenu "Doctor Strange" 🧙
```

Toast non-bloquant, disparaît après 4 secondes.

### 4. Page d'accueil — widget préfooter

Si connecté : niveau actuel + 6 badges avec état + lien `/mon-compte`.

### 5. Badge Bienvenue — déclenché à l'inscription

Toujours débloqué pour tout utilisateur inscrit. À afficher en premier sur `/mon-compte`.

---

## Règles d'implémentation

### À faire

- Lire `gamification-cine-delices-v3.md` avant toute chose
- Implémenter uniquement les **Systèmes 1 et 2** au lancement
- Vérifier les conditions de déverrouillage **côté serveur uniquement**
- Afficher les badges verrouillés avec état visuel distinct (filtre CSS + icône 🔒)
- Déclencher la vérification après chaque action (création recette, avis, favori, connexion)

### À ne pas faire

- ❌ Ne pas implémenter le Système 3 maintenant
- ❌ Ne pas afficher les points bruts — montrer le niveau uniquement
- ❌ Ne pas vérifier les points côté client
- ❌ Ne pas bloquer l'UX si le système de badges est en erreur (fail silencieux)

### Structure BDD minimale

```sql
ALTER TABLE users ADD COLUMN total_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN level_code VARCHAR(20) DEFAULT 'figurant';

CREATE TABLE signature_badges (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  film VARCHAR(100) NOT NULL,
  theme VARCHAR(50) NOT NULL,
  emoji VARCHAR(10),
  condition_description TEXT
);

CREATE TABLE user_signature_badges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  badge_id INTEGER REFERENCES signature_badges(id),
  unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP,
  UNIQUE(user_id, badge_id)
);
```

---

## Architecture des badges — fichier unique `badges.js`

### Principe fondamental

**Un seul fichier JS** gère tous les badges. Le coût n'est pas proportionnel au nombre de badges — c'est une classe par badge, instanciée à la demande.

```
app/public/badges/
├── badges.css      ← styles communs (conteneur, tailles, états locked)
├── badges.js       ← moteur unique, toutes les classes
└── svg/            ← SVG statiques pour les badges CSS-only
```

### Auto-initialisation dans le HTML EJS

```html
<!-- Dans la vue EJS — un badge -->
<div data-badge="matrix" data-size="md" class="badge-wrap">
  <img src="<%= user.avatar %>" alt="<%= user.username %>" />
</div>

<!-- En bas de page, chargé une seule fois -->
<script src="/badges/badges.js"></script>
```

```javascript
// badges.js — auto-init au chargement de la page
document.querySelectorAll("[data-badge]").forEach((el) => {
  const type = el.dataset.badge; // 'matrix', 'strange', 'harry-potter'...
  BadgeRegistry.create(type, el).init();
});
```

### Performance — IntersectionObserver obligatoire

```javascript
// Dans BadgeBase — pause RAF automatique si badge hors écran
const obs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) this.resume();
    else this.pause();
  });
});
obs.observe(this.el);
```

### Coût réel sur `/mon-compte` avec 6 badges

| Badge            | Moteur     | CPU JS                     |
| ---------------- | ---------- | -------------------------- |
| Doctor Strange   | CSS only   | **0%**                     |
| Harry Potter     | CSS only   | **0%**                     |
| Indiana Jones    | CSS only   | **0%**                     |
| Freddy           | CSS only   | **0%**                     |
| Ready Player One | CSS only   | **0%**                     |
| Matrix           | Canvas RAF | **~3%** (0% si hors écran) |

---

## Visuel des badges — état actuel

### Règles communes à tous les badges

- `.badge` → `border-radius:50%` + `overflow:hidden` — verrou absolu, rien ne déborde
- 3 tailles : `--lg` (380px) / `--md` (260px) / `--sm` (140px)
- Fond intégré dans le site : `#142234` — pas de border externe visible
- Vignette CSS `radial-gradient` qui fond les bords dans le fond de page
- État verrouillé : `filter: saturate(.15) brightness(.75) hue-rotate(180deg)` → bleu acier

### Badge Matrix — architecture canvas

**Fichier de référence :** `docs/SEB LE FOURBE/MOODBOARD/Badge-Matrix-V8.html`

C'est le **seul badge qui utilise du JavaScript** (canvas RAF). Les 5 autres sont CSS only.

**Stack des couches (z-index) :**

```
canvas#c-xx        z:1   ← pluie de code — ctxB (arrière-plan)
div.badge__vignette z:3  ← fondu bords → #142234
div.badge__halo    z:9   ← halo blanc très atténué derrière la photo
div.badge__photo-wrap z:10  ← conteneur photo
  img.badge__photo       ← avatar (top:0; left:0; width:100%; height:100%)
  ::after                ← stries CSS parasites au hover
div.badge__scanlines z:11 ← lignes CRT sur la photo
div.badge__photo-ring z:12 ← anneau vert → rouge au hover
  ::before               ← halo rouge irrégulier + explosion à l'impact
canvas#co-xx       z:15  ← éclair + parasites DEVANT la photo — ctxO
```

**Mode normal (repos) :**

- Pluie `#00ff41` intermittente, lente — colonnes traversent toute la hauteur
- 2 plans : colonnes claires rapides (premier plan) vs sombres lentes (arrière-plan)
- ~20% des colonnes premier plan passent sur `canvas-over` z:15 → devant la photo
- Photo vibre en continu (±8px, 1.6s) + glitch brutal aléatoire toutes 3-8s

**Mode hover :**

- Code vert se corrompt en rouge sang progressivement (vagues sinusoïdales)
- Parasites (stries + blocs) sur la photo + débordement 14px autour — fond NON touché
- Éclair diagonal intermittent (pause 2.5-5s) sur `canvas-over` (z:15) — devant la photo
- **À l'impact de l'éclair :**
  - Flash blanc global 1-2 frames sur tout le badge
  - Parasites × 4 — photo quasi illisible, débordement 28px
  - Photo découpée en 2 moitiés décalées ±7px selon l'angle de l'éclair
  - Classe CSS `badge__photo-ring--impact` → halo rouge explose (`inset:-14px` → `-32px`)
  - Halo rouge irrégulier anime via `skew` + `scale` + `blur` variables

**Classe JS principale :**

```javascript
class MatrixRain {
  constructor(canvasBack, canvasOver, photoEl, opts) { ... }
  setHover(v)          // mouseenter/mouseleave
  _newBolt()           // génère trajectoire éclair aléatoire
  _drawBolt(ht)        // éclair + parasites massifs sur ctxO
  _drawNoise(ht)       // parasites photo sur ctxB (hors éclair, niveau modéré)
  _drawFlash()         // flash blanc global décroissant
  _updateShake()       // vibration continue + glitch intermittent au repos
  _drawColumn(ctx, d)  // dessin d'une colonne de pluie
  _tick()              // boucle RAF principale
}
```

---

### Badges CSS Only

**Doctor Strange** — `Badge-Strange-Ultime-CSS-Only-V8.html`

- Anneaux SVG rotatifs (4 anneaux CW/CCW) + glyphes runiques sur `<textPath>`
- `badge__sparks` (10 sparks) + `badge__smoke` (6 particules)
- `badge__svg-base` (z:5) sous photo + `badge__svg-over` (z:25) dessus
- Repos : `#3fe0a1` vert mystique → Hover : `#fd6b04` orange + accélération anneaux

**Harry Potter** — `Badge-HarryPotter-Patronus-AAA-V4.html`

- Orbe orbital (`.orbital` + `.orb`) avec traînée de fumée Patronus (14 `.tp`)
- Shockwave au hover : orbe frappe l'avatar, onde de choc + flash blanc
- Halo ambiant synchronisé avec la position de l'orbe
- Repos : `#7BD3FF` bleu → Hover : blanc pur + impact lumineux

**Indiana Jones** _(à créer — CSS only)_

- Boussole SVG rotative, grains de sable/poussière en particules CSS
- Tons caramel `#C97B3A`, ambiance sable/aventure

**Freddy** _(à créer — CSS only)_

- Griffes SVG qui déchirent le cercle, pulsations rouges `#cc2020`
- Glitch CSS sur la photo, fumée noire

**Ready Player One** _(à créer — CSS only)_

- HUD hexagonal SVG, néons cyan `#00FFCC`, glitch digital
- Particules pixelisées CSS

---

## Fichiers à consulter dans l'ordre

1. `docs/SEB LE FOURBE/MOODBOARD/gamification-cine-delices-v3.md` — système complet
2. `docs/SEB LE FOURBE/MOODBOARD/Badge-Matrix-V8.html` — référence Matrix (canvas, version finale)
3. `docs/SEB LE FOURBE/MOODBOARD/Badge-Strange-Ultime-CSS-Only-V8.html` — référence Strange (CSS)
4. `docs/SEB LE FOURBE/MOODBOARD/Badge-HarryPotter-Patronus-AAA-V4.html` — référence Harry Potter (CSS)
5. `docs\SEB LE FOURBE\MOODBOARD\Moodboard-cine-délices-v2.html` — design system global

---

_Ciné Délices — Projet O'clock 2026_
