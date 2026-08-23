import { User, Recipe, Movie, Notice, RecipePicture } from "../models/index.model.js";
import { getUserGamificationData } from "../services/gamification.service.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

const contributionsController = {
  /**
   * GET /contributions/
   * Nouvel espace dédié à « ce que l'utilisateur apporte à Ciné Délices ».
   * Reprend telles quelles les requêtes déjà utilisées par l'onglet
   * #creations du profil (auth.controller.js) — aucune nouvelle logique
   * métier, uniquement une nouvelle présentation dédiée. Le flux d'activité
   * réutilise gamification.service.js (même source que le CinéPass), pour
   * ne jamais avoir deux calculs différents de la même donnée.
   */
  async contributionsPage(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user) return renderNotFound(res, "Utilisateur");

      const userRecipes = await Recipe.findAll({
        where: { id_user: userId },
        include: [
          { model: Movie, attributes: ["id", "title"] },
          { model: RecipePicture, as: "RecipePictures", attributes: ["file_path", "position"] },
        ],
        order: [["id", "DESC"]],
      });

      const userMoviesRaw = await Movie.findAll({
        where: { id_user: userId },
        order: [["id", "DESC"]],
      });
      const userMovies = enrichMoviesWithImagePaths(userMoviesRaw);

      const userNotices = await Notice.findAll({
        where: { id_user: userId },
        include: [
          {
            model: Recipe,
            attributes: ["id", "name"],
            include: [{ model: Movie, attributes: ["id", "title"] }],
          },
        ],
        order: [["id", "DESC"]],
      });

      // Même service que le CinéPass — un seul calcul d'activité dans tout le site.
      const gamif = await getUserGamificationData(userId, {
        recipes: userRecipes,
        movies: userMovies,
        notices: userNotices,
        userRole: req.userRole,
      });

      const stats = {
        recipesTotal: userRecipes.length,
        recipesApproved: userRecipes.filter((r) => r.status === "approved").length,
        recipesPending: userRecipes.filter((r) => r.status === "pending").length,
        recipesRejected: userRecipes.filter((r) => r.status === "rejected").length,
        moviesTotal: userMovies.length,
        moviesApproved: userMovies.filter((m) => m.status === "approved").length,
        noticesTotal: userNotices.length,
        noticesApproved: userNotices.filter((n) => n.status === "approved").length,
      };
      stats.contributionsValidated = stats.recipesApproved + stats.moviesApproved + stats.noticesApproved;

      res.render("contributions", {
        user,
        userRecipes,
        userMovies,
        userNotices,
        stats,
        activity: gamif.activity,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
};

export default contributionsController;
