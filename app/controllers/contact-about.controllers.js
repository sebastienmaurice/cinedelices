import { Recipe, Movie, User } from "../models/index.model.js";

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

    // Validation email simple
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(email)) {
      return res.status(400).json({ success: false, message: "Adresse email invalide." });
    }

    // TODO : intégrer un service email (nodemailer, Resend, etc.)
    // Pour l'instant, on log et on confirme
    console.info(`[Contact] De: ${name} <${email}> — Sujet: ${subject || "(aucun)"}\n${message}`);

    return res.json({ success: true, message: "Votre message a bien été envoyé. Nous vous répondrons rapidement !" });
  },
};

export default contactAboutController;
