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

/**
 * Les 18 trophées (noms + visuels verrouillés — Phase 6/7, Ma Collection).
 * `tier` est un champ LEGACY (ancien classement bronze/argent/or/superstar/
 * mythique) : conservé uniquement pour ne rien casser sur /cinepass/, mais
 * aucun nouveau code (Ma Collection) ne doit s'en servir pour classer ou
 * hiérarchiser visuellement les trophées. La classification officielle est
 * `category` (comportementale, Game Design Phase 7 : Contribution /
 * Régularité / Diversité / Expertise / Communautaire / Secret) — les mots
 * "Bronze"/"Argent"/"Or"/"Superstar" dans certains libellés (Studio Bronze,
 * Clap d'Argent, Projecteur d'Or, Superstar du Palais) sont des noms
 * propres, pas des niveaux fonctionnels.
 *
 * Référentiel Game Design verrouillé en Phase 7 : `category`/`condition`/
 * `conditionType`/`target`/`secret`/`xpReward` sont désormais renseignés.
 * ⚠️ Ceci reste un RÉFÉRENTIEL, pas un calcul réel : `unlocked` demeure un
 * booléen mock statique (comme Fonds/Cadres/Univers à ce stade), aucune des
 * conditions ci-dessous n'est vérifiée par du vrai code. Plusieurs
 * dépendent de données qui n'existent pas encore en base (progression par
 * Univers, classement des contributeurs, agrégats de favoris/likes par
 * contenu ou par auteur) — voir le rapport d'audit Phase 7 pour le détail
 * de ce qui est déjà calculable vs à construire.
 *
 * `xpReward` vaut 0 pour les 18 : les trophées sont une collection
 * d'accomplissements distincte du système XP/niveau, ils n'en accordent
 * pas eux-mêmes (évite une boucle de récompense disproportionnée avec les
 * Fonds/Cadres/niveaux qui, eux, dérivent du même geste).
 *
 * Seul "ticket-d-or" a `secret: true` — sa condition réelle reste dans la
 * donnée (le référentiel doit la connaître), mais la vue ne doit l'afficher
 * que si `unlocked` est vrai (sinon : "Condition secrète").
 */
