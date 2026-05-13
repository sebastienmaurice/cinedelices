/**
 * Service d'envoi d'email via Resend.
 *
 * Mode prod : RESEND_API_KEY défini → emails envoyés via Resend
 * Mode dev  : RESEND_API_KEY absent → email loggé en console uniquement
 */

import { Resend } from "resend";

const FROM_ADDRESS = process.env.SMTP_FROM || "Ciné Délices <no-reply@cinedelices.com>";

export async function sendMail({ to, subject, html, text }) {
  // Mode dev — pas de clé API → log en console
  if (!process.env.RESEND_API_KEY) {
    console.log(`[mail - dev] À: ${to} | Sujet: ${subject}`);
    console.log(`[mail - dev] Contenu: ${text || html}`);
    return { messageId: "dev-mode", previewUrl: null };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  return { messageId: data.id, previewUrl: null };
}

export default { sendMail };
