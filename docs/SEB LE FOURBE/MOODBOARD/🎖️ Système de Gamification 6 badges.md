# 🎬 Ciné Délices — Système de Gamification v3.0

> Document de référence · Version finale validée · Mars 2025

---

## Sommaire

1. [Vue d'ensemble](https://claude.ai/chat/471ca731-ac1f-4991-906b-ee28a43ca62a#1-vue-densemble)
2. [Système 1 — Niveau Profil](https://claude.ai/chat/471ca731-ac1f-4991-906b-ee28a43ca62a#2-syst%C3%A8me-1--niveau-profil)
3. [Système 2 — Badges Signature](https://claude.ai/chat/471ca731-ac1f-4991-906b-ee28a43ca62a#3-syst%C3%A8me-2--badges-signature)
4. [Système 3 — Badges Thème](https://claude.ai/chat/471ca731-ac1f-4991-906b-ee28a43ca62a#4-syst%C3%A8me-3--badges-th%C3%A8me-phase-2)
5. [Roadmap](https://claude.ai/chat/471ca731-ac1f-4991-906b-ee28a43ca62a#5-roadmap)
6. [Règles techniques](https://claude.ai/chat/471ca731-ac1f-4991-906b-ee28a43ca62a#6-r%C3%A8gles-techniques)

---

## 1. Vue d'ensemble

Trois systèmes distincts et complémentaires coexistent sur le profil utilisateur.

| Système | Nom                  | Lancement     | Objectif UX                                |
| ------- | -------------------- | ------------- | ------------------------------------------ |
| 1       | **Niveau Profil**    | ✅ Maintenant | Statut — _qui tu es sur le site_           |
| 2       | **Badges Signature** | ✅ Maintenant | Collection — _ce que tu as accompli_       |
| 3       | **Badges Thème**     | 🔜 Phase 2    | Expertise — _les univers que tu maîtrises_ |

### Principe directeur

> Un utilisateur doit pouvoir débloquer son premier badge dans les **10 minutes** après son inscription.

---

## 2. Système 1 — Niveau Profil

### 2.1 Barème des points

| Action                      | Points     |
| --------------------------- | ---------- |
| Créer une recette           | **10 pts** |
| Contribuer un film manquant | **5 pts**  |
| Poster un avis              | **2 pts**  |
| Ajouter un favori           | **1 pt**   |
| Connexion hebdomadaire      | **1 pt**   |

### 2.2 Niveaux

| #   | Niveau             | Points requis | Équivalent indicatif          |
| --- | ------------------ | ------------- | ----------------------------- |
| 1   | 🎬 **Figurant**    | 10 pts        | 1 recette créée               |
| 2   | 🎭 **Second Rôle** | 25 pts        | 2 recettes + quelques avis    |
| 3   | 🌟 **Acteur**      | 50 pts        | 4 recettes ou mix d'actions   |
| 4   | 🎥 **Réalisateur** | 100 pts       | 7 recettes ou mix intensif    |
| 5   | 👑 **Légende**     | 200 pts       | 12 recettes ou mix très actif |

### 2.3 Pourquoi ce système de points ?

Le catalogue de recettes sur Ciné Délices est **naturellement limité** par le nombre de films existants (estimé : 150 à 250 recettes max). Un système basé uniquement sur la création atteindrait rapidement son plafond.

Le système de points permet :

- Une progression continue même quand le catalogue est complet
- De récompenser tous les profils d'utilisateurs (créateurs, lecteurs, contributeurs)
- D'ajuster les valeurs facilement côté back sans tout recasser

---

## 3. Système 2 — Badges Signature

### 3.1 Principe

Un badge Signature = **un film iconique** + **une condition unique et mémorable**.

**Règle d'or : une seule condition par badge, pas de combo.**

Les badges non encore disponibles sont affichés en mode **"À venir 🔒"** sur le profil — ils créent de l'anticipation et montrent l'ambition du système.

### 3.2 Badges au lancement — 6 badges

| Badge                   | Film                          | Thème       | Condition de déverrouillage             |
| ----------------------- | ----------------------------- | ----------- | --------------------------------------- |
| 🧙 **Doctor Strange**   | Doctor Strange                | Fantastique | Créer 1 recette liée à Doctor Strange   |
| ⚡ **Harry Potter**     | Harry Potter                  | Fantastique | Créer 1 recette liée à Harry Potter     |
| 🎩 **Indiana Jones**    | Indiana Jones                 | Aventure    | Créer 1 recette liée à Indiana Jones    |
| 💊 **Matrix**           | Matrix                        | Sci-Fi      | Créer 1 recette liée à Matrix           |
| 🔪 **Freddy**           | Freddy les griffes de la nuit | Horreur     | Créer 1 recette liée à Freddy           |
| 🕹️ **Ready Player One** | Ready Player One              | Cyberpunk   | Créer 1 recette liée à Ready Player One |

### 3.3 Thèmes couverts au lancement

| Thème       | Films couverts                | Badges disponibles |
| ----------- | ----------------------------- | ------------------ |
| Fantastique | Doctor Strange, Harry Potter  | 2                  |
| Aventure    | Indiana Jones                 | 1                  |
| Sci-Fi      | Matrix                        | 1                  |
| Horreur     | Freddy les griffes de la nuit | 1                  |
| Cyberpunk   | Ready Player One              | 1                  |

### 3.4 Évolution prévue

Ajout de **2 à 5 nouveaux badges Signature par an**, selon les thèmes et films prioritaires.

Exemples de badges à venir :

| Badge                   | Film                 | Thème            |
| ----------------------- | -------------------- | ---------------- |
| 🐀 Ratatouille          | Ratatouille          | Disney / Pixar   |
| 🏴‍☠️ Pirates des Caraïbes | Pirates des Caraïbes | Aventure         |
| 👻 Ghostbusters         | Ghostbusters         | Comédie          |
| 🔍 Seven                | Seven                | Thriller         |
| 🚢 Titanic              | Titanic              | Romance          |
| 🦁 Le Roi Lion          | Le Roi Lion          | Animaux / Nature |

---

## 4. Système 3 — Badges Thème (Phase 2)

> ⏳ **Non lancé au démarrage.** À activer dans 6 à 12 mois quand la base de contenu et d'utilisateurs est suffisante.

### 4.1 Structure

22 thèmes × 6 niveaux = **132 badges thématiques** au total.

| Code niveau | Nom        | Condition                            |
| ----------- | ---------- | ------------------------------------ |
| **-D**      | Découverte | Consulter 5 contenus du thème        |
| **-A**      | Apprenti   | Créer 1 recette du thème             |
| **-R**      | Archiviste | Contribuer 1 film manquant du thème  |
| **-C**      | Critique   | Poster 5 avis sur contenus du thème  |
| **-M**      | Maître     | Avoir débloqué D + A + R + C         |
| **-F**      | Fanatique  | Consulter 100% du catalogue du thème |

### 4.2 Nomenclature

Format : `XXX-Y` — code thème (3 lettres) + niveau (1 lettre)

Exemples : `MAG-D`, `SCI-A`, `HOR-M`, `CBR-F`

### 4.3 Les 22 thèmes

| Code | Thème                  | Films représentés                                   |
| ---- | ---------------------- | --------------------------------------------------- |
| MAG  | Magie                  | Doctor Strange, Harry Potter, Sauron                |
| AVE  | Aventure               | Indiana Jones, Pirates des Caraïbes, LOTR           |
| HIG  | Hiver / Glace          | Frozen, Narnia, L'Âge de glace                      |
| SCI  | Futur / Sci-Fi         | Matrix, Star Wars, Tron                             |
| EPI  | Épique / Créatures     | Smaug, Jurassic Park, Les Dents de la Mer           |
| HOR  | Horreur                | Shining, Exorciste, Freddy                          |
| FAN  | Fantastique            | Alice, Avatar, Edward aux mains d'argent            |
| SUH  | Super Héros            | Superman, Iron Man, Spider-Man                      |
| ANI  | Animé                  | Dragon Ball, Naruto, One Piece                      |
| DIS  | Disney / Pixar         | Fantasia, Wall-E, Toy Story                         |
| THR  | Thriller / Policier    | Seven, Pulp Fiction, Silence des Agneaux            |
| ACT  | Action                 | Last Action Hero, Batman, Gladiator                 |
| COM  | Comédie / Famille      | Ghostbusters, Home Alone, Mrs. Doubtfire            |
| ROM  | Romance / Drame        | Titanic, La La Land, Orgueil et Préjugés            |
| MYT  | Mythologie / Antiquité | Troy, Hercule, Clash of the Titans                  |
| WES  | Western                | Le Bon la Brute le Truand, Django, True Grit        |
| PAP  | Post-Apocalyptique     | Mad Max, Hunger Games, I Am Legend                  |
| ESP  | Espionnage             | James Bond, Mission Impossible, Jason Bourne        |
| MUS  | Musical / Spectacle    | Moulin Rouge, Les Misérables, Chicago               |
| ANM  | Animaux / Nature       | Le Roi Lion, Planète des Singes, Livre de la Jungle |
| STP  | Steampunk / Victorien  | Sherlock Holmes, Wild Wild West, League of EG       |
| CBR  | Cyberpunk / High-tech  | Ghost in the Shell, Blade Runner, Ready Player One  |

### 4.4 Badges spéciaux (Phase 2)

| Code   | Badge                        | Condition                                        |
| ------ | ---------------------------- | ------------------------------------------------ |
| SPE-OB | ⭐ Bienvenue !               | S'inscrire sur Ciné Délices _(dès le lancement)_ |
| SPE-CN | 🍿 Cinéphile                 | Consulter 50 recettes au total                   |
| SPE-CO | 📚 Collectionneur            | Débloquer 10 badges thématiques                  |
| SPE-GM | 👑 Grand Maître Ciné Délices | Débloquer tous les badges thématiques            |

> ⚠️ Le badge **Bienvenue !** est une exception : il se déclenche dès l'inscription, dès le lancement du site.

---

## 5. Roadmap

| Phase       | Quand      | Ce qu'on lance                                                            |
| ----------- | ---------- | ------------------------------------------------------------------------- |
| **MVP**     | Maintenant | Niveau Profil (5 niveaux + points) + 6 badges Signature + badge Bienvenue |
| **Phase 2** | +6 mois    | +3 badges Signature + 3 premiers thèmes (MAG, SCI, HOR)                   |
| **Phase 3** | +1 an      | +5 badges Signature + 5 nouveaux thèmes                                   |
| **Phase 4** | +2 ans     | Système complet 22 thèmes + Collectionneur + Grand Maître                 |

---

## 6. Règles techniques

### 6.1 Structure BDD suggérée

```sql
-- Niveau profil
user_points (user_id, total_points, level_code, updated_at)

-- Badges Signature
signature_badges (id, code, film, theme, condition_type, condition_value)
user_signature_badges (user_id, badge_id, unlocked, unlocked_at)

-- Badges Thème (Phase 2)
theme_badges (id, code, theme_code, level_code, condition_type, condition_value)
user_theme_badges (user_id, badge_id, unlocked, unlocked_at, progress)
user_theme_progress (user_id, theme_code, consultations, creations, contributions, reviews, catalog_pct)
```

### 6.2 Logique de déclenchement

```javascript
// Après chaque action utilisateur
function onUserAction(userId, actionType, themeCode = null) {
  // Système 1 — Mise à jour des points
  const points = POINTS_MAP[actionType]; // 10 / 5 / 2 / 1
  addPoints(userId, points);
  checkLevelUp(userId);

  // Système 2 — Badges Signature
  checkSignatureBadges(userId, actionType, themeCode);

  // Système 3 — Badges Thème (Phase 2)
  if (themeCode) checkThemeBadges(userId, themeCode);
}

// Barème
const POINTS_MAP = {
  recipe_created: 10,
  film_contributed: 5,
  review_posted: 2,
  favorite_added: 1,
  weekly_login: 1,
};
```

### 6.3 Affichage sur le profil

```
┌──────────────────────────────────────────────────┐
│  👑 LÉGENDE   ████████░░  1 240 / 2 000 pts       │  ← Niveau Profil
├──────────────────────────────────────────────────┤
│  BADGES SIGNATURE                                 │
│  🧙 Doctor Strange  ✅   ⚡ Harry Potter  ✅      │  ← Débloqués
│  🎩 Indiana Jones   🔒   💊 Matrix        🔒      │  ← Verrouillés
│  🔪 Freddy          🔒   🕹️ Ready P. One  🔒      │
├──────────────────────────────────────────────────┤
│  BADGES THÈME                          🔜 Bientôt │  ← Phase 2
└──────────────────────────────────────────────────┘
```

---

\_Ciné Délices 2026