export const MOCK_BADGES = [
  // Premier niveau — pas de palier métal, entrée dans la collection
  { code: "premier-clap",          label: "Premier Clap",            tier: "default",   image: "/images/trophees/trophee-premier-clap.webp",            unlocked: true,  category: "Contribution",  condition: "Publier sa première contribution validée",                              conditionType: "BINARY",      target: null, secret: false, xpReward: 0 },
  { code: "avis-a-chaud",          label: "Avis à Chaud",            tier: "default",   image: "/images/trophees/trophee-avis-a-chaud.webp",            unlocked: true,  category: "Contribution",  condition: "Publier son premier avis validé",                                        conditionType: "BINARY",      target: null, secret: false, xpReward: 0 },
  { code: "toque-debutante",       label: "Toque Débutante",         tier: "default",   image: "/images/trophees/trophee-toque-debutante.webp",         unlocked: true,  category: "Contribution",  condition: "Publier sa première recette validée",                                    conditionType: "BINARY",      target: null, secret: false, xpReward: 0 },
  // Second niveau — Bronze
  { code: "burger-rookie",         label: "Burger Rookie",           tier: "bronze",    image: "/images/trophees/trophee-burger-rookie.webp",           unlocked: true,  category: "Contribution",  condition: "Publier 3 recettes validées",                                            conditionType: "THRESHOLD",   target: 3,    secret: false, xpReward: 0 },
  { code: "cine-popcorn",          label: "Ciné Popcorn",            tier: "bronze",    image: "/images/trophees/trophee-cine-popcorn.webp",            unlocked: true,  category: "Contribution",  condition: "Faire accepter 3 films",                                                 conditionType: "THRESHOLD",   target: 3,    secret: false, xpReward: 0 },
  { code: "studio-bronze",         label: "Studio Bronze",           tier: "bronze",    image: "/images/trophees/trophee-studio-bronze.webp",           unlocked: true,  category: "Contribution",  condition: "Publier 3 recettes validées ET faire accepter 3 films",                 conditionType: "COMBINATION", target: null, secret: false, xpReward: 0 },
  // Troisième niveau — Argent
  { code: "nez-fin",               label: "Nez Fin",                 tier: "argent",    image: "/images/trophees/trophee-nez-fin.webp",                 unlocked: false, category: "Expertise",     condition: "Donner 10 notes",                                                        conditionType: "THRESHOLD",   target: 10,   secret: false, xpReward: 0 },
  { code: "recette-culte",         label: "Recette Culte",           tier: "argent",    image: "/images/trophees/trophee-recette-culte.webp",           unlocked: false, category: "Communautaire", condition: "Une recette reçoit 10 favoris",                                          conditionType: "THRESHOLD",   target: 10,   secret: false, xpReward: 0 },
  { code: "clap-d-argent",         label: "Clap d'Argent",           tier: "argent",    image: "/images/trophees/trophee-clap-d-argent.webp",           unlocked: false, category: "Diversité",     condition: "Contribuer dans 5 Univers différents",                                   conditionType: "COUNT",       target: 5,    secret: false, xpReward: 0 },
  // Quatrième niveau — Or
  { code: "realisateur-du-gout",   label: "Réalisateur du Goût",     tier: "or",        image: "/images/trophees/trophee-realisateur-du-gout.webp",     unlocked: false, category: "Expertise",     condition: "Atteindre la Spécialisation dans au moins 1 Univers",                    conditionType: "THRESHOLD",   target: 1,    secret: false, xpReward: 0 },
  { code: "palme-du-palais",       label: "Palme du Palais",         tier: "or",        image: "/images/trophees/trophee-palme-du-palais.webp",         unlocked: false, category: "Expertise",     condition: "Atteindre la Maîtrise dans au moins 1 Univers",                          conditionType: "THRESHOLD",   target: 1,    secret: false, xpReward: 0 },
  { code: "projecteur-d-or",       label: "Projecteur d'Or",         tier: "or",        image: "/images/trophees/trophee-projecteur-d-or.webp",         unlocked: false, category: "Diversité",     condition: "Contribuer dans 10 Univers différents",                                  conditionType: "COUNT",       target: 10,   secret: false, xpReward: 0 },
  // Cinquième niveau — Superstar
  { code: "premier-role",          label: "Premier Rôle",            tier: "superstar", image: "/images/trophees/trophee-premier-role.webp",            unlocked: false, category: "Communautaire", condition: "Entrer dans le classement des meilleurs contributeurs",                  conditionType: "BINARY",      target: null, secret: false, xpReward: 0 },
  { code: "etoile-du-cine-delices",label: "Étoile du Ciné Délices",  tier: "superstar", image: "/images/trophees/trophee-etoile-du-cine-delices.webp",  unlocked: false, category: "Expertise",     condition: "Atteindre le niveau 10",                                                 conditionType: "THRESHOLD",   target: 10,   secret: false, xpReward: 0 },
  { code: "superstar-du-palais",   label: "Superstar du Palais",     tier: "superstar", image: "/images/trophees/trophee-superstar-du-palais.webp",     unlocked: false, category: "Communautaire", condition: "Recevoir 50 interactions positives cumulées (likes + favoris) sur ses contenus", conditionType: "THRESHOLD", target: 50, secret: false, xpReward: 0 },
  // Sixième niveau — Mythique
  { code: "icone-du-cine-delices", label: "Icône du Ciné Délices",   tier: "mythique",  image: "/images/trophees/trophee-icone-du-cine-delices.webp",   unlocked: false, category: "Expertise",     condition: "Atteindre 50 contributions validées",                                    conditionType: "THRESHOLD",   target: 50,   secret: false, xpReward: 0 },
  { code: "empreinte-eternelle",   label: "Empreinte Éternelle",     tier: "mythique",  image: "/images/trophees/trophee-empreinte-eternelle.webp",     unlocked: false, category: "Régularité",    condition: "Avoir un compte actif depuis 1 an",                                      conditionType: "THRESHOLD",   target: 1,    secret: false, xpReward: 0 },
  { code: "ticket-d-or",           label: "Ticket d'Or",             tier: "mythique",  image: "/images/trophees/trophee-ticket-d-or.webp",             unlocked: false, category: "Secret",        condition: "Obtenir les 17 autres trophées",                                         conditionType: "SECRET",      target: 17,   secret: true,  xpReward: 0 },
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
