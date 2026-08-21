/**
 * time-ago.js — Formatage de date relative en français ("il y a 2 jours").
 * Utilisé pour l'affichage des avis (recipe-detail.ejs).
 */

const UNITS = [
  { limit: 60, divisor: 1, singular: "seconde", plural: "secondes", instant: "à l'instant" },
  { limit: 3600, divisor: 60, singular: "minute", plural: "minutes" },
  { limit: 86400, divisor: 3600, singular: "heure", plural: "heures" },
  { limit: 2592000, divisor: 86400, singular: "jour", plural: "jours" },
  { limit: 31536000, divisor: 2592000, singular: "mois", plural: "mois" },
  { limit: Infinity, divisor: 31536000, singular: "an", plural: "ans" },
];

/**
 * @param {Date|string|null} date
 * @returns {string} ex. "à l'instant", "il y a 3 jours", "il y a 2 ans"
 */
export function timeAgo(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const diffSeconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));

  if (diffSeconds < 60) {
    return UNITS[0].instant;
  }

  const unit = UNITS.find((u) => diffSeconds < u.limit) || UNITS[UNITS.length - 1];
  const value = Math.floor(diffSeconds / unit.divisor);
  const label = value > 1 ? unit.plural : unit.singular;
  return `il y a ${value} ${label}`;
}
