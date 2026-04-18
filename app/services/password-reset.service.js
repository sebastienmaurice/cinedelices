/**
 * Service de gestion des tokens de réinitialisation de mot de passe.
 *
 * Principes :
 *  - Token brut : 32 octets aléatoires (hex = 64 car.), envoyé à l'utilisateur par email
 *  - Token stocké : uniquement son hash SHA-256 (le token brut ne doit jamais être récupérable)
 *  - Expiration : 30 minutes
 *  - Usage unique : champ used_at marqué lors du reset
 *  - Nouvelle demande → invalidation de tous les tokens précédents de l'utilisateur
 */

import crypto from "crypto";
import { Op } from "sequelize";
import { PasswordReset } from "../models/index.model.js";
import { sendMail } from "./mail.service.js";

const TOKEN_TTL_MIN = 30;

export function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function buildResetUrl(rawToken) {
  const base = (process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/auth/reset-password?token=${rawToken}`;
}

/**
 * Invalide tous les tokens valides précédents d'un utilisateur,
 * puis crée un nouveau token et l'envoie par email.
 */
export async function createAndSendResetToken(user) {
  // Invalider tous les tokens actifs précédents
  await PasswordReset.update(
    { used_at: new Date() },
    {
      where: {
        user_id: user.id,
        used_at: null,
        expires_at: { [Op.gt]: new Date() },
      },
    }
  );

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MIN * 60 * 1000);

  await PasswordReset.create({
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  const resetUrl = buildResetUrl(rawToken);
  const displayName = user.pseudo || user.first_name || "cinéphile gourmand";

  const text = [
    `Bonjour ${displayName},`,
    "",
    "Une demande de réinitialisation de mot de passe a été effectuée sur votre compte Ciné Délices.",
    `Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe (valable ${TOKEN_TTL_MIN} minutes) :`,
    "",
    resetUrl,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre mot de passe ne sera pas modifié.",
    "",
    "— L'équipe Ciné Délices",
  ].join("\n");

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#222;">
      <h2 style="color:#8B1E1E;margin:0 0 16px;">Réinitialisation de mot de passe</h2>
      <p>Bonjour <strong>${escapeHtml(displayName)}</strong>,</p>
      <p>Une demande de réinitialisation de mot de passe a été effectuée sur votre compte <strong>Ciné Délices</strong>.</p>
      <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable <strong>${TOKEN_TTL_MIN} minutes</strong>.</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${resetUrl}" style="background:#8B1E1E;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">
          Choisir un nouveau mot de passe
        </a>
      </p>
      <p style="font-size:0.85rem;color:#555;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
        <span style="word-break:break-all;">${resetUrl}</span>
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:0.8rem;color:#777;">Vous n'avez pas fait cette demande ? Ignorez cet email, votre mot de passe reste inchangé.</p>
      <p style="font-size:0.8rem;color:#777;">— L'équipe Ciné Délices</p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: "Ciné Délices — Réinitialisation de mot de passe",
    text,
    html,
  });

  return { resetUrl, expiresAt };
}

/**
 * Recherche un token actif (non expiré, non utilisé) à partir du token brut.
 * Retourne l'instance PasswordReset ou null.
 */
export async function findActiveToken(rawToken) {
  if (!rawToken || typeof rawToken !== "string") return null;
  const tokenHash = hashToken(rawToken);
  const record = await PasswordReset.findOne({
    where: {
      token_hash: tokenHash,
      used_at: null,
      expires_at: { [Op.gt]: new Date() },
    },
  });
  return record;
}

export async function markTokenUsed(record) {
  record.used_at = new Date();
  await record.save();
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const PASSWORD_RESET_TTL_MIN = TOKEN_TTL_MIN;
