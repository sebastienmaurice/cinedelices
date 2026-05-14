import { Recipe, Movie, User } from "../models/index.model.js";
import { sendMail } from "../services/mail.service.js";

const CONTACT_RECIPIENT = "cinedelices.team@gmail.com";

const contactAboutController = {
  // Page Contact + À propos
  async contactAbout(req, res) {
    const [movieCount, recipeCount, userCount] = await Promise.all([
      Movie.count({ where: { status: "approved" } }),
      Recipe.count({ where: { status: "approved" } }),
      User.count(),
    ]);

    res.render("contact-about", {
      movieCount,
      recipeCount,
      userCount,
    });
  },

  // POST /contact-about/contact — réception du formulaire de contact
  async sendContact(req, res) {
    const { name, email, subject, message, website } = req.body;

    // Honeypot : les bots remplissent ce champ caché, les humains non
    if (website && website.trim() !== "") {
      return res.json({ success: true, message: "Votre message a bien été envoyé. Nous vous répondrons rapidement !" });
    }

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: "Tous les champs obligatoires doivent être remplis." });
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: "Adresse email invalide." });
    }

    try {
      await sendMail({
        to: CONTACT_RECIPIENT,
        subject: `[Ciné Délices] ${subject || "Nouveau message"} — ${name}`,
        html: (() => {
          const categoryColors = {
            "Question générale":        { bg: "#1a2a4a", border: "#4a8ab5", text: "#8ab0d4" },
            "Suggestion / idée":        { bg: "#1a3a1a", border: "#4ab54a", text: "#8ad48a" },
            "Problème technique":       { bg: "#3a1a1a", border: "#b54a4a", text: "#d48a8a" },
            "Idée de recette ou de film":{ bg: "#2a1a3a", border: "#8a4ab5", text: "#c08ad4" },
            "Idée de cadre / contribution":{ bg: "#3a2a1a", border: "#c9a84c", text: "#e8c96a" },
            "Autre":                    { bg: "#1a2030", border: "#556080", text: "#8090b0" },
          };
          const cat = categoryColors[subject] || { bg: "#1a2030", border: "#c9a84c", text: "#c9a84c" };
          const categoryBadge = subject ? `
            <tr><td style="padding:0 40px 20px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background:${cat.bg};border:1px solid ${cat.border};border-radius:20px;padding:5px 14px;">
                  <span style="font-size:12px;font-weight:700;color:${cat.text};font-family:Arial,sans-serif;letter-spacing:1px;">${subject}</span>
                </td>
              </tr></table>
            </td></tr>` : '';
          return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f1520;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1520;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a0e2e,#0f1a2e);border-radius:16px 16px 0 0;padding:36px 40px;text-align:center;border-bottom:2px solid #c9a84c;">
            <img src="https://cinedelices.com/images/Logo/logo-cine-delices-2026-1.png" alt="Ciné Délices" width="130" style="display:block;margin:0 auto 16px;height:auto;" />
            <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:400;letter-spacing:1px;">Nouveau message de contact</h1>
          </td>
        </tr>

        <!-- CATÉGORIE -->
        ${categoryBadge}

        <!-- INFOS EXPÉDITEUR -->
        <tr>
          <td style="background:#141e30;padding:0 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 16px;background:#0d1525;border-radius:8px;border-left:3px solid #c9a84c;">
                  <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c9a84c;font-family:Arial,sans-serif;">De</p>
                  <p style="margin:0;font-size:15px;color:#ffffff;">${name} &mdash; <a href="mailto:${email}" style="color:#c9a84c;text-decoration:none;">${email}</a></p>
                </td>
              </tr>
              <tr><td style="height:12px;"></td></tr>
              <tr>
                <td style="padding:10px 16px;background:#0d1525;border-radius:8px;border-left:3px solid #415a77;">
                  <p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8ab0c8;font-family:Arial,sans-serif;">Sujet</p>
                  <p style="margin:0;font-size:15px;color:#ffffff;">${subject || "Question générale"}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- MESSAGE -->
        <tr>
          <td style="background:#141e30;padding:24px 40px;">
            <p style="margin:0 0 12px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#8ab0c8;font-family:Arial,sans-serif;">Message</p>
            <div style="background:#0d1525;border-radius:8px;padding:20px 22px;border:1px solid rgba(196,160,82,0.15);">
              <p style="margin:0;font-size:15px;line-height:1.7;color:#d4d8e0;">${message.replace(/\n/g, "<br>")}</p>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#0d1525;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid rgba(196,160,82,0.15);">
            <p style="margin:0;font-size:12px;color:#4a5568;font-family:Arial,sans-serif;">
              Envoyé via le formulaire de contact de
              <a href="https://cinedelices.com" style="color:#c9a84c;text-decoration:none;">cinedelices.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
        })(),
        text: `De: ${name} <${email}>\nSujet: ${subject || "Question générale"}\n\n${message}`,
      });
    } catch (err) {
      console.error("[Contact] Erreur envoi email:", err.message);
      // On confirme quand même à l'utilisateur pour ne pas exposer l'erreur
    }

    return res.json({ success: true, message: "Votre message a bien été envoyé. Nous vous répondrons rapidement !" });
  },
};

export default contactAboutController;
