/**
 * Service d'envoi d'email.
 *
 * Mode dev/preview (actuel) :
 *   - Génère un compte Ethereal à la volée (https://ethereal.email)
 *   - L'email est capturé côté Ethereal, jamais livré
 *   - Le lien de prévisualisation est logué en console
 *
 * Mode prod (futur) :
 *   - Définir SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
 *     dans le .env : un vrai transporteur SMTP sera utilisé à la place.
 */

import nodemailer from "nodemailer";

let cachedTransporter = null;
let cachedFrom = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    cachedFrom = SMTP_FROM || `Ciné Délices <${SMTP_USER}>`;
    return cachedTransporter;
  }

  // Mode dev : Ethereal (boîte de test, liens prévisualisables)
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
  cachedFrom = `Ciné Délices (dev) <${testAccount.user}>`;
  console.log(
    "[mail] Mode dev Ethereal activé — compte de test:",
    testAccount.user
  );
  return cachedTransporter;
}

export async function sendMail({ to, subject, html, text }) {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({
    from: cachedFrom,
    to,
    subject,
    html,
    text,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log(`[mail] Prévisualisation (${subject}) → ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview || null };
}

export default { sendMail };
