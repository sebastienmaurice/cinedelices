/**
 * Thème de la bannière « espace créateur » (page auteur d'un créateur partenaire).
 * Stocké en JSONB sur users.creator_theme :
 *   { signature, tagline, title, heroBgOptions, heroBgChoice, primary, accent, heroBg, bannerBg, frame }
 * Tout le reste de la palette (fonds, bordures, survols) est dérivé de la
 * couleur principale côté CSS (color-mix), pour qu'un seul choix suffise.
 * Aucune valeur n'est interprétée comme du code : couleurs en #RRGGBB strict,
 * textes courts échappés par EJS à l'affichage.
 */

export const DEFAULT_CREATOR_THEME = {
  signature: "",
  tagline: "",        // slogan affiché sous le pseudo dans le héros
  title: "",          // début du titre de la bannière du bas (défaut : « Les créations de »)
  primary: "#C23018", // rouge Ciné Délices
  accent: "#E3B148",  // or Ciné Délices
  heroBg: "",         // image de fond du héros (vide : bannière habituelle)
  bannerBg: "",       // image en filigrane dans la bannière du bas (discrète, derrière le contenu)
  frame: "",          // cadre sur mesure autour du portrait (PNG à centre transparent)
};

// Image de fond : chemin du site (/images/...) ou https uniquement
const HERO_BG = /^(\/images\/[\w./-]+|https:\/\/[^\s"'<>]+)$/;

const HEX = /^#[0-9a-fA-F]{6}$/;

// Fonds proposés au créateur (chemins du site uniquement, 6 maximum)
const BG_PATH = /^\/images\/[\w./-]+\.(png|webp|jpe?g)$/i;
const isBgPath = (p) => typeof p === "string" && BG_PATH.test(p) && p.length <= 300 && !p.includes("..");

/** Fond effectif du héros : le choix du créateur s'il figure parmi les fonds autorisés, sinon le fond par défaut. */
export function effectiveHeroBg(theme) {
  const t = theme || {};
  const allowed = [t.heroBg, ...(Array.isArray(t.heroBgOptions) ? t.heroBgOptions : [])].filter(Boolean);
  if (t.heroBgChoice && allowed.includes(t.heroBgChoice)) return t.heroBgChoice;
  return t.heroBg || "";
}

/** Nettoie l'objet reçu du formulaire admin. Retourne { value, invalid }. */
export function cleanCreatorTheme(input) {
  const value = {};
  const invalid = [];
  const text = (k, max) => {
    const v = String(input?.[k] ?? "").replace(/&amp;/g, "&").trim().slice(0, max);
    if (v) value[k] = v;
  };
  const opts = Array.isArray(input?.heroBgOptions) ? input.heroBgOptions : String(input?.heroBgOptions ?? "").split(/[\r\n,]+/);
  const cleanedOpts = [...new Set(opts.map((o) => String(o).trim()).filter(Boolean))];
  if (cleanedOpts.some((o) => !isBgPath(o))) invalid.push("heroBgOptions");
  else if (cleanedOpts.length) value.heroBgOptions = cleanedOpts.slice(0, 6);
  text("signature", 80);
  text("tagline", 80);
  text("title", 40);
  const bg = String(input?.heroBg ?? "").trim();
  if (bg) {
    if (HERO_BG.test(bg) && bg.length <= 300 && !bg.includes("..")) value.heroBg = bg;
    else invalid.push("heroBg");
  }
  const bb = String(input?.bannerBg ?? "").trim();
  if (bb) {
    if (/^\/images\/[\w./-]+\.(png|webp|jpe?g)$/i.test(bb) && bb.length <= 300 && !bb.includes("..")) value.bannerBg = bb;
    else invalid.push("bannerBg");
  }
  const fr = String(input?.frame ?? "").trim();
  if (fr) {
    if (/^\/images\/[\w./-]+\.(png|webp)$/i.test(fr) && fr.length <= 300 && !fr.includes("..")) value.frame = fr;
    else invalid.push("frame");
  }
  for (const k of ["primary", "accent"]) {
    const v = String(input?.[k] ?? "").trim();
    if (!v) continue;
    if (HEX.test(v)) value[k] = v.toUpperCase();
    else invalid.push(k);
  }
  return { value: Object.keys(value).length ? value : null, invalid };
}

/** Thème complet (défauts + personnalisation) prêt pour la vue. */
export function resolveCreatorTheme(user) {
  const t = (user && user.creator_theme) || {};
  return {
    signature: t.signature || DEFAULT_CREATOR_THEME.signature,
    tagline: t.tagline || "",
    title: t.title || "",
    primary: HEX.test(t.primary || "") ? t.primary : DEFAULT_CREATOR_THEME.primary,
    accent: HEX.test(t.accent || "") ? t.accent : DEFAULT_CREATOR_THEME.accent,
    heroBgDefault: HERO_BG.test(t.heroBg || "") ? t.heroBg : "",
    heroBgOptions: (Array.isArray(t.heroBgOptions) ? t.heroBgOptions : []).filter(isBgPath),
    heroBg: HERO_BG.test(effectiveHeroBg(t) || "") ? effectiveHeroBg(t) : "",
    bannerBg: /^\/images\/[\w./-]+\.(png|webp|jpe?g)$/i.test(t.bannerBg || "") && !String(t.bannerBg).includes("..") ? t.bannerBg : "",
    frame: /^\/images\/[\w./-]+\.(png|webp)$/i.test(t.frame || "") && !String(t.frame).includes("..") ? t.frame : "",
  };
}
