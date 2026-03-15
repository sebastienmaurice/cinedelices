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
};

export default contactAboutController;
