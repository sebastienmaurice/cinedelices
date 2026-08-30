/**
 * collection-mock.js
 * ─────────────────────────────────────────────────────────────────────
 * Couche de données MOCK pour "Ma Collection" (Univers cinématographiques
 * / Fonds / Cadres / Trophées).
 *
 * ⚠️ Aucune donnée réelle : ce fichier est un adaptateur temporaire.
 * Le backend réel (compteurs événementiels et idempotents par genre, cf.
 * Game Design §28-29) sera traité dans une phase dédiée à l'architecture
 * de données. En attendant, ce module respecte strictement les règles
 * verrouillées du Game Design :
 *   - 15 Univers (nomenclature verrouillée — voir migration ci-dessous)
 *   - 5 Fonds / Univers, seuils 1 / 3 / 5 / 7 / 10
 *   - 2 Cadres / Univers, seuils 5 / 10
 *   - 1 contribution approuvée dans un genre = +10% de progression
 *   - statuts : Non exploré (0) / Exploration (1-4) / Spécialisation (5-9)
 *     / Maîtrise (10+)
 *   - la progression est plafonnée visuellement à 100%
 *   - un film peut porter plusieurs genres TMDB (ex. Gladiator = Action +
 *     Drame + Aventure) et donc alimenter plusieurs Univers à la fois —
 *     déjà structurellement supporté ici (chaque Univers lit son propre
 *     compteur de contributions, aucune exclusivité mutuelle supposée) ;
 *     le calcul réel multi-genre par film reste à faire côté backend.
 *
 * MIGRATION 19 → 15 UNIVERS : Documentaire, Mystère, Téléfilm et Familial
 * ont été retirés (genres jugés trop transversaux/ambigus pour porter une
 * identité d'Univers propre — Mystère recouvre Crime/Thriller, Documentaire
 * décrit une forme de production plutôt qu'une expérience de genre).
 * Musique → libellé "Musical", Histoire → libellé "Historique" (les codes
 * internes restent "musique"/"histoire" : ce sont les valeurs réelles de
 * movies.genre / tmdb-genre-map.js, seul le libellé affiché change — les
 * renommer casserait l'alignement documenté avec la BDD réelle pour un
 * gain purement cosmétique). 95 Fonds → 75 Fonds (15×5), 38 Cadres → 30
 * Cadres (15×2), automatique via UNIVERS_DEFINITIONS.length, aucun total
 * n'est codé en dur ailleurs dans ce fichier.
 *
 * Ce module est volontairement le SEUL endroit qui connaît la forme des
 * données de collection. Le contrôleur et la vue ne font que consommer
 * ce qu'il retourne — le jour où ces données viendront d'un vrai calcul
 * en base, seule la fonction getMockCollectionData() devra être
 * remplacée par un équivalent lisant la BDD, sans toucher à la vue.
 *
 *   UI → Collection data layer (ce fichier) → MOCK
 *   UI → Collection data layer (même forme) → API / Backend réel (plus tard)
 *
 * ⚠️ PHASE 10 — ce "plus tard" est arrivé, mais uniquement pour les
 * Univers : `app/services/universe.service.js` calcule désormais les
 * VRAIES contributions par genre et réutilise TEL QUEL le moteur pur de
 * ce fichier (`computeUniversState`/`buildUnivers`/`summarize`, exportées
 * pour l'occasion) — aucune logique dupliquée, aucun seuil/nom changé.
 *   MOCK   = getMockCollectionData(preset)      → utilisé par ?mock=<preset> (dev/QA uniquement, jamais par défaut pour un utilisateur réel)
 *   RÉEL   = universe.service.js:getUserUniverseProgress(userId) → comportement par défaut de /collection/
 * Ce fichier lui-même reste 100% mock — il ne sait toujours pas d'où
 * vient `contributionsByGenre`, ce qui est exactement ce qui permet au
 * réel et au mock de partager le même moteur sans se marcher dessus.
 */

export const FOND_SEUILS  = [1, 3, 5, 7, 10];
export const CADRE_SEUILS = [5, 10];
export const MAITRISE_SEUIL = 10;

/**
 * Les 15 Univers = 15 des genres réels utilisés par Ciné Délices (mêmes
 * valeurs `code` que movies.genre / tmdb-genre-map.js), pour que le jour
 * où le calcul réel sera branché, aucune correspondance à inventer.
 * Documentaire/Mystère/Téléfilm/Familial existent toujours comme genres
 * réels du site mais ne portent pas d'Univers dédié (voir migration
 * ci-dessus) — une contribution dans ces genres continue d'exister mais
 * n'alimente aucun Univers de Ma Collection.
 */
/**
 * Ordre d'affichage alphabétique verrouillé (voir Phase 2, mis à jour lors
 * de la migration 19→15). `img` pointe vers les affiches de genre déjà
 * présentes dans app/public/images/categories/.
 */
