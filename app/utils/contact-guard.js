import crypto from "node:crypto";

/**
 * Protection anti-spam du formulaire de contact.
 *
 * Couches, de la moins visible à la plus forte :
 *  1. jeton de formulaire signé (HMAC) émis au rendu de la page : un bot qui
 *     POST directement sur /contact-about/contact n'en a pas, et un bot qui
 *     remplit le formulaire instantanément est reconnu (délai minimal) ;
 *  2. heuristiques sur le contenu (liens, longueur) ;
 *  3. Cloudflare Turnstile, activé seulement si TURNSTILE_SITE_KEY et
 *     TURNSTILE_SECRET_KEY sont définies (sinon ignoré).
 */

const SECRET = process.env.JWT_SECRET || "cinedelices-contact-fallback";
const MIN_FILL_MS = 4000; // un humain met plus de 4 s à remplir 4 champs
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // jeton valable 2 h

const sign = (ts) => crypto.createHmac("sha256", SECRET).update(String(ts)).digest("hex");

/** Jeton `timestamp.signature`, à glisser dans un champ caché du formulaire. */
export function issueFormToken() {
  const ts = Date.now();
  return `${ts}.${sign(ts)}`;
}

/**
 * @returns {"ok"|"missing"|"expired"|"too_fast"} raison du refus, ou "ok"
 */
export function checkFormToken(token) {
  if (typeof token !== "string" || !token.includes(".")) return "missing";
  const [ts, sig] = token.split(".");
  const expected = sign(ts);
  const a = Buffer.from(sig || "");
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return "missing";
  const age = Date.now() - Number(ts);
  if (!Number.isFinite(age) || age > MAX_AGE_MS) return "expired";
  if (age < MIN_FILL_MS) return "too_fast";
  return "ok";
}

const URL_SRC = "(https?:\\/\\/|www\\.|\\b[a-z0-9-]+\\.(com|net|org|ru|xyz|top|info|biz|shop|site|online)\\/)";
const hasLink = (s) => new RegExp(URL_SRC, "i").test(String(s ?? ""));
const countLinks = (s) => (String(s ?? "").match(new RegExp(URL_SRC, "gi")) || []).length;

/** Retourne la raison si le contenu ressemble à du spam, sinon null. */
export function detectSpamContent({ name, subject, message }) {
  if (hasLink(name) || hasLink(subject)) return "lien dans le nom/sujet";
  if (countLinks(message) >= 2) return "plusieurs liens";
  if (String(message).length > 3000) return "message trop long";
  if (String(name).length > 80) return "nom trop long";
  return null;
}

export const turnstileEnabled = () =>
  Boolean(process.env.TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);

/** Vérifie la réponse Turnstile côté serveur. true si OK ou si désactivé. */
export async function verifyTurnstile(token, ip) {
  if (!turnstileEnabled()) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    });
    const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = await r.json();
    return json.success === true;
  } catch (err) {
    console.error("[Contact] Turnstile injoignable :", err.message);
    return true; // on ne bloque pas les vrais visiteurs si Cloudflare est en panne
  }
}

export const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
