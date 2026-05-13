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
    const { name, email, subject, message } = req.body;

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
        subject: `[Ciné Délices] Contact — ${subject || "Sans sujet"}`,
        html: `
          <h2>Nouveau message de contact</h2>
          <p><strong>De :</strong> ${name} &lt;${email}&gt;</p>
          <p><strong>Sujet :</strong> ${subject || "(aucun)"}</p>
          <hr>
          <p>${message.replace(/\n/g, "<br>")}</p>
          <hr>
          <small>Envoyé depuis le formulaire de contact de cinedelices.com</small>
        `,
        text: `De: ${name} <${email}>\nSujet: ${subject || "(aucun)"}\n\n${message}`,
      });
    } catch (err) {
      console.error("[Contact] Erreur envoi email:", err.message);
      // On confirme quand même à l'utilisateur pour ne pas exposer l'erreur
    }

    return res.json({ success: true, message: "Votre message a bien été envoyé. Nous vous répondrons rapidement !" });
  },
};

export default contactAboutController;