export const UNIVERS_DEFINITIONS = [
  { code: "action",           label: "Action",           icon: "zap",         img: "/images/categories/action.png",       accent: "#e0524a" },
  { code: "aventure",         label: "Aventure",         icon: "compass",     img: "/images/categories/aventure.png",     accent: "#c98a3a" },
  { code: "animation",        label: "Animation",        icon: "palette",     img: "/images/categories/animation.png",    accent: "#5aa0e0" },
  { code: "comédie",          label: "Comédie",          icon: "smile",       img: "/images/categories/comedie.png",      accent: "#e0c23a" },
  { code: "crime",            label: "Crime",            icon: "search",      img: "/images/categories/policier.png",     accent: "#8a8a8a" },
  { code: "drame",            label: "Drame",            icon: "drama",       img: "/images/categories/drame.png",        accent: "#7a4a6a" },
  { code: "fantastique",      label: "Fantastique",      icon: "sparkles",    img: "/images/categories/fantastique.png",  accent: "#9a6ae0" },
  { code: "guerre",           label: "Guerre",           icon: "shield",      img: "/images/categories/guerre.png",       accent: "#8a7a5a" },
  { code: "histoire",         label: "Historique",       icon: "landmark",    img: "/images/categories/historique.png",   accent: "#b08a55" },
  { code: "horreur",          label: "Horreur",          icon: "ghost",       img: "/images/categories/horreur.png",      accent: "#a83a3a" },
  { code: "musique",          label: "Musical",          icon: "music",       img: "/images/categories/musical.png",      accent: "#c04a9a" },
  { code: "romance",          label: "Romance",          icon: "heart",       img: "/images/categories/romance.png",      accent: "#e08aa0" },
  { code: "science-fiction",  label: "Science-Fiction",  icon: "rocket",      img: "/images/categories/sci-fi.png",       accent: "#3ac9e0" },
  { code: "thriller",         label: "Thriller",         icon: "eye",         img: "/images/categories/thriller.png",     accent: "#3a4a5a" },
  { code: "western",          label: "Western",          icon: "flag",        img: "/images/categories/western.png",      accent: "#c9863a" },
];

/**
 * Noms génériques des paliers (valables pour tous les Univers en
 * attendant la direction artistique définitive par genre — cf. Game
 * Design "Conception détaillée des 19 Univers", §25 : ce nommage
 * bespoke est un sujet d'assets, pas de mécanique).
 */
export const FOND_NOMS  = ["Découverte", "Immersion", "Maîtrise", "Prestige", "Signature"];
export const CADRE_NOMS = ["Spécialiste", "Maître"];

/** Un seul statut principal par carte (Game Design §6/7) — jamais deux à la fois. */
const STATUS_LABELS = {
  "non-explore": "À découvrir",
  exploration: "Exploration",
  specialisation: "Spécialisation",
  maitrise: "Maîtrisé",
};
export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

/**
 * Calcule l'état complet d'un Univers à partir d'un nombre de
 * contributions approuvées (seule donnée d'entrée, conforme au Game
 * Design : "1 contribution approuvée = 1 point d'Univers").
 */
export function computeUniversState(contributions) {
  const n = Math.max(0, contributions | 0);
  const pct = Math.min(100, n * 10);

  let status = "non-explore";
  if (n >= MAITRISE_SEUIL) status = "maitrise";
  else if (n >= 5) status = "specialisation";
  else if (n >= 1) status = "exploration";

  const fonds = FOND_SEUILS.map((seuil, i) => ({
    index: i + 1,
    nom: FOND_NOMS[i],
    seuil,
    unlocked: n >= seuil,
  }));

  const cadres = CADRE_SEUILS.map((seuil, i) => ({
    index: i + 1,
    nom: CADRE_NOMS[i],
    seuil,
    unlocked: n >= seuil,
  }));

  const fondsUnlockedCount  = fonds.filter((f) => f.unlocked).length;
  const cadresUnlockedCount = cadres.filter((c) => c.unlocked).length;

  // Prochain objectif — premier palier (fond ou cadre) non encore atteint.
  const nextFond  = fonds.find((f) => !f.unlocked) || null;
  const nextCadre = cadres.find((c) => !c.unlocked) || null;
  let nextObjectif = null;
  if (n < MAITRISE_SEUIL) {
    const nextSeuil = nextFond ? nextFond.seuil : (nextCadre ? nextCadre.seuil : null);
    if (nextSeuil !== null) {
      nextObjectif = {
        seuil: nextSeuil,
        restant: nextSeuil - n,
        fond: nextFond && nextFond.seuil === nextSeuil ? nextFond : null,
        cadre: nextCadre && nextCadre.seuil === nextSeuil ? nextCadre : null,
      };
    }
  }

  return {
    contributions: n,
    pct,
    status,
    fonds,
    cadres,
    fondsUnlockedCount,
    cadresUnlockedCount,
    hasExtra: n > MAITRISE_SEUIL,
    nextObjectif,
  };
}

/**
 * Construit la liste complète des 15 Univers pour un jeu de
 * contributions donné (objet { genreCode: nombre }), avec en option un
 * Univers actif et des équipements (fond/cadre) par Univers.
 */
