/**
 * Liens de réseaux sociaux d'un utilisateur (créateurs partenaires).
 * Stockés en JSONB sur users.social_links : { tiktok, instagram, youtube, website }.
 * Seules des URLs https vers les domaines attendus sont acceptées : on ne
 * stocke jamais un lien arbitraire (pas de javascript:, pas de redirection
 * vers un domaine inattendu pour les réseaux).
 */

export const SOCIAL_KEYS = ["tiktok", "instagram", "youtube", "website"];

const HOSTS = {
  tiktok: ["tiktok.com"],
  instagram: ["instagram.com"],
  youtube: ["youtube.com", "youtu.be"],
  website: null, // n'importe quel domaine en https
};

const HANDLE_BASE = {
  tiktok: "https://www.tiktok.com/@",
  instagram: "https://www.instagram.com/",
};

function hostMatches(host, allowed) {
  return allowed.some((d) => host === d || host.endsWith("." + d));
}

/** Retourne une URL https propre, ou null si vide / invalide. */
export function cleanSocialUrl(key, raw) {
  let value = String(raw ?? "").trim();
  if (!value) return null;

  // "@pseudo" accepté pour TikTok et Instagram
  if (HANDLE_BASE[key] && /^@?[A-Za-z0-9._]{2,30}$/.test(value)) {
    return HANDLE_BASE[key] + value.replace(/^@/, "");
  }

  // Tout autre schéma explicite (ftp:, javascript:, data:...) est refusé
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) && !/^https?:\/\//i.test(value)) return null;
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;

  let url;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  url.protocol = "https:";
  const allowed = HOSTS[key];
  if (allowed && !hostMatches(url.hostname.toLowerCase(), allowed)) return null;
  if (url.username || url.password) return null;
  const out = url.toString();
  return out.length <= 300 ? out : null;
}

/**
 * Nettoie l'objet reçu du formulaire admin. Retourne { value, invalid } :
 * value = objet à stocker (ou null si aucun lien), invalid = clés refusées.
 */
export function cleanSocialLinks(input) {
  const value = {};
  const invalid = [];
  for (const key of SOCIAL_KEYS) {
    const raw = input?.[key];
    if (raw === undefined || String(raw).trim() === "") continue;
    const cleaned = cleanSocialUrl(key, raw);
    if (cleaned) value[key] = cleaned;
    else invalid.push(key);
  }
  return { value: Object.keys(value).length ? value : null, invalid };
}
