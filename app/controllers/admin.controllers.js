import {
  Recipe,
  Movie,
  Notice,
  User,
  UsersRecipes,
} from "../models/index.model.js";
import { logUpload, logUploadError } from "../utils/logger.js";
import { IMAGE_TYPES } from "../utils/image-utils.js";

const adminController = {
  // Page principale admin

  // accueil admin

  async admin(req, res) {
    try {
      const recipes = await Recipe.findAll({
        where: { status: false },
      });
      const movies = await Movie.findAll({
        where: { status: false },
      });
      const avis = await Notice.findAll();
      const users = await User.findAll();

      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        success: req.query.success,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  // Page validation recette admin

  async editRecipe(req, res) {
    try {
      const recipes = await Recipe.findAll({
        where: { status: false },
      });
      const movies = await Movie.findAll({
        where: { status: false },
      });
      const avis = await Notice.findAll();
      const users = await User.findAll();
      const recipeId = req.params.id;
      const upRecipe = await Recipe.findByPk(recipeId);
      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        upRecipe,
        success: req.query.success,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  // Page validation film admin

  async editMovie(req, res) {
    try {
      const recipes = await Recipe.findAll({
        where: { status: false },
      });
      const movies = await Movie.findAll({
        where: { status: false },
      });
      const avis = await Notice.findAll();
      const users = await User.findAll();
      const movieId = req.params.id;
      const upMovie = await Movie.findByPk(movieId);
      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        upMovie,
        success: req.query.success,
        role: req.userRole,
      });
    } catch (error) {
      console.error(error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  // passage du film de false a true

  async validateMovie(req, res) {
    // Déclare une méthode asynchrone qui reçoit la requête (req) et la réponse (res)

    try {
      const movieId = parseInt(req.params.id);
      // 👆 Récupère l'ID du film depuis l'URL (/admin/validateMovie/5)
      // parseInt() convertit le texte "5" en nombre 5

      // Préparer les données à mettre à jour
      const updateData = { status: true };

      // Si un fichier a été uploadé
      if (req.file) {
        // Construire le chemin relatif de l'image pour la BDD
        updateData.picture = `/images/movies/cards/${req.file.filename}`;

        // Journaliser l'upload d'image
        try {
          await logUpload({
            type: IMAGE_TYPES.MOVIE_CARD,
            filename: req.file.filename,
            originalName: req.file.originalname,
            destination: req.file.destination,
            size: req.file.size,
            mimetype: req.file.mimetype,
            entityId: movieId,
          });
        } catch (logError) {
          // Ne pas bloquer si la journalisation échoue
          console.error("Erreur lors de la journalisation:", logError);
        }
      }

      await Movie.update(
        //Appelle la méthode update() de Sequelize

        updateData,
        // Met à jour le status ET l'image si elle existe

        { where: { id: movieId } }
        // QUEL film modifier : celui qui a cet ID
        // Équivalent SQL : UPDATE movies SET status = true WHERE id
      );

      res.redirect("/admin?success=movie_validated");
    } catch (error) {
      // Journaliser l'erreur
      await logUploadError(error, {
        type: IMAGE_TYPES.MOVIE_CARD,
        entityId: req.params.id ? parseInt(req.params.id) : null,
        action: "validateMovie",
      });
      console.error("Erreur lors de la validation du film:", error);
      res.status(500).send("Erreur lors de la validation du film");
    }
  },

  // Refuser un film (le supprime)
  async rejectMovie(req, res) {
    try {
      const movieId = parseInt(req.params.id);
      //Récupère l'ID du film à supprimer depuis l'URL

      await Movie.destroy({
        // 👆 Appelle la méthode destroy() de Sequelize = SUPPRIMER
        where: { id: movieId },
        // 👆 QUEL film supprimer : celui avec cet ID
        // Équivalent SQL : DELETE FROM movies WHERE id
      });

      res.redirect("/admin?success=movie_rejected");
    } catch (error) {
      console.error("Erreur lors du refus du film:", error);
      res.status(500).send("Erreur lors du refus du film");
    }
  },

  // passage de la recette de false a true

  async validateRecipe(req, res) {
    // Déclare une méthode asynchrone qui reçoit la requête (req) et la réponse (res)

    try {
      const recipeId = parseInt(req.params.id);
      // 👆 ===Récupère l'ID de la recette depuis l'URL (/admin/validateRecipe/5)
      // parseInt() convertit le texte "5" en nombre 5

      await Recipe.update(
        //Appelle la méthode update() de Sequelize

        { status: true },
        //met le champ "status" à true (validé)

        { where: { id: recipeId } }
        // quelle recette, modifier : celle qui a cet ID
        // Équivalent SQL : UPDATE Recipes SET status = true WHERE id
      );

      res.redirect("/admin?success=recipe_validated");
    } catch (error) {
      console.error("Erreur lors de la validation de la recette:", error);
      res.status(500).send("Erreur lors de la validation de la recette");
    }
  },

  // Refuser une recette (la supprime)
  async rejectRecipe(req, res) {
    try {
      const recipeId = parseInt(req.params.id);
      //Récupère l'ID de la recette à supprimer depuis l'URL

      await Recipe.destroy({
        // Appelle la méthode destroy() de Sequelize = SUPPRIMER
        where: { id: recipeId },
        // quelle recette, supprimer : celle avec cet ID
        // Équivalent SQL : DELETE FROM Recipes WHERE id
      });

      res.redirect("/admin?success=recipe_rejected");
    } catch (error) {
      console.error("Erreur lors du refus de la recette:", error);
      res.status(500).send("Erreur lors du refus de la recette");
    }
  },

  //! Supprimer un utilisateur
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Vérifier si l'utilisateur existe
      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(404).render("error", {
          error: "404",
          message: "Utilisateur introuvable.",
          role: req.userRole,
        });
      }

      // Supprimer d'abord les notices (avis) associées à cet utilisateur
      // Supprimer les entrées dans la table de jonction UsersRecipes
      await Notice.destroy({ where: { id_user: userId } });
      await UsersRecipes.destroy({ where: { id_user: userId } });

      // Ensuite, supprimer l'utilisateur
      await User.destroy({ where: { id: userId } });

      // Rediriger vers le tableau de bord admin avec un message de succès
      res.redirect("/admin?success=user_deleted");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      res.status(500).render("error", {
        error: "500",
        message: "Erreur lors de la suppression de l'utilisateur.",
        role: req.userRole,
      });
    }
  },
};

export default adminController;
