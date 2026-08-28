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
  // Premier niveau — pas de palier métal, entrée dans la collection
  { code: "premier-clap",          label: "Premier Clap",            tier: "default",   image: "/images/trophees/trophee-premier-clap.webp",            unlocked: true },
  { code: "avis-a-chaud",          label: "Avis à Chaud",            tier: "default",   image: "/images/trophees/trophee-avis-a-chaud.webp",            unlocked: true },
  { code: "toque-debutante",       label: "Toque Débutante",         tier: "default",   image: "/images/trophees/trophee-toque-debutante.webp",         unlocked: true },
  // Second niveau — Bronze
  { code: "burger-rookie",         label: "Burger Rookie",           tier: "bronze",    image: "/images/trophees/trophee-burger-rookie.webp",           unlocked: true },
  { code: "cine-popcorn",          label: "Ciné Popcorn",            tier: "bronze",    image: "/images/trophees/trophee-cine-popcorn.webp",            unlocked: true },
  { code: "studio-bronze",         label: "Studio Bronze",           tier: "bronze",    image: "/images/trophees/trophee-studio-bronze.webp",           unlocked: true },
  // Troisième niveau — Argent
  { code: "nez-fin",               label: "Nez Fin",                 tier: "argent",    image: "/images/trophees/trophee-nez-fin.webp",                 unlocked: false },
  { code: "recette-culte",         label: "Recette Culte",           tier: "argent",    image: "/images/trophees/trophee-recette-culte.webp",           unlocked: false },
  { code: "clap-d-argent",         label: "Clap d'Argent",           tier: "argent",    image: "/images/trophees/trophee-clap-d-argent.webp",           unlocked: false },
  // Quatrième niveau — Or
  { code: "realisateur-du-gout",   label: "Réalisateur du Goût",     tier: "or",        image: "/images/trophees/trophee-realisateur-du-gout.webp",     unlocked: false },
  { code: "palme-du-palais",       label: "Palme du Palais",         tier: "or",        image: "/images/trophees/trophee-palme-du-palais.webp",         unlocked: false },
  { code: "projecteur-d-or",       label: "Projecteur d'Or",         tier: "or",        image: "/images/trophees/trophee-projecteur-d-or.webp",         unlocked: false },
  // Cinquième niveau — Superstar
  { code: "premier-role",          label: "Premier Rôle",            tier: "superstar", image: "/images/trophees/trophee-premier-role.webp",            unlocked: false },
  { code: "etoile-du-cine-delices",label: "Étoile du Ciné Délices",  tier: "superstar", image: "/images/trophees/trophee-etoile-du-cine-delices.webp",  unlocked: false },
  { code: "superstar-du-palais",   label: "Superstar du Palais",     tier: "superstar", image: "/images/trophees/trophee-superstar-du-palais.webp",     unlocked: false },
  // Sixième niveau — Mythique
  { code: "icone-du-cine-delices", label: "Icône du Ciné Délices",   tier: "mythique",  image: "/images/trophees/trophee-icone-du-cine-delices.webp",   unlocked: false },
  { code: "empreinte-eternelle",   label: "Empreinte Éternelle",     tier: "mythique",  image: "/images/trophees/trophee-empreinte-eternelle.webp",     unlocked: false },
  { code: "ticket-d-or",           label: "Ticket d'Or",             tier: "mythique",  image: "/images/trophees/trophee-ticket-d-or.webp",             unlocked: false },
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

/** Nombre total de trophées dans le futur système (mock). */
export const MOCK_BADGES_TOTAL = MOCK_BADGES.length;
