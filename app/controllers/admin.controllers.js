import {
  Recipe,
  Movie,
  Notice,
  User,
  UsersRecipes,
} from "../models/index.model.js";
import {
  enrichMovieWithImagePaths,
  enrichMoviesWithImagePaths,
} from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { loadAdminData } from "../utils/admin-data-loader.js";

const adminController = {
  // Page principale admin

  // accueil admin

  async admin(req, res) {
    try {
      // Refactoring : utilisation du helper centralisé loadAdminData()
      // Remplace 4 requêtes BDD répétitives + enrichissement par un seul appel
      const { recipes, movies, avis, users } = await loadAdminData();

      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        success: req.query.success,
        role: req.userRole,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
    }
  },

  // Page validation recette admin

  async editRecipe(req, res) {
    try {
      // Refactoring : utilisation du helper centralisé loadAdminData()
      const { recipes, movies, avis, users } = await loadAdminData();

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
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
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

      // Enrichir upMovie avec les chemins d'images (cardPath pour la prévisualisation)
      const enrichedUpMovie = upMovie
        ? enrichMovieWithImagePaths(upMovie)
        : null;
      const enrichedMovies = enrichMoviesWithImagePaths(movies);

      res.render("admin-dashboard", {
        recipes,
        movies: enrichedMovies,
        avis,
        users,
        upMovie: enrichedUpMovie,
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

  /**
   * Valide un film (passe status à true et optionnellement met à jour l'image)
   * POST /admin/validateMovie/:id
   *
   * Processus :
   * 1. Récupère l'ID du film depuis l'URL
   * 2. Prépare les données de mise à jour (status: true + image si uploadée)
   * 3. Met à jour le film en BDD
   * 4. Redirige vers le dashboard admin avec message de succès
   */
  async validateMovie(req, res) {
    try {
      const movieId = parseInt(req.params.id);

      // Préparer les données à mettre à jour
      const updateData = { status: true };

      // Si un fichier a été uploadé lors de la validation, l'ajouter aux données
      // Les images admin sont stockées dans movies/originals/
      if (req.file) {
        updateData.picture = `/images/movies/originals/${req.file.filename}`;
      }

      // Mise à jour en BDD : passe le status à true (et l'image si fournie)
      // Équivalent SQL : UPDATE movies SET status = true, picture = ? WHERE id = ?
      await Movie.update(updateData, { where: { id: movieId } });

      res.redirect("/admin?success=movie_validated");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      // Note : utiliser renderServerError au lieu de res.status(500).send() pour cohérence
      return renderServerError(res, error, req.userRole, "Erreur lors de la validation du film");
    }
  },

  /**
   * Refuse un film (suppression de la base de données)
   * POST /admin/rejectMovie/:id
   *
   * Processus :
   * 1. Récupère l'ID du film depuis l'URL
   * 2. Supprime le film de la BDD
   * 3. Redirige vers le dashboard admin avec message de succès
   */
  async rejectMovie(req, res) {
    try {
      const movieId = parseInt(req.params.id);

      // Suppression du film en BDD
      // Équivalent SQL : DELETE FROM movies WHERE id = ?
      await Movie.destroy({ where: { id: movieId } });

      res.redirect("/admin?success=movie_rejected");
    } catch (error) {
      console.error("Erreur lors du refus du film:", error);
      res.status(500).send("Erreur lors du refus du film");
    }
  },

  /**
   * Valide une recette (passe status à true)
   * POST /admin/validateRecipe/:id
   *
   * Processus :
   * 1. Récupère l'ID de la recette depuis l'URL
   * 2. Met à jour le status à true en BDD
   * 3. Redirige vers le dashboard admin avec message de succès
   */
  async validateRecipe(req, res) {
    try {
      const recipeId = parseInt(req.params.id);

      // Mise à jour en BDD : passe le status à true (validé)
      // Équivalent SQL : UPDATE recipes SET status = true WHERE id = ?
      await Recipe.update({ status: true }, { where: { id: recipeId } });

      res.redirect("/admin?success=recipe_validated");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(res, error, req.userRole, "Erreur lors de la validation de la recette");
    }
  },

  /**
   * Refuse une recette (suppression de la base de données)
   * POST /admin/rejectRecipe/:id
   *
   * Processus :
   * 1. Récupère l'ID de la recette depuis l'URL
   * 2. Supprime la recette de la BDD
   * 3. Redirige vers le dashboard admin avec message de succès
   */
  async rejectRecipe(req, res) {
    try {
      const recipeId = parseInt(req.params.id);

      // Suppression de la recette en BDD
      // Équivalent SQL : DELETE FROM recipes WHERE id = ?
      await Recipe.destroy({ where: { id: recipeId } });

      res.redirect("/admin?success=recipe_rejected");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(res, error, req.userRole, "Erreur lors du refus de la recette");
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
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la suppression de l'utilisateur."
      );
    }
  },
};

export default adminController;