export function buildUnivers(contributionsByGenre, { universActifCode = null, equipements = {} } = {}) {
  return UNIVERS_DEFINITIONS.map((def) => {
    const contributions = contributionsByGenre[def.code] || 0;
    const state = computeUniversState(contributions);
    const equip = equipements[def.code] || {};
    return {
      ...def,
      ...state,
      statusLabel: statusLabel(state.status),
      actif: def.code === universActifCode,
      fondEquipeIndex: equip.fond || null,
      cadreEquipeIndex: equip.cadre || null,
    };
  });
}

export function summarize(universList) {
  const explores  = universList.filter((u) => u.contributions >= 1).length;
  const maitrises = universList.filter((u) => u.status === "maitrise").length;
  const fondsTotal   = universList.length * FOND_SEUILS.length;
  const cadresTotal  = universList.length * CADRE_SEUILS.length;
  const fondsObtenus  = universList.reduce((acc, u) => acc + u.fondsUnlockedCount, 0);
  const cadresObtenus = universList.reduce((acc, u) => acc + u.cadresUnlockedCount, 0);
  return { explores, maitrises, total: universList.length, fondsTotal, fondsObtenus, cadresTotal, cadresObtenus };
}

/**
 * Préréglage "default" — couvre volontairement tous les états requis
 * pour valider l'UI (0%, 10%, 20% ... 100%, 100%+contributions
 * supplémentaires, fond équipé, cadre I/II obtenu ou verrouillé, univers
 * actif) sans avoir à modifier la base de données.
 */
function defaultPreset() {
  const contributions = {
    horreur: 7,             // Spécialisation, Fond IV obtenu, Cadre I obtenu, Cadre II verrouillé — univers actif
    "comédie": 10,          // Maîtrise pile, Fond V + Cadre II obtenus
    aventure: 13,           // Maîtrise + contributions supplémentaires (test du plafond)
    "science-fiction": 5,   // Spécialisation pile, Cadre I obtenu
    fantastique: 3,         // Exploration, Fond II obtenu
    action: 1,              // Exploration, Fond I seul
    drame: 0,               // Non exploré
    thriller: 9,            // Spécialisation, juste avant la Maîtrise
    western: 4,             // Exploration
    romance: 2,             // Exploration
    crime: 6,               // Spécialisation
    animation: 0,
    guerre: 0,
    histoire: 0,            // Historique — non exploré
    musique: 0,             // Musical — non exploré
  };
  const universList = buildUnivers(contributions, {
    universActifCode: "horreur",
    equipements: {
      horreur: { fond: 2, cadre: 1 },   // Fond "Immersion" + Cadre "Spécialiste" équipés
      "comédie": { fond: 5, cadre: 2 }, // Univers maîtrisé, Fond "Signature" + Cadre "Maître" équipés
    },
  });
  return { preset: "default", universList, summary: summarize(universList) };
}

/** Préréglage "spécialiste" — un seul Univers massivement développé. */
function specialistePreset() {
  const contributions = { horreur: 12 };
  UNIVERS_DEFINITIONS.forEach((d) => { if (!(d.code in contributions)) contributions[d.code] = 0; });
  const universList = buildUnivers(contributions, {
    universActifCode: "horreur",
    equipements: { horreur: { fond: 5, cadre: 2 } },
  });
  return { preset: "specialiste", universList, summary: summarize(universList) };
}

/** Préréglage "explorateur" — une contribution dans 10 Univers différents. */
function explorateurPreset() {
  const codesTouches = [
    "horreur", "comédie", "aventure", "science-fiction", "fantastique",
    "action", "drame", "thriller", "western", "romance",
  ];
  const contributions = {};
  UNIVERS_DEFINITIONS.forEach((d) => { contributions[d.code] = codesTouches.includes(d.code) ? 1 : 0; });
  const universList = buildUnivers(contributions, { universActifCode: "horreur" });
  return { preset: "explorateur", universList, summary: summarize(universList) };
}

const PRESETS = {
  default: defaultPreset,
  specialiste: specialistePreset,
  explorateur: explorateurPreset,
};

/**
 * Point d'entrée unique utilisé par le contrôleur. `preset` permet de
 * basculer entre les jeux de données de test (?mock=specialiste,
 * ?mock=explorateur) — un outil de vérification UI, pas une fonctionnalité
 * produit.
 */
export function getMockCollectionData(preset = "default") {
  const build = PRESETS[preset] || PRESETS.default;
  return build();
}

export const MOCK_PRESET_NAMES = Object.keys(PRESETS);

/**
 * Phase 3 — fiche détaillée d'un Univers. Retourne l'item déjà construit
 * par buildUnivers() (même forme que collection.universList), ou null si
 * le code de genre n'existe pas. Ne recalcule rien de spécifique à la
 * fiche : la fiche consomme exactement la même donnée que la carte dans
 * la grille (fonds[], cadres[], nextObjectif, etc.), aucune duplication
 * de logique de progression.
 */
export function getMockUniversDetail(code, preset = "default") {
  const { universList } = getMockCollectionData(preset);
  return universList.find((u) => u.code === code) || null;
}
