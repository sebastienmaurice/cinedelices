/**
 * Cadre sur mesure d'un créateur partenaire, appliqué comme cadre « par défaut » partout où le
 * cadre équipé est affiché (navigation, profil, CinéPass) tant qu'il n'a pas équipé un autre cadre
 * de la collection (code « cine » = cadre par défaut).
 *
 * Les cadres de la collection ont un trou central d'environ 49,5 % de la largeur, centré. Le cadre du
 * créateur a un trou plus grand : on le réduit (transform CSS) pour que son trou retombe exactement
 * sur celui d'un cadre standard, ce qui évite de toucher à la mise en page des avatars.
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { User } from "../models/index.model.js";
import { getFrameGeometry } from "./frame-geometry.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const PARTNER_TITLES = ["Créatrice Partenaire", "Créateur Partenaire"];
const REF_D = 49.5; // diamètre du trou des cadres standards (% de la largeur)

const cache = new Map(); // userId -> { t, v }
const TTL = 60 * 1000;

/** Variante légère « -nav » du cadre si elle existe (petits avatars), sinon le cadre lui-même. */
function navVariant(url) {
  const nav = url.replace(/\.(webp|png)$/i, "-nav.webp");
  try { if (fs.existsSync(path.join(PUBLIC_DIR, nav))) return nav; } catch { /* ignore */ }
  return url;
}

async function load(userId) {
  if (!userId) return { frame: null, heroBg: null };
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.t < TTL) return hit.v;
  let v = { frame: null, heroBg: null };
  try {
    const u = await User.findByPk(userId, { attributes: ["special_title", "creator_theme"] });
    if (u && PARTNER_TITLES.includes(u.special_title)) {
      const theme = u.creator_theme || {};
      if (/^\/images\/[\w./-]+\.(png|webp|jpe?g)$/i.test(theme.heroBg || "") && !theme.heroBg.includes("..")) v.heroBg = theme.heroBg;
      if (theme.frame) {
        const g = await getFrameGeometry(theme.frame);
        if (g) {
          const scale = (REF_D / g.d).toFixed(4);
          const style = `transform-origin: ${g.cx}% ${g.cy}%; transform: translate(${(50 - g.cx).toFixed(2)}%, ${(50 - g.cy).toFixed(2)}%) scale(${scale});`;
          v.frame = { url: theme.frame, navUrl: navVariant(theme.frame), style };
        }
      }
    }
  } catch { /* défaut : aucun réglage créateur */ }
  cache.set(userId, { t: Date.now(), v });
  return v;
}

/** @returns {Promise<{url:string, navUrl:string, style:string}|null>} */
export async function getCreatorFrame(userId) { return (await load(userId)).frame; }

/** Image de fond du héros du créateur (la même que sur sa page auteur), ou null. */
export async function getCreatorHeroBg(userId) { return (await load(userId)).heroBg; }

export function clearCreatorFrameCache(userId) { cache.delete(userId); }
