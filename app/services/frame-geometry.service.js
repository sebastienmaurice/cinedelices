/**
 * Géométrie du « trou » d'un cadre sur mesure (PNG à centre transparent).
 * Permet de placer automatiquement le portrait dans le cadre d'un créateur,
 * quel que soit son dessin : on mesure la zone transparente centrale.
 * Retourne { cx, cy, d } en pourcentages de la largeur/hauteur de l'image
 * (d = diamètre du cercle inscrit), ou null si l'image est illisible.
 * Résultat mis en cache par chemin + date de modification.
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, "../public");
const cache = new Map();

export async function getFrameGeometry(publicPath) {
  // Uniquement un fichier du site (/images/...), jamais un chemin arbitraire
  if (!/^\/images\/[\w./-]+\.(png|webp)$/i.test(publicPath || "") || publicPath.includes("..")) return null;
  const abs = path.join(PUBLIC_DIR, publicPath);
  if (!abs.startsWith(PUBLIC_DIR)) return null;
  let stat;
  try { stat = fs.statSync(abs); } catch { return null; }
  const key = publicPath + ":" + stat.mtimeMs;
  if (cache.has(key)) return cache.get(key);

  try {
    const { data, info } = await sharp(abs).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    const clear = (x, y) => data[(y * w + x) * 4 + 3] < 24;

    // Centre de masse des pixels transparents entourés (zone centrale)
    let sx = 0, sy = 0, n = 0;
    const x0 = Math.floor(w * 0.3), x1 = Math.floor(w * 0.7), y0 = Math.floor(h * 0.3), y1 = Math.floor(h * 0.7);
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) if (clear(x, y)) { sx += x; sy += y; n++; }
    if (n < 100) return cacheSet(key, null);
    let cx = Math.round(sx / n), cy = Math.round(sy / n);

    // Rayon mesuré dans 24 directions : le plus petit retenu (cercle inscrit sûr)
    let rMin = Infinity;
    for (let a = 0; a < 24; a++) {
      const dx = Math.cos((a * Math.PI) / 12), dy = Math.sin((a * Math.PI) / 12);
      let r = 0;
      while (r < w / 2) {
        const x = Math.round(cx + dx * r), y = Math.round(cy + dy * r);
        if (x < 0 || y < 0 || x >= w || y >= h || !clear(x, y)) break;
        r++;
      }
      rMin = Math.min(rMin, r);
    }
    if (!isFinite(rMin) || rMin < 20) return cacheSet(key, null);
    return cacheSet(key, {
      cx: +((cx / w) * 100).toFixed(2),
      cy: +((cy / h) * 100).toFixed(2),
      d: +(((rMin * 2) / w) * 100).toFixed(2),
    });
  } catch {
    return cacheSet(key, null);
  }
}

function cacheSet(key, value) { cache.set(key, value); return value; }

