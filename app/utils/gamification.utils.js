// utils/xp.js — Source de vérité unique pour le système de progression
// Partagé entre gamification.service.js (backend) et user-profile.ejs (EJS inline)

export const XP_TABLE = [
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

export const RANK_TITLES = {
  1:  'Spectateur Curieux',
  2:  'Cinéphile Amateur',
  3:  'Fin Palais',
  4:  'Analyste du Goût',
  5:  'Connaisseur',
  6:  'Explorateur Cuisinier',
  7:  'Détective des Saveurs',
  8:  'Critique Éclairé',
  9:  'Maître Cinéaste',
  10: 'Grand Gastronome',
  11: 'Virtuose Cinéphile',
  12: 'Légende de Ciné Délices',
  13: 'Ambassadeur',
  14: 'Visionnaire',
  15: 'Architecte des Saveurs',
  16: 'Maître des Écrans',
  17: 'Gardien du Temple',
  18: 'Élu de Ciné Délices',
  19: 'Mythe Vivant',
};

export const XP_ACTIONS = {
  recipe_published:   50,
  recipe_approved:    30,
  movie_accepted:     25,
  review_approved:    10,
  comment_posted:     5,
  like_received:      2,
  favorite_added:     1,
  rating_given:       2,
  daily_login:        3,
  streak_7_days:      15,
  first_recipe_month: 20,
};

// Cadres disponibles — ordre de déblocage
export const FRAME_UNLOCKS = [
  {
    code:     'none',
    label:    'Sans cadre',
    theme:    'Par défaut',
    icon:     '○',
    minLvl:   1,
    pngUrl:   null,
    thumbUrl: null, // pas de miniature pour "sans cadre"
    hasAnim:  false,
  },
  {
    code:     'cine',
    label:    'Ciné Délices',
    theme:    'Cinéma',
    icon:     '🎬',
    minLvl:   1,
    pngUrl:   '/images/cadres-gamification/Ciné Délices/img/cadre-cine-delices-v2.png',
    thumbUrl: '/images/cadres-gamification/thumbs/thumb-cine.jpg',
    hasAnim:  false,
  },
  {
    code:     'sherlock',
    label:    'Sherlock Holmes',
    theme:    'Policier',
    icon:     '🔍',
    minLvl:   2,
    pngUrl:   '/images/cadres-gamification/Sherlock Holmes/img/cadre-sherlock-holmes-1440.png',
    thumbUrl: '/images/cadres-gamification/thumbs/thumb-sherlock.jpg',
    hasAnim:  true,
  },
  {
    code:     'matrix',
    label:    'Matrix',
    theme:    'Science-Fiction',
    icon:     '🟢',
    minLvl:   4,
    pngUrl:   '/images/cadres-gamification/Matrix/img/cadre-matrix-260x260.png',
    thumbUrl: '/images/cadres-gamification/thumbs/thumb-matrix.jpg',
    hasAnim:  true,
  },
  {
    code:     'indiana',
    label:    'Indiana Jones',
    theme:    'Aventure',
    icon:     '🎩',
    minLvl:   5,
    pngUrl:   '/images/cadres-gamification/Indiana Jones/img/cadre-indiana-jones-260x260.png',
    thumbUrl: '/images/cadres-gamification/thumbs/thumb-indiana.jpg',
    hasAnim:  true,
  },
  {
    code:     'harry',
    label:    'Harry Potter',
    theme:    'Magie',
    icon:     '⚡',
    minLvl:   7,
    pngUrl:   '/images/cadres-gamification/Harry Potter/img/cadre-harry-potter-260x260.png',
    thumbUrl: '/images/cadres-gamification/thumbs/thumb-harry.jpg',
    hasAnim:  true,
  },
];

/**
 * Retourne le niveau (1-19) correspondant à un total XP.
 */
export function computeLevel(xp) {
  let level = 1;
  for (let i = 1; i < XP_TABLE.length; i++) {
    if (xp >= XP_TABLE[i]) level = i + 1;
    else break;
  }
  return Math.min(level, XP_TABLE.length);
}

/**
 * Retourne la progression dans le niveau courant.
 * @returns {{ current, needed, span, pct }}
 */
export function xpProgress(xp, level) {
  const start = XP_TABLE[level - 1] ?? 0;
  const end   = XP_TABLE[level]     ?? XP_TABLE[XP_TABLE.length - 1];
  const span  = end - start;
  return {
    current: xp - start,
    needed:  Math.max(0, end - xp),
    span,
    pct:     span > 0 ? Math.min(100, Math.round(((xp - start) / span) * 100)) : 100,
  };
}
