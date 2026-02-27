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
import searchCache from "../utils/search-cache.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Supprime un fichier statique si il existe (chemin relatif à /public) */
function unlinkIfExists(relativePath) {
  if (!relativePath) return;
  const abs = path.join(__dirname, "../public", relativePath);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

const adminController = {
  // Page principale admin

  // accueil admin

  async admin(req, res) {
    try {
      // Refactoring : utilisation du helper centralisé loadAdminData()
      // Remplace 4 requêtes BDD répétitives + enrichissement par un seul appel
      const {
        recipes,
        movies,
        avis,
        users,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
      } = await loadAdminData();
      const pendingProfilePhotos = users.filter(
        (user) => user.picture && user.picture_status === "pending"
      );
      const pendingBanners = users.filter(
        (user) => user.banner_image && user.banner_status === "pending"
      );

      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        pendingProfilePhotos,
        pendingBanners,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
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
      const {
        recipes,
        movies,
        avis,
        users,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
      } = await loadAdminData();
      const pendingProfilePhotos = users.filter(
        (user) => user.picture && user.picture_status === "pending"
      );

      const recipeId = req.params.id;
      const upRecipe = await Recipe.findByPk(recipeId);

      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        pendingProfilePhotos,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
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
      const {
        recipes,
        movies,
        avis,
        users,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
      } = await loadAdminData();
      const pendingProfilePhotos = users.filter(
        (user) => user.picture && user.picture_status === "pending"
      );
      const movieId = req.params.id;
      const upMovie = await Movie.findByPk(movieId);

      // Enrichir upMovie avec les chemins d'images (cardPath pour la prévisualisation)
      const enrichedUpMovie = upMovie
        ? enrichMovieWithImagePaths(upMovie)
        : null;
      const enrichedMovies = movies;

      res.render("admin-dashboard", {
        recipes,
        movies: enrichedMovies,
        avis,
        users,
        pendingProfilePhotos,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
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
      const updateData = { status: "approved", validated_at: new Date() };

      // Si un fichier a été uploadé lors de la validation, l'ajouter aux données
      // Les images admin sont stockées dans movies/originals/
      if (req.file) {
        updateData.picture = `/images/movies/originals/${req.file.filename}`;
      }

      // Mise à jour en BDD : status → 'approved' + horodatage validated_at
      await Movie.update(updateData, { where: { id: movieId } });
      searchCache.clear();
      res.redirect("/admin?success=movie_validated");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      // Note : utiliser renderServerError au lieu de res.status(500).send() pour cohérence
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation du film"
      );
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
      const movieId = parseInt(req.params.id, 10);

      // Marquer le film comme refusé (status: 'rejected') sans le supprimer
      // L'auteur peut voir son film refusé et soumettre une correction
      await Movie.update({ status: "rejected" }, { where: { id: movieId } });
      searchCache.clear();
      res.redirect("/admin?success=movie_rejected");
    } catch (error) {
      console.error("Erreur lors du refus du film:", error);
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus du film."
      );
    }
  },

  async approveMovieDeletion(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=movie_delete_rejected");
      }

      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        return renderNotFound(res, "Film", req.userRole);
      }

      if (movie.delete_request_status !== "pending") {
        return res.redirect("/admin?success=movie_delete_rejected");
      }

      const recipes = await Recipe.findAll({ where: { id_movie: movieId } });
      const recipeIds = recipes.map((recipe) => recipe.id);
      if (recipeIds.length > 0) {
        recipes.forEach((r) => { unlinkIfExists(r.picture); unlinkIfExists(r.pending_picture); });
        await Notice.destroy({ where: { id_recipe: recipeIds } });
        await UsersRecipes.destroy({ where: { id_recipe: recipeIds } });
        await Recipe.destroy({ where: { id_movie: movieId } });
      }

      unlinkIfExists(movie.picture);
      await Movie.destroy({ where: { id: movieId } });
      searchCache.clear();
      return res.redirect("/admin?success=movie_delete_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la suppression du film."
      );
    }
  },

  async rejectMovieDeletion(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=movie_delete_rejected");
      }

      await Movie.update(
        {
          delete_request_status: "rejected",
          delete_request_by: null,
          delete_request_at: null,
        },
        { where: { id: movieId } }
      );

      return res.redirect("/admin?success=movie_delete_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de suppression."
      );
    }
  },

  async approveMovieEdit(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=movie_edit_rejected");
      }

      const movie = await Movie.findByPk(movieId);
      if (!movie || movie.edit_status !== "pending") {
        return res.redirect("/admin?success=movie_edit_rejected");
      }

      const updateData = {
        edit_status: "none",
        pending_title: null,
        pending_year: null,
        pending_genre: null,
        edit_requested_at: null,
      };

      if (movie.pending_title) updateData.title = movie.pending_title;
      if (movie.pending_year) updateData.year = movie.pending_year;
      if (movie.pending_genre) updateData.genre = movie.pending_genre;

      await Movie.update(updateData, { where: { id: movieId } });
      searchCache.clear();
      return res.redirect("/admin?success=movie_edit_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de modification du film."
      );
    }
  },

  async rejectMovieEdit(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=movie_edit_rejected");
      }

      await Movie.update(
        {
          edit_status: "rejected",
          pending_title: null,
          pending_year: null,
          pending_genre: null,
          edit_requested_at: null,
        },
        { where: { id: movieId } }
      );

      return res.redirect("/admin?success=movie_edit_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de modification du film."
      );
    }
  },

  async approveRecipeEdit(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=recipe_edit_rejected");
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe || recipe.edit_status !== "pending") {
        return res.redirect("/admin?success=recipe_edit_rejected");
      }

      const updateData = {
        edit_status: "none",
        pending_name: null,
        pending_description: null,
        pending_picture: null,
        pending_category: null,
        pending_ingredients: null,
        pending_preparation: null,
        pending_time: null,
        pending_difficulty: null,
        edit_requested_at: null,
      };

      if (recipe.pending_name) updateData.name = recipe.pending_name;
      if (recipe.pending_description)
        updateData.description = recipe.pending_description;
      if (recipe.pending_picture) {
        // Supprimer l'ancienne image active avant de la remplacer
        if (recipe.picture) unlinkIfExists(recipe.picture);
        updateData.picture = recipe.pending_picture;
      }
      if (recipe.pending_category) updateData.category = recipe.pending_category;
      if (recipe.pending_ingredients)
        updateData.ingredients = recipe.pending_ingredients;
      if (recipe.pending_preparation)
        updateData.preparation = recipe.pending_preparation;
      if (recipe.pending_time) updateData.time = recipe.pending_time;
      if (recipe.pending_difficulty)
        updateData.difficulty = recipe.pending_difficulty;

      await Recipe.update(updateData, { where: { id: recipeId } });
      return res.redirect("/admin?success=recipe_edit_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de modification de la recette."
      );
    }
  },

  async rejectRecipeEdit(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=recipe_edit_rejected");
      }

      // Supprimer la pending_picture orpheline si elle existe
      const recipe = await Recipe.findByPk(recipeId, {
        attributes: ["id", "pending_picture"],
      });
      if (recipe && recipe.pending_picture) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const oldPath = path.join(__dirname, "../public", recipe.pending_picture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await Recipe.update(
        {
          edit_status: "rejected",
          pending_name: null,
          pending_description: null,
          pending_picture: null,
          pending_category: null,
          pending_ingredients: null,
          pending_preparation: null,
          pending_time: null,
          pending_difficulty: null,
          edit_requested_at: null,
        },
        { where: { id: recipeId } }
      );

      return res.redirect("/admin?success=recipe_edit_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de modification de la recette."
      );
    }
  },

  async approveNoticeEdit(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      if (!noticeId || Number.isNaN(noticeId)) {
        return res.redirect("/admin?success=notice_edit_rejected");
      }

      const notice = await Notice.findByPk(noticeId);
      if (!notice || notice.edit_status !== "pending") {
        return res.redirect("/admin?success=notice_edit_rejected");
      }

      const updateData = {
        edit_status: "none",
        pending_content: null,
        pending_quote: null,
        edit_requested_at: null,
      };

      if (notice.pending_content) updateData.content = notice.pending_content;
      if (notice.pending_quote) updateData.quote = notice.pending_quote;

      await Notice.update(updateData, { where: { id: noticeId } });
      return res.redirect("/admin?success=notice_edit_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de modification de l'avis."
      );
    }
  },

  async rejectNoticeEdit(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      if (!noticeId || Number.isNaN(noticeId)) {
        return res.redirect("/admin?success=notice_edit_rejected");
      }

      await Notice.update(
        {
          edit_status: "rejected",
          pending_content: null,
          pending_quote: null,
          edit_requested_at: null,
        },
        { where: { id: noticeId } }
      );

      return res.redirect("/admin?success=notice_edit_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de modification de l'avis."
      );
    }
  },

  async approveNoticeDeletion(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      if (!noticeId || Number.isNaN(noticeId)) {
        return res.redirect("/admin?success=notice_delete_rejected");
      }

      const notice = await Notice.findByPk(noticeId);
      if (!notice || notice.delete_request_status !== "pending") {
        return res.redirect("/admin?success=notice_delete_rejected");
      }

      await Notice.destroy({ where: { id: noticeId } });
      return res.redirect("/admin?success=notice_delete_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la suppression de l'avis."
      );
    }
  },

  async rejectNoticeDeletion(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      if (!noticeId || Number.isNaN(noticeId)) {
        return res.redirect("/admin?success=notice_delete_rejected");
      }

      await Notice.update(
        {
          delete_request_status: "rejected",
          delete_request_at: null,
        },
        { where: { id: noticeId } }
      );

      return res.redirect("/admin?success=notice_delete_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de suppression de l'avis."
      );
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

      const { ingredients, preparation } = req.body;
      const updateData = { status: "approved", validated_at: new Date() };

      if (typeof ingredients === "string" && ingredients.trim() !== "") {
        updateData.ingredients = ingredients.trim();
      }
      if (typeof preparation === "string" && preparation.trim() !== "") {
        updateData.preparation = preparation.trim();
      }

      // Mise à jour en BDD : status → 'approved' + horodatage validated_at
      await Recipe.update(updateData, { where: { id: recipeId } });

      res.redirect("/admin?success=recipe_validated");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de la recette"
      );
    }
  },

  async updateRecipeAdmin(req, res) {
    try {
      if (req.userRole !== "admin") {
        return res.status(403).render("error", {
          error: "403",
          message: "Accès interdit.",
          role: req.userRole,
        });
      }

      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=recipe_update_error");
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return renderNotFound(res, "Recette", req.userRole);
      }

      const {
        name,
        category,
        time,
        difficulty,
        description,
        ingredients,
        preparation,
      } = req.body;

      const updateData = {};
      if (name && name.trim()) updateData.name = name.trim();
      if (description && description.trim()) {
        updateData.description = description.trim();
      }
      if (ingredients && ingredients.trim()) {
        updateData.ingredients = ingredients.trim();
      }
      if (preparation && preparation.trim()) {
        updateData.preparation = preparation.trim();
      }

      if (category) {
        const allowedCategories = ["entrée", "plat", "dessert"];
        if (!allowedCategories.includes(category)) {
          return res.redirect("/admin?success=recipe_update_error");
        }
        updateData.category = category;
      }

      if (time) {
        const timeValue = parseInt(time, 10);
        if (Number.isNaN(timeValue) || timeValue < 1) {
          return res.redirect("/admin?success=recipe_update_error");
        }
        updateData.time = timeValue;
      }

      if (difficulty) {
        const allowedDifficulties = ["Facile", "Moyenne", "Difficile"];
        if (!allowedDifficulties.includes(difficulty)) {
          return res.redirect("/admin?success=recipe_update_error");
        }
        updateData.difficulty = difficulty;
      }

      if (Object.keys(updateData).length === 0) {
        return res.redirect("/admin?success=recipe_update_empty");
      }

      await Recipe.update(updateData, { where: { id: recipeId } });
      return res.redirect("/admin?success=recipe_updated");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la mise à jour de la recette."
      );
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

      // Marquer la recette comme refusée (status: 'rejected') sans la supprimer
      await Recipe.update({ status: "rejected" }, { where: { id: recipeId } });

      res.redirect("/admin?success=recipe_rejected");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de la recette"
      );
    }
  },

  //! Supprimer un utilisateur
  async deleteUser(req, res) {
    try {
      const userId = req.params.id;

      // Vérifier si l'utilisateur existe
      const user = await User.findByPk(userId);
      if (!user) {
        return renderNotFound(res, "Utilisateur", req.userRole);
      }

      // Suppression en cascade des données associées (ordre important)
      // 1. Supprimer les avis (notices) de l'utilisateur
      await Notice.destroy({ where: { id_user: userId } });
      // 2. Supprimer les relations utilisateur-recette
      await UsersRecipes.destroy({ where: { id_user: userId } });
      // 3. Enfin, supprimer l'utilisateur lui-même
      await User.destroy({ where: { id: userId } });

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

  async validateUserPhoto(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      await User.update(
        { picture_status: "approved" },
        { where: { id: userId } }
      );
      res.redirect("/admin?success=user_photo_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de la photo."
      );
    }
  },

  async rejectUserPhoto(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      await User.update(
        { picture: null, picture_status: "rejected" },
        { where: { id: userId } }
      );
      res.redirect("/admin?success=user_photo_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de la photo."
      );
    }
  },

  async validateUserBanner(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      await User.update(
        { banner_status: "approved" },
        { where: { id: userId } }
      );
      res.redirect("/admin?success=user_banner_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de la bannière."
      );
    }
  },

  async rejectUserBanner(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      // Supprimer le fichier physique WebP avant de reset la base
      const user = await User.findByPk(userId);
      if (user && user.banner_image) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const oldPath = path.join(__dirname, "../public", user.banner_image);
        fs.unlink(oldPath, () => {});
      }
      await User.update(
        { banner_image: null, banner_status: "rejected" },
        { where: { id: userId } }
      );
      res.redirect("/admin?success=user_banner_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de la bannière."
      );
    }
  },

  async validateNotice(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      await Notice.update({ status: "approved", validated_at: new Date() }, { where: { id: noticeId } });
      res.redirect("/admin?success=notice_validated");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors de la validation de l'avis."
      );
    }
  },

  async rejectNotice(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      // Marquer l'avis comme refusé (status: 'rejected') sans le supprimer
      await Notice.update({ status: "rejected" }, { where: { id: noticeId } });
      res.redirect("/admin?success=notice_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        req.userRole,
        "Erreur lors du refus de l'avis."
      );
    }
  },

  async deleteMovieDirect(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=admin_movie_delete_error");
      }

      const movie = await Movie.findByPk(movieId);
      if (!movie) return res.redirect("/admin?success=admin_movie_delete_error");

      const recipes = await Recipe.findAll({ where: { id_movie: movieId } });
      const recipeIds = recipes.map((recipe) => recipe.id);
      if (recipeIds.length > 0) {
        recipes.forEach((r) => { unlinkIfExists(r.picture); unlinkIfExists(r.pending_picture); });
        await Notice.destroy({ where: { id_recipe: recipeIds } });
        await UsersRecipes.destroy({ where: { id_recipe: recipeIds } });
        await Recipe.destroy({ where: { id_movie: movieId } });
      }

      unlinkIfExists(movie.picture);
      await Movie.destroy({ where: { id: movieId } });
      searchCache.clear();
      return res.redirect("/admin?success=admin_movie_deleted");
    } catch (error) {
      return res.redirect("/admin?success=admin_movie_delete_error");
    }
  },

  async deleteRecipeDirect(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=admin_recipe_delete_error");
      }

      const recipe = await Recipe.findByPk(recipeId, { attributes: ["id", "picture", "pending_picture"] });
      if (recipe) {
        unlinkIfExists(recipe.picture);
        unlinkIfExists(recipe.pending_picture);
      }

      await Notice.destroy({ where: { id_recipe: recipeId } });
      await UsersRecipes.destroy({ where: { id_recipe: recipeId } });
      await Recipe.destroy({ where: { id: recipeId } });

      return res.redirect("/admin?success=admin_recipe_deleted");
    } catch (error) {
      return res.redirect("/admin?success=admin_recipe_delete_error");
    }
  },

  async deleteNoticeDirect(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      if (!noticeId || Number.isNaN(noticeId)) {
        return res.redirect("/admin?success=admin_notice_delete_error");
      }

      await Notice.destroy({ where: { id: noticeId } });
      return res.redirect("/admin?success=admin_notice_deleted");
    } catch (error) {
      return res.redirect("/admin?success=admin_notice_delete_error");
    }
  },

  async updateMovieDirect(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=admin_movie_update_error");
      }

      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        return res.redirect("/admin?success=admin_movie_update_error");
      }

      const { title, year, genre, synopsis } = req.body;
      const updateData = {};

      if (title) updateData.title = title.trim();
      if (year) {
        const yearValue = parseInt(year, 10);
        const maxYear = new Date().getFullYear() + 5;
        if (Number.isNaN(yearValue) || yearValue < 1888 || yearValue > maxYear) {
          return res.redirect("/admin?success=admin_movie_update_error");
        }
        updateData.year = yearValue;
      }

      if (genre) {
        const allowedGenres = [
          "action",
          "animation",
          "aventure",
          "comédie",
          "documentaire",
          "drame",
          "famille",
          "fantastique",
          "guerre",
          "historique",
          "horreur",
          "musical",
          "policier",
          "romance",
          "science-fiction",
          "thriller",
          "téléfilm",
          "western",
        ];
        const normalizedGenre = genre.trim().toLowerCase();
        if (!allowedGenres.includes(normalizedGenre)) {
          return res.redirect("/admin?success=admin_movie_update_error");
        }
        updateData.genre = normalizedGenre;
      }

      // Synopsis : accepter aussi une chaîne vide (suppression du synopsis)
      if (synopsis !== undefined) {
        const trimmedSynopsis = synopsis.trim();
        updateData.synopsis = trimmedSynopsis.length > 0 ? trimmedSynopsis.substring(0, 1000) : null;
      }

      // Photo uploadée par l'admin — supprime l'ancienne si elle existe
      if (req.file) {
        if (movie.picture) {
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const oldPath = path.join(__dirname, "../public", movie.picture);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        updateData.picture = `/images/movies/originals/${req.file.filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        return res.redirect("/admin?success=admin_movie_update_error");
      }

      await Movie.update(updateData, { where: { id: movieId } });
      searchCache.clear();
      return res.redirect("/admin?success=admin_movie_updated");
    } catch (error) {
      return res.redirect("/admin?success=admin_movie_update_error");
    }
  },

  async updateRecipeDirect(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=admin_recipe_update_error");
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return res.redirect("/admin?success=admin_recipe_update_error");
      }

      const {
        name,
        description,
        category,
        time,
        difficulty,
        ingredients,
        preparation,
      } = req.body;
      const updateData = {};

      if (name) updateData.name = name.trim();
      if (description) updateData.description = description.trim();
      if (category) updateData.category = category.trim();
      if (time) {
        const timeValue = parseInt(time, 10);
        if (Number.isNaN(timeValue) || timeValue < 1) {
          return res.redirect("/admin?success=admin_recipe_update_error");
        }
        updateData.time = timeValue;
      }
      if (difficulty) updateData.difficulty = difficulty.trim();
      if (ingredients) updateData.ingredients = ingredients.trim();
      if (preparation) updateData.preparation = preparation.trim();

      // Photo uploadée par l'admin — supprime l'ancienne si elle existe
      if (req.file) {
        if (recipe.picture) {
          const __dirname = path.dirname(fileURLToPath(import.meta.url));
          const oldPath = path.join(__dirname, "../public", recipe.picture);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        updateData.picture = `/images/recipes/${req.file.filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        return res.redirect("/admin?success=admin_recipe_update_error");
      }

      await Recipe.update(updateData, { where: { id: recipeId } });
      return res.redirect("/admin?success=admin_recipe_updated");
    } catch (error) {
      return res.redirect("/admin?success=admin_recipe_update_error");
    }
  },

  async updateNoticeDirect(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      if (!noticeId || Number.isNaN(noticeId)) {
        return res.redirect("/admin?success=admin_notice_update_error");
      }

      const notice = await Notice.findByPk(noticeId);
      if (!notice) {
        return res.redirect("/admin?success=admin_notice_update_error");
      }

      const { content, quote } = req.body;
      const updateData = {};

      if (content) updateData.content = content.trim();
      if (quote) {
        const quoteValue = parseInt(quote, 10);
        if (Number.isNaN(quoteValue) || quoteValue < 1 || quoteValue > 5) {
          return res.redirect("/admin?success=admin_notice_update_error");
        }
        updateData.quote = quoteValue;
      }

      if (Object.keys(updateData).length === 0) {
        return res.redirect("/admin?success=admin_notice_update_error");
      }

      await Notice.update(updateData, { where: { id: noticeId } });
      return res.redirect("/admin?success=admin_notice_updated");
    } catch (error) {
      return res.redirect("/admin?success=admin_notice_update_error");
    }
  },
};

export default adminController;
