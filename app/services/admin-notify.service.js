/**
 * Notifications par email à l'équipe (nouvel inscrit, contenus à modérer, erreurs serveur).
 *
 * - Destinataire : ADMIN_NOTIFY_EMAIL, sinon cinedelices.team@gmail.com.
 * - Actif en production (NODE_ENV=production ou Render) ou si NOTIFY_ADMIN=on.
 *   NOTIFY_ADMIN=off le coupe partout ; NOTIFY_ADMIN=dry affiche l'email en console sans l'envoyer
 *   (utile en local : le .env de dev contient une vraie clé Resend).
 * - Ne lève JAMAIS d'exception : une notification ratée ne doit pas casser une inscription.
 * - Regroupement : les événements arrivant dans la même fenêtre de 45 s partent dans UN seul email
 *   (ex. une recette + ses 3 photos = 1 email, pas 4).
 * - Anti-spam des erreurs : une même erreur n'est notifiée qu'une fois par 15 min, 10 par heure max.
 */
import { sendMail } from "./mail.service.js";

const RECIPIENT = process.env.ADMIN_NOTIFY_EMAIL || "cinedelices.team@gmail.com";
const SITE_URL = (process.env.SITE_URL || "https://cinedelices.com").replace(/\/$/, "");
const WINDOW_MS = Number(process.env.NOTIFY_WINDOW_MS) || 45 * 1000;
const ERROR_DEDUPE_MS = 15 * 60 * 1000;
const ERROR_MAX_PER_HOUR = 10;

const mode = () => (process.env.NOTIFY_ADMIN || "").toLowerCase();

export function notificationsEnabled() {
  const m = mode();
  if (m === "off") return false;
  if (m === "on" || m === "dry") return true;
  return process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);
}

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const TYPES = {
  user: { label: "Nouvel inscrit", color: "#4ab54a" },
  moderation: { label: "À modérer", color: "#c9a84c" },
  error: { label: "Erreur serveur", color: "#e84020" },
};

let buffer = [];
let timer = null;
const errorSeen = new Map();
let errorSentAt = [];

/**
 * @param {{ type?: "user"|"moderation"|"error", title: string, rows?: Array<[string, any]>, link?: string }} evt
 */
export function notifyAdmin(evt) {
  try {
    if (!notificationsEnabled() || !evt?.title) return;
    if (evt.type === "error" && !errorAllowed(evt.dedupeKey || evt.title)) return;
    buffer.push({ type: "moderation", ...evt, at: new Date() });
    if (!timer) {
      timer = setTimeout(flush, WINDOW_MS);
      timer.unref?.();
    }
  } catch (err) {
    console.error("[notify] échec (ignoré) :", err.message);
  }
}

function errorAllowed(key) {
  const now = Date.now();
  errorSentAt = errorSentAt.filter((t) => now - t < 60 * 60 * 1000);
  if (errorSentAt.length >= ERROR_MAX_PER_HOUR) return false;
  const last = errorSeen.get(key);
  if (last && now - last < ERROR_DEDUPE_MS) return false;
  errorSeen.set(key, now);
  errorSentAt.push(now);
  if (errorSeen.size > 200) errorSeen.clear();
  return true;
}

async function flush() {
  const events = buffer;
  buffer = [];
  timer = null;
  if (!events.length) return;
  try {
    const { subject, html, text } = render(events);
    if (mode() === "dry") {
      console.log(`[notify - dry] À: ${RECIPIENT} | ${subject}\n${text}`);
      return;
    }
    await sendMail({ to: RECIPIENT, subject, html, text });
  } catch (err) {
    console.error("[notify] envoi impossible (ignoré) :", err.message);
  }
}

function render(events) {
  const single = events.length === 1;
  const subject = single
    ? `[Ciné Délices] ${events[0].title}`
    : `[Ciné Délices] ${events.length} notifications (${[...new Set(events.map((e) => TYPES[e.type]?.label || "Info"))].join(", ")})`;

  const blocks = events.map((e) => {
    const t = TYPES[e.type] || TYPES.moderation;
    const rows = (e.rows || [])
      .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
      .map(
        ([k, v]) =>
          `<tr><td style="padding:3px 14px 3px 0;color:#8ab0c8;font-size:12px;white-space:nowrap;vertical-align:top;">${esc(k)}</td><td style="padding:3px 0;color:#e8e8e8;font-size:13px;">${esc(v)}</td></tr>`
      )
      .join("");
    const link = e.link
      ? `<p style="margin:12px 0 0;"><a href="${esc(SITE_URL + e.link)}" style="color:#c9a84c;font-size:13px;text-decoration:none;">Ouvrir dans l'administration &rarr;</a></p>`
      : "";
    return `
      <div style="background:#0d1525;border-left:3px solid ${t.color};border-radius:8px;padding:16px 18px;margin:0 0 14px;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${t.color};font-family:Arial,sans-serif;">${esc(t.label)}</p>
        <p style="margin:0 0 10px;font-size:16px;color:#ffffff;">${esc(e.title)}</p>
        <table cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;">${rows}</table>${link}
      </div>`;
  });

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px 12px;background:#0f1520;font-family:Georgia,serif;">
  <div style="max-width:600px;margin:0 auto;">
    <h1 style="margin:0 0 18px;font-size:20px;font-weight:400;color:#c9a84c;letter-spacing:1px;">Ciné Délices — ${single ? "notification" : events.length + " notifications"}</h1>
    ${blocks.join("")}
    <p style="margin:18px 0 0;font-size:11px;color:#4a5568;font-family:Arial,sans-serif;">Envoyé automatiquement par <a href="${esc(SITE_URL)}" style="color:#c9a84c;text-decoration:none;">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</a>. Administration : <a href="${esc(SITE_URL)}/admin/" style="color:#c9a84c;text-decoration:none;">${esc(SITE_URL)}/admin/</a></p>
  </div>
</body></html>`;

  const text = events
    .map((e) => {
      const rows = (e.rows || []).map(([k, v]) => `  ${k} : ${v ?? ""}`).join("\n");
      return `${(TYPES[e.type]?.label || "Info").toUpperCase()} — ${e.title}\n${rows}${e.link ? `\n  ${SITE_URL}${e.link}` : ""}`;
    })
    .join("\n\n");

  return { subject, html, text };
}

export default { notifyAdmin, notificationsEnabled };
