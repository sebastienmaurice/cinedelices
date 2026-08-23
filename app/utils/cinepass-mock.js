/**
 * cinepass-mock.js
 * ─────────────────────────────────────────────────────────────────────
 * ⚠️ DONNÉES MOCKÉES — AUCUNE LOGIQUE MÉTIER RÉELLE.
 *
 * Le CinéPass V1 affiche deux aperçus du futur système de gamification :
 *   - les Badges (accomplissements)
 *   - les Univers cinématographiques (progression par genre)
 *
 * Ni l'un ni l'autre n'existe encore en base (pas de modèle, pas de table,
 * pas de calcul). Conformément au document maître (§16-17), on ISOLE ces
 * données ici plutôt que de les mélanger aux vraies données XP/cadres —
 * elles seront remplacées par un vrai calcul (`gamificationData.badges`,
 * `gamificationData.univers`) lors d'une version ultérieure (V3.3/V3.4 de
 * la roadmap), sans toucher au reste du CinéPass.
 *
 * NE PAS enrichir ce fichier avec de la logique de déblocage réelle tant
 * que les règles fonctionnelles (backend) n'ont pas été validées.
 */

export const MOCK_BADGES = [
  { code: "popcorn-rookie", label: "Popcorn Rookie", icon: "🍿", tier: "bronze" },
  { code: "studio-bronze", label: "Studio Bronze", icon: "🎞️", tier: "bronze" },
  { code: "critique-avise", label: "Critique Avisé", icon: "⭐", tier: "argent" },
  { code: "cuisinier-curieux", label: "Cuisinier Curieux", icon: "🔪", tier: "argent" },
];

export const MOCK_UNIVERS = [
  { code: "horreur", label: "Horreur", img: "/images/categories/horreur.png", accent: "red", progress: 2, total: 3, xp: 35, xpMax: 100 },
  { code: "comedie", label: "Comédie", img: "/images/categories/comedie.png", accent: "gold", progress: 3, total: 3, xp: 100, xpMax: 100 },
  { code: "aventure", label: "Aventure", img: "/images/categories/aventure.png", accent: "orange", progress: 1, total: 3, xp: 20, xpMax: 100 },
  { code: "scifi", label: "Sci-Fi", img: "/images/categories/sci-fi.png", accent: "blue", progress: 2, total: 3, xp: 60, xpMax: 100 },
  { code: "fantastique", label: "Fantastique", img: "/images/categories/fantastique.png", accent: "purple", progress: 1, total: 3, xp: 15, xpMax: 100 },
  { code: "action", label: "Action", img: "/images/categories/action.png", accent: "steel", progress: 3, total: 3, xp: 100, xpMax: 100 },
  { code: "drame", label: "Drame", img: "/images/categories/drame.png", accent: "green", progress: 1, total: 3, xp: 25, xpMax: 100 },
  { code: "romance", label: "Romance", img: "/images/categories/romance.png", accent: "pink", progress: 2, total: 3, xp: 55, xpMax: 100 },
  { code: "thriller", label: "Thriller", img: "/images/categories/thriller.png", accent: "teal", progress: 0, total: 3, xp: 0, xpMax: 100 },
  { code: "western", label: "Western", img: "/images/categories/western.png", accent: "brown", progress: 1, total: 3, xp: 10, xpMax: 100 },
];

/** Nombre total de badges "à débloquer" dans le futur système (mock). */
export const MOCK_BADGES_TOTAL = 18;
