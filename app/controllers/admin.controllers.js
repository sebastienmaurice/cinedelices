import {
  Recipe,
  Movie,
  Notice,
  User,
  UsersRecipes,
  RecipePicture,
  Favorite,
  Rating,
  UserPoints,
} from "../models/index.model.js";
import * as argon2 from "argon2";
import { Op } from "sequelize";
import sequelize from "../database/sequelize-client.js";
import {
  enrichMovieWithImagePaths,
  enrichMoviesWithImagePaths,
} from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { clearNavCache } from "../middlewares/inject-locals.middleware.js";
import { loadAdminData } from "../utils/admin-data-loader.js";
import { logAdminAction } from "../utils/admin-logger.js";
import { awardActionXP, checkFirstRecipeMonth } from "../services/gamification.service.js";
import searchCache from "../utils/search-cache.js";
import { invalidatePublicMovieIdsCache } from "../utils/movie-visibility-helper.js";
import { downloadTmdbPoster } from "../utils/tmdb-image-downloader.js";
import { deleteAsset, uploadToCloudinary, uploadBufferToCloudinary } from "../utils/asset-manager.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        pendingRecipeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
        pendingRecipePictures,
        pendingRecipePicturesCount,
      } = await loadAdminData();
      const pendingProfilePhotos = users.filter(
        (user) => user.pending_picture && user.picture_status === "pending"
      );
      const pendingBanners = users.filter(
        (user) => user.pending_banner_image && user.banner_status === "pending"
      );
      const pendingBios = users.filter(
        (user) => user.pending_bio && user.bio_status === "pending"
      );

      res.render("admin-dashboard", {
        recipes,
        movies,
        avis,
        users,
        pendingProfilePhotos,
        pendingBanners,
        pendingBios,
        pendingMovieDeleteRequests,
        pendingMovieEdits,
        pendingRecipeEdits,
        pendingNoticeEdits,
        pendingNoticeDeleteRequests,
        pendingRecipeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
        pendingRecipePictures,
        pendingRecipePicturesCount,
        success: req.query.success,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
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
        pendingRecipeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
      } = await loadAdminData();
      const pendingProfilePhotos = users.filter(
        (user) => user.pending_picture && user.picture_status === "pending"
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
        pendingRecipeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
        upRecipe,
        success: req.query.success,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
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
        pendingRecipeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
      } = await loadAdminData();
      const pendingProfilePhotos = users.filter(
        (user) => user.pending_picture && user.picture_status === "pending"
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
        pendingRecipeDeleteRequests,
        validatedMovies,
        validatedRecipes,
        validatedNotices,
        upMovie: enrichedUpMovie,
        success: req.query.success,
      });
    } catch (error) {
      return renderServerError(res, error);
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

      // Préparer les données à mettre à jour : status seulement
      // L'affiche est désormais téléchargée automatiquement depuis TMDB à la création du film
      const updateData = { status: "approved", validated_at: new Date() };

      // Mise à jour en BDD : status → 'approved' + horodatage validated_at
      const movie = await Movie.findByPk(movieId, { attributes: ["id", "id_user"] });
      await Movie.update(updateData, { where: { id: movieId } });
      searchCache.clear();

      // XP bonus au contributeur pour film validé
      if (movie?.id_user) {
        awardActionXP(movie.id_user, "user", "movie_accepted").catch(() => {});
      }

      res.redirect("/admin?success=movie_validated");
    } catch (error) {
      return renderServerError(
        res,
        error,
        "Erreur lors de la validation du film"
      );
    }
  },

  /**
   * POST /admin/migrate-movie-images
   *
   * Migration unique : remplace les images locales existantes des films ayant un tmdb_id
   * par l'affiche officielle téléchargée depuis TMDB.
   * Supprime les anciennes images locales après remplacement.
   * Retourne un rapport JSON { updated, failed, skipped }.
   *
   * Usage : appel manuel une seule fois depuis l'interface admin ou Postman.
   */
  async migrateMovieImages(req, res) {
    try {
      const movies = await Movie.findAll({
        where: { tmdb_id: { [Op.not]: null } },
        attributes: ["id", "title", "tmdb_id", "type", "picture"],
      });

      const results = { updated: [], failed: [], skipped: [] };

      for (const movie of movies) {
        const newPath = await downloadTmdbPoster(
          movie.tmdb_id,
          movie.type,
          movie.title
        );

        if (!newPath) {
          results.failed.push({ id: movie.id, title: movie.title });
          continue;
        }

        // Supprimer l'ancienne image locale si elle est différente de la nouvelle
        if (movie.picture && movie.picture !== newPath) {
          await deleteAsset(movie.picture);
        }

        await movie.update({ picture: newPath });
        results.updated.push({ id: movie.id, title: movie.title, path: newPath });
      }

      searchCache.clear();
      return res.json({
        success: true,
        total: movies.length,
        ...results,
      });
    } catch (error) {
      return renderServerError(res, error, "Erreur migration images TMDB");
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
        return renderNotFound(res, "Film");
      }

      if (movie.delete_request_status !== "pending") {
        return res.redirect("/admin?success=movie_delete_rejected");
      }

      const recipes = await Recipe.findAll({
        where: { id_movie: movieId },
        attributes: ["id", "picture", "pending_picture"],
      });
      const recipeIds = recipes.map((r) => r.id);

      await sequelize.transaction(async (t) => {
        const opts = { transaction: t };
        if (recipeIds.length > 0) {
          await Notice.destroy({ where: { id_recipe: recipeIds }, ...opts });
          await UsersRecipes.destroy({ where: { id_recipe: recipeIds }, ...opts });
          await RecipePicture.destroy({ where: { recipe_id: recipeIds }, ...opts });
          await Recipe.destroy({ where: { id_movie: movieId }, ...opts });
        }
        await Movie.destroy({ where: { id: movieId }, ...opts });
      });

      // Suppression des fichiers après la transaction
      for (const r of recipes) {
        await deleteAsset(r.picture);
        await deleteAsset(r.pending_picture);
      }
      await deleteAsset(movie.picture);

      searchCache.clear();
      return res.redirect("/admin?success=movie_delete_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
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
        edit_status: "approved",
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
        if (recipe.picture) await deleteAsset(recipe.picture);
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
        await deleteAsset(recipe.pending_picture);
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
        "Erreur lors du refus de modification de la recette."
      );
    }
  },

  async approveRecipeDelete(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=recipe_delete_rejected");
      }

      const recipe = await Recipe.findByPk(recipeId, {
        attributes: ["id", "picture", "pending_picture", "delete_request_status"],
        include: [{ model: RecipePicture, as: "RecipePictures", attributes: ["file_path"] }],
      });
      if (!recipe || recipe.delete_request_status !== "pending") {
        return res.redirect("/admin?success=recipe_delete_rejected");
      }

      await deleteAsset(recipe.picture);
      await deleteAsset(recipe.pending_picture);
      for (const pic of (recipe.RecipePictures || [])) { await deleteAsset(pic.file_path); }
      await Notice.destroy({ where: { id_recipe: recipeId } });
      await UsersRecipes.destroy({ where: { id_recipe: recipeId } });
      await Recipe.destroy({ where: { id: recipeId } });
      searchCache.clear();
      return res.redirect("/admin?success=recipe_delete_approved");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de la suppression de la recette.");
    }
  },

  async rejectRecipeDelete(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=recipe_delete_rejected");
      }

      await Recipe.update(
        { delete_request_status: "none", delete_request_at: null },
        { where: { id: recipeId } }
      );
      return res.redirect("/admin?success=recipe_delete_rejected");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors du refus de suppression de la recette.");
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
      const recipe = await Recipe.findByPk(recipeId, { attributes: ["id", "id_user"] });
      await Recipe.update(updateData, { where: { id: recipeId } });

      // XP bonus au contributeur pour recette validée
      if (recipe?.id_user) {
        awardActionXP(recipe.id_user, "user", "recipe_published").catch(() => {});
        checkFirstRecipeMonth(recipe.id_user).catch(() => {});
      }

      invalidatePublicMovieIdsCache(); // une recette approuvée peut rendre son film public
      logAdminAction({ adminId: req.userId, action: "approve_recipe", targetType: "recipe", targetId: recipeId });
      res.redirect("/admin?success=recipe_validated");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(
        res,
        error,
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
          });
      }

      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        return res.redirect("/admin?success=recipe_update_error");
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return renderNotFound(res, "Recette");
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

      // Charger la recette avec ses images pour nettoyage disque
      const recipe = await Recipe.findByPk(recipeId, {
        attributes: ["id", "picture", "pending_picture"],
        include: [{ model: RecipePicture, as: "RecipePictures", attributes: ["id", "file_path"] }],
      });

      if (!recipe) {
        return res.redirect("/admin?success=recipe_not_found");
      }

      // Supprimer les fichiers images du disque (erreurs non bloquantes)
      try { await deleteAsset(recipe.picture); } catch (err) {
        console.error(`[rejectRecipe] Erreur suppression image principale (${recipe.picture}):`, err.message);
      }
      try { await deleteAsset(recipe.pending_picture); } catch (err) {
        console.error(`[rejectRecipe] Erreur suppression image pending (${recipe.pending_picture}):`, err.message);
      }
      for (const pic of (recipe.RecipePictures || [])) {
        try { await deleteAsset(pic.file_path); } catch (err) {
          console.error(`[rejectRecipe] Erreur suppression image secondaire (${pic.file_path}):`, err.message);
        }
      }

      // Supprimer les enregistrements RecipePicture en BDD
      await RecipePicture.destroy({ where: { recipe_id: recipeId } });

      // Marquer la recette comme refusée et vider les chemins images
      await Recipe.update(
        { status: "rejected", picture: null, pending_picture: null },
        { where: { id: recipeId } },
      );

      invalidatePublicMovieIdsCache(); // une recette rejetée peut retirer son film de la liste publique
      logAdminAction({ adminId: req.userId, action: "reject_recipe", targetType: "recipe", targetId: recipeId });
      res.redirect("/admin?success=recipe_rejected");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors du refus de la recette");
    }
  },

  /**
   * POST /admin/recipe-pictures/:pictureId/delete
   * Supprime une photo complémentaire individuelle (position >= 2) sans rejeter toute la recette.
   * Utilisé quand une photo 2 ou 3 contient du contenu non approprié.
   */
  async deleteRecipePicture(req, res) {
    try {
      const pictureId = parseInt(req.params.pictureId, 10);

      const pic = await RecipePicture.findByPk(pictureId);
      if (!pic) return res.redirect("/admin?success=recipe_picture_not_found");

      // Sécurité : on ne peut supprimer que les photos complémentaires (position >= 2)
      // La photo principale (position 1) est gérée via le flux recette complet
      if (pic.position < 2) return res.redirect("/admin?success=recipe_picture_protected");

      await deleteAsset(pic.file_path);
      await RecipePicture.destroy({ where: { id: pictureId } });

      res.redirect("/admin?success=recipe_picture_deleted");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de la suppression de la photo.");
    }
  },

  //! Supprimer un utilisateur
  async deleteUser(req, res) {
    if (req.userRole !== "superadmin" && req.userRole !== "super_admin") {
      return res.status(403).json({ error: "Permission insuffisante" });
    }
    try {
      const userId = req.params.id;

      // Vérifier si l'utilisateur existe
      const user = await User.findByPk(userId);
      if (!user) {
        return renderNotFound(res, "Utilisateur");
      }
      if (user.role === "superadmin" || user.role === "super_admin") {
        return res.status(403).json({ error: "Impossible de supprimer un super administrateur." });
      }

      // Suppression en cascade complète dans une transaction (atomique)
      const userRecipes = await Recipe.findAll({
        where: { id_user: userId },
        attributes: ['id', 'picture', 'pending_picture'],
        include: [{ model: RecipePicture, as: "RecipePictures", attributes: ["file_path"] }],
      });

      await sequelize.transaction(async (t) => {
        const opts = { transaction: t };
        const recipeIds = userRecipes.map(r => r.id);

        await Favorite.destroy({ where: { id_user: userId }, ...opts });
        await Rating.destroy({ where: { id_user: userId }, ...opts });
        await UserPoints.destroy({ where: { id_user: userId }, ...opts });
        await Notice.destroy({ where: { id_user: userId }, ...opts });
        await UsersRecipes.destroy({ where: { id_user: userId }, ...opts });

        if (recipeIds.length > 0) {
          await Notice.destroy({ where: { id_recipe: recipeIds }, ...opts });
          await UsersRecipes.destroy({ where: { id_recipe: recipeIds }, ...opts });
          await RecipePicture.destroy({ where: { recipe_id: recipeIds }, ...opts });
          await Recipe.destroy({ where: { id_user: userId }, ...opts });
        }

        await Movie.update({ id_user: null }, { where: { id_user: userId }, ...opts });
        await User.destroy({ where: { id: userId }, ...opts });
      });

      // Suppression des fichiers après la transaction (non rollbackable, mais BDD cohérente)
      await deleteAsset(user.picture);
      await deleteAsset(user.pending_picture);
      await deleteAsset(user.banner_image);
      await deleteAsset(user.pending_banner_image);
      for (const r of userRecipes) {
        await deleteAsset(r.picture);
        await deleteAsset(r.pending_picture);
        for (const pic of (r.RecipePictures || [])) await deleteAsset(pic.file_path);
      }

      logAdminAction({ adminId: req.userId, action: "delete_user", targetType: "user", targetId: userId, detail: user.pseudo });
      res.redirect("/admin?success=user_deleted&tab=utilisateurs");
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError() avec message personnalisé
      return renderServerError(
        res,
        error,
        "Erreur lors de la suppression de l'utilisateur."
      );
    }
  },

  async validateUserPhoto(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await User.findByPk(userId);
      if (!user) return renderNotFound(res, "Utilisateur introuvable.");

      // Supprimer l'ancienne photo validée si elle existe
      if (user.picture) await deleteAsset(user.picture);

      // Promouvoir pending_picture → picture
      await User.update(
        { picture: user.pending_picture, pending_picture: null, picture_status: "approved" },
        { where: { id: userId } }
      );
      // Invalider le cache nav pour que la nouvelle photo apparaisse immédiatement
      clearNavCache(userId);
      logAdminAction({ adminId: req.userId, action: "approve_user_photo", targetType: "user", targetId: userId });
      res.redirect("/admin?success=user_photo_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        "Erreur lors de la validation de la photo."
      );
    }
  },

  async rejectUserPhoto(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await User.findByPk(userId);
      if (!user) return renderNotFound(res, "Utilisateur introuvable.");

      // Supprimer la photo en attente et indiquer le refus (picture reste inchangée)
      if (user.pending_picture) await deleteAsset(user.pending_picture);
      await User.update(
        { pending_picture: null, picture_status: "rejected" },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "reject_user_photo", targetType: "user", targetId: userId });
      res.redirect("/admin?success=user_photo_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        "Erreur lors du refus de la photo."
      );
    }
  },

  async validateUserBanner(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await User.findByPk(userId);
      if (!user) return renderNotFound(res, "Utilisateur introuvable.");

      // Supprimer l'ancienne bannière approuvée si elle existe (distincte de la pending)
      if (user.banner_image) await deleteAsset(user.banner_image);

      // Promouvoir pending_banner_image → banner_image
      await User.update(
        { banner_image: user.pending_banner_image, pending_banner_image: null, banner_status: "approved" },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "approve_user_banner", targetType: "user", targetId: userId });
      res.redirect("/admin?success=user_banner_approved");
    } catch (error) {
      return renderServerError(
        res,
        error,
        "Erreur lors de la validation de la bannière."
      );
    }
  },

  async rejectUserBanner(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await User.findByPk(userId);
      if (!user) return renderNotFound(res, "Utilisateur introuvable.");

      // Supprimer uniquement la bannière EN ATTENTE — conserver banner_image (approuvée)
      if (user.pending_banner_image) await deleteAsset(user.pending_banner_image);

      // Si l'utilisateur avait déjà une bannière approuvée, on la restaure visuellement
      // Sinon on indique "rejected" pour qu'il puisse réessayer
      const newStatus = user.banner_image ? "approved" : "rejected";
      await User.update(
        { pending_banner_image: null, banner_status: newStatus },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "reject_user_banner", targetType: "user", targetId: userId });
      res.redirect("/admin?success=user_banner_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
        "Erreur lors du refus de la bannière."
      );
    }
  },

  async validateNotice(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      const notice = await Notice.findByPk(noticeId, { attributes: ["id", "id_user"] });
      await Notice.update({ status: "approved", validated_at: new Date() }, { where: { id: noticeId } });

      // XP bonus au contributeur pour avis validé
      if (notice?.id_user) {
        awardActionXP(notice.id_user, "user", "review_approved").catch(() => {});
      }

      logAdminAction({ adminId: req.userId, action: "approve_notice", targetType: "notice", targetId: noticeId });
      res.redirect("/admin?success=notice_validated");
    } catch (error) {
      return renderServerError(
        res,
        error,
        "Erreur lors de la validation de l'avis."
      );
    }
  },

  async rejectNotice(req, res) {
    try {
      const noticeId = parseInt(req.params.id, 10);
      // Marquer l'avis comme refusé (status: 'rejected') sans le supprimer
      await Notice.update({ status: "rejected" }, { where: { id: noticeId } });
      logAdminAction({ adminId: req.userId, action: "reject_notice", targetType: "notice", targetId: noticeId });
      res.redirect("/admin?success=notice_rejected");
    } catch (error) {
      return renderServerError(
        res,
        error,
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
        for (const r of recipes) { await deleteAsset(r.picture); await deleteAsset(r.pending_picture); }
        await Notice.destroy({ where: { id_recipe: recipeIds } });
        await UsersRecipes.destroy({ where: { id_recipe: recipeIds } });
        await Recipe.destroy({ where: { id_movie: movieId } });
      }

      await deleteAsset(movie.picture);
      await Movie.destroy({ where: { id: movieId } });
      searchCache.clear();
      logAdminAction({ adminId: req.userId, action: "delete_movie_direct", targetType: "movie", targetId: movieId, detail: movie.title });
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

      const recipe = await Recipe.findByPk(recipeId, {
        attributes: ["id", "picture", "pending_picture"],
        include: [{ model: RecipePicture, as: "RecipePictures", attributes: ["file_path"] }],
      });
      if (recipe) {
        await deleteAsset(recipe.picture);
        await deleteAsset(recipe.pending_picture);
        for (const pic of (recipe.RecipePictures || [])) { await deleteAsset(pic.file_path); }
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

      // Photo uploadée par l'admin — upload buffer vers Cloudinary
      if (req.file) {
        if (movie.picture) await deleteAsset(movie.picture);
        const result = await uploadBufferToCloudinary(req.file.buffer, { folder: "cinedelices/movies" });
        updateData.picture = result.secure_url;
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
        servings,
        difficulty,
        ingredients,
        preparation,
      } = req.body;
      const updateData = {};

      if (name) {
        const trimmedName = name.trim();
        if (!trimmedName) return res.redirect("/admin?success=admin_recipe_update_error");
        updateData.name = trimmedName;
      }
      if (description) updateData.description = description.trim();
      if (category) updateData.category = category.trim();
      if (time !== undefined && time !== "") {
        const timeValue = parseInt(time, 10);
        if (Number.isNaN(timeValue) || timeValue < 0) {
          return res.redirect("/admin?success=admin_recipe_update_error");
        }
        updateData.time = timeValue;
      }
      if (servings !== undefined && servings !== "") {
        const servingsValue = parseInt(servings, 10);
        if (Number.isNaN(servingsValue) || servingsValue < 1) {
          return res.redirect("/admin?success=admin_recipe_update_error");
        }
        updateData.servings = servingsValue;
      }
      if (difficulty) updateData.difficulty = difficulty.trim();
      if (ingredients) {
        const trimmedIng = ingredients.trim();
        if (!trimmedIng) return res.redirect("/admin?success=admin_recipe_update_error");
        updateData.ingredients = trimmedIng;
      }
      if (preparation) {
        const trimmedPrep = preparation.trim();
        if (!trimmedPrep) return res.redirect("/admin?success=admin_recipe_update_error");
        updateData.preparation = trimmedPrep;
      }

      // Photo uploadée par l'admin — diskStorage → lire depuis disk puis Cloudinary
      if (req.file) {
        if (recipe.picture) await deleteAsset(recipe.picture);
        const buf = fs.readFileSync(req.file.path);
        fs.unlink(req.file.path, () => {});
        const result = await uploadBufferToCloudinary(buf, { folder: "cinedelices/recipes" });
        updateData.picture = result.secure_url;
      }

      if (Object.keys(updateData).length === 0) {
        return res.redirect("/admin?success=admin_recipe_update_error");
      }

      // Le status n'est jamais modifié — une recette approuvée reste approuvée
      await Recipe.update(updateData, { where: { id: recipeId } });
      logAdminAction({ adminId: req.userId, action: "edit_recipe", targetType: "recipe", targetId: recipeId });
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

      const { content, quote, highlight } = req.body;
      const updateData = {};

      if (content) updateData.content = content.trim();
      if (quote) {
        const quoteValue = parseInt(quote, 10);
        if (Number.isNaN(quoteValue) || quoteValue < 1 || quoteValue > 5) {
          return res.redirect("/admin?success=admin_notice_update_error");
        }
        updateData.quote = quoteValue;
      }
      // Badge éditorial "Coup de cœur" / "Astuce utile" — posé/retiré en
      // modération. "none" (ou vide) efface le badge existant.
      if (highlight !== undefined) {
        const allowed = ["coup_de_coeur", "astuce_utile"];
        updateData.highlight = allowed.includes(highlight) ? highlight : null;
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

  // POST /admin/recipe-pictures/:id/approve
  async approveRecipePicture(req, res) {
    try {
      const pictureId = parseInt(req.params.id, 10);
      if (!pictureId || Number.isNaN(pictureId)) {
        return res.redirect("/admin?success=recipe_picture_not_found");
      }

      const pic = await RecipePicture.findByPk(pictureId);
      if (!pic) return res.redirect("/admin?success=recipe_picture_not_found");

      await RecipePicture.update(
        { status: "approved", approved_at: new Date() },
        { where: { id: pictureId } }
      );
      logAdminAction({ adminId: req.userId, action: "approve_recipe_picture", targetType: "photo", targetId: pictureId });
      return res.redirect("/admin?success=recipe_picture_approved");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de l'approbation de la photo.");
    }
  },

  // POST /admin/movies/:id/hide
  async hideMovie(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=admin_movie_hide_error");
      }

      await Movie.update({ hidden: true }, { where: { id: movieId } });
      searchCache.clear();
      logAdminAction({ adminId: req.userId, action: "hide_movie", targetType: "movie", targetId: movieId });
      return res.redirect("/admin?success=admin_movie_hidden");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors du masquage du film.");
    }
  },

  // POST /admin/movies/:id/unhide
  async unhideMovie(req, res) {
    try {
      const movieId = parseInt(req.params.id, 10);
      if (!movieId || Number.isNaN(movieId)) {
        return res.redirect("/admin?success=admin_movie_unhide_error");
      }

      await Movie.update({ hidden: false }, { where: { id: movieId } });
      searchCache.clear();
      logAdminAction({ adminId: req.userId, action: "unhide_movie", targetType: "movie", targetId: movieId });
      return res.redirect("/admin?success=admin_movie_unhidden");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de la remise en ligne du film.");
    }
  },

  // POST /admin/users/:id/suspend
  async suspendUser(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId || Number.isNaN(userId)) {
        return res.status(400).json({ success: false, message: "ID invalide." });
      }

      // Un superadmin ne peut pas être suspendu
      const target = await User.findByPk(userId, { attributes: ["id", "role"] });
      if (!target) return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
      if (target.role === "superadmin" || target.role === "super_admin") {
        return res.status(403).json({ success: false, message: "Impossible de suspendre un super administrateur." });
      }

      const { reason, days } = req.body;
      const suspendedUntil = days
        ? new Date(Date.now() + parseInt(days, 10) * 24 * 60 * 60 * 1000)
        : null;

      await User.update(
        {
          suspended: true,
          suspended_until: suspendedUntil,
          suspension_reason: reason || null,
        },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "suspend_user", targetType: "user", targetId: userId, detail: reason || null });
      return res.redirect("/admin?success=user_suspended");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de la suspension de l'utilisateur.");
    }
  },

  // POST /admin/users/:id/unsuspend
  async unsuspendUser(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId || Number.isNaN(userId)) {
        return res.redirect("/admin?success=user_unsuspend_error");
      }

      await User.update(
        { suspended: false, suspended_until: null, suspension_reason: null },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "unsuspend_user", targetType: "user", targetId: userId });
      return res.redirect("/admin?success=user_unsuspended");
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de la levée de suspension.");
    }
  },

  // POST /admin/users/create — JSON
  async createUser(req, res) {
    if (req.userRole !== "superadmin" && req.userRole !== "super_admin") {
      return res.status(403).json({ error: "Permission insuffisante" });
    }
    try {
      const { pseudo, email, password, role } = req.body;
      if (!pseudo?.trim() || !email?.trim() || !password) {
        return res.json({ success: false, message: "Champs obligatoires manquants." });
      }
      if (password.length < 8) {
        return res.json({ success: false, message: "Le mot de passe doit contenir au moins 8 caractères." });
      }
      const ALLOWED_ROLES = ["user", "editor", "admin", "superadmin", "super_admin"];
      const userRole = ALLOWED_ROLES.includes(role) ? role : "user";

      const existing = await User.findOne({
        where: { [Op.or]: [{ email: email.trim().toLowerCase() }, { pseudo: pseudo.trim() }] },
      });
      if (existing) return res.json({ success: false, message: "Email ou pseudo déjà utilisé." });

      const hash = await argon2.hash(password);
      const newUser = await User.create({
        first_name: pseudo.trim(),
        last_name: "",
        pseudo: pseudo.trim(),
        email: email.trim().toLowerCase(),
        password: hash,
        role: userRole,
      });

      logAdminAction({ adminId: req.userId, action: "create_user", targetType: "user", targetId: newUser.id, detail: `${pseudo.trim()} (${userRole})` });
      return res.json({ success: true, userId: newUser.id });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/users/:id/edit — JSON
  async editUser(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId || Number.isNaN(userId)) return res.json({ success: false, message: "ID invalide." });

      const user = await User.findByPk(userId);
      if (!user) return res.json({ success: false, message: "Utilisateur introuvable." });

      const callerIsSuperAdmin = req.userRole === "superadmin" || req.userRole === "super_admin";
      const targetIsSuperAdmin = user.role === "superadmin" || user.role === "super_admin";

      // Seul un super administrateur peut modifier un compte super administrateur
      if (targetIsSuperAdmin && !callerIsSuperAdmin) {
        return res.json({ success: false, message: "Permission insuffisante : seul un super administrateur peut modifier ce compte." });
      }

      const { pseudo, email, password, role } = req.body;
      const updateData = {};

      if (pseudo?.trim()) updateData.pseudo = pseudo.trim();
      if (email?.trim()) {
        const emailLower = email.trim().toLowerCase();
        const conflict = await User.findOne({ where: { email: emailLower, id: { [Op.ne]: userId } } });
        if (conflict) return res.json({ success: false, message: "Email déjà utilisé." });
        updateData.email = emailLower;
      }
      if (password) {
        if (password.length < 8) return res.json({ success: false, message: "Le mot de passe doit contenir au moins 8 caractères." });
        updateData.password = await argon2.hash(password);
      }
      if (role) {
        const ALLOWED_ROLES = ["user", "editor", "admin", "superadmin", "super_admin"];
        const PRIVILEGED_ROLES = ["admin", "superadmin", "super_admin"];
        // Seul un super administrateur peut attribuer un rôle admin ou super administrateur
        if (PRIVILEGED_ROLES.includes(role) && !callerIsSuperAdmin) {
          return res.json({ success: false, message: "Permission insuffisante : seul un super administrateur peut attribuer ce rôle." });
        }
        if (ALLOWED_ROLES.includes(role)) updateData.role = role;
      }

      if (Object.keys(updateData).length === 0) return res.json({ success: false, message: "Aucune modification." });

      await User.update(updateData, { where: { id: userId } });
      logAdminAction({ adminId: req.userId, action: "edit_user", targetType: "user", targetId: userId });
      return res.json({ success: true });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/users/:id/role — JSON
  async changeUserRole(req, res) {
    if (req.userRole !== "superadmin" && req.userRole !== "super_admin") {
      return res.status(403).json({ error: "Permission insuffisante" });
    }
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId || Number.isNaN(userId)) return res.json({ success: false, message: "ID invalide." });

      const { role } = req.body;
      const ALLOWED_ROLES = ["user", "editor", "admin", "superadmin", "super_admin"];
      if (!ALLOWED_ROLES.includes(role)) return res.json({ success: false, message: "Rôle invalide." });

      await User.update({ role }, { where: { id: userId } });
      logAdminAction({ adminId: req.userId, action: "change_role", targetType: "user", targetId: userId, detail: role });
      return res.json({ success: true });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // GET /admin/recipes/:id/pictures — JSON
  async getRecipePictures(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) return res.json({ success: false });

      const pictures = await RecipePicture.findAll({
        where: { recipe_id: recipeId },
        order: [["position", "ASC"]],
      });
      return res.json({ success: true, pictures });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/recipes/:id/pictures/add — JSON, multer single "picture"
  async addRecipePicture(req, res) {
    try {
      const recipeId = parseInt(req.params.id, 10);
      if (!recipeId || Number.isNaN(recipeId)) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.json({ success: false, message: "ID invalide" });
      }

      const count = await RecipePicture.count({ where: { recipe_id: recipeId } });
      if (count >= 3) {
        if (req.file) fs.unlink(req.file.path, () => {}); // nettoyer le fichier temp
        return res.json({ success: false, message: "Limite de 3 photos atteinte" });
      }

      if (!req.file) return res.json({ success: false, message: "Aucun fichier reçu" });

      // diskStorage → lire depuis le disk puis uploader le buffer sur Cloudinary
      const buffer = fs.readFileSync(req.file.path);
      fs.unlink(req.file.path, () => {});
      const cloudResult = await uploadBufferToCloudinary(buffer, { folder: "cinedelices/recipes" });
      const cloudinaryUrl = cloudResult.secure_url;

      const maxPos = await RecipePicture.max("position", { where: { recipe_id: recipeId } });
      const nextPosition = (maxPos || 0) + 1;

      const pic = await RecipePicture.create({
        recipe_id: recipeId,
        file_path: cloudinaryUrl,
        position: nextPosition,
        status: "approved",
        approved_at: new Date(),
        created_at: new Date(),
      });

      logAdminAction({ adminId: req.userId, action: "add_recipe_picture", targetType: "photo", targetId: pic.id, detail: `recipe #${recipeId}` });
      return res.json({ success: true, picture: pic });
    } catch (error) {
      if (req.file?.path) fs.unlink(req.file.path, () => {});
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/recipe-pictures/:id/delete-json — JSON
  async deleteRecipePictureJson(req, res) {
    try {
      const pictureId = parseInt(req.params.id, 10);
      if (!pictureId || Number.isNaN(pictureId)) return res.json({ success: false });

      const pic = await RecipePicture.findByPk(pictureId);
      if (!pic) return res.json({ success: false, message: "Photo introuvable" });
      if (pic.position < 2) return res.json({ success: false, message: "La photo principale ne peut pas être supprimée ici" });

      await deleteAsset(pic.file_path);
      await RecipePicture.destroy({ where: { id: pictureId } });
      logAdminAction({ adminId: req.userId, action: "delete_recipe_picture", targetType: "photo", targetId: pictureId });
      return res.json({ success: true });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/recipe-pictures/:id/approve-json — JSON
  async approveRecipePictureJson(req, res) {
    try {
      const pictureId = parseInt(req.params.id, 10);
      if (!pictureId || Number.isNaN(pictureId)) return res.json({ success: false });

      const pic = await RecipePicture.findByPk(pictureId);
      if (!pic) return res.json({ success: false, message: "Photo introuvable" });

      await RecipePicture.update(
        { status: "approved", approved_at: new Date() },
        { where: { id: pictureId } }
      );
      logAdminAction({ adminId: req.userId, action: "approve_recipe_picture", targetType: "photo", targetId: pictureId });
      return res.json({ success: true });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/recipe-pictures/:id/replace — JSON, multer single "picture"
  async replaceRecipePicture(req, res) {
    try {
      const pictureId = parseInt(req.params.id, 10);
      if (!pictureId || Number.isNaN(pictureId)) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.json({ success: false, message: "ID invalide" });
      }

      const pic = await RecipePicture.findByPk(pictureId);
      if (!pic) {
        if (req.file) fs.unlink(req.file.path, () => {});
        return res.json({ success: false, message: "Photo introuvable" });
      }
      if (!req.file) return res.json({ success: false, message: "Aucun fichier reçu" });

      // diskStorage → lire depuis le disk puis uploader le buffer sur Cloudinary
      const replaceBuffer = fs.readFileSync(req.file.path);
      fs.unlink(req.file.path, () => {});
      const replaceResult = await uploadBufferToCloudinary(replaceBuffer, { folder: "cinedelices/recipes" });
      const newPath = replaceResult.secure_url;
      await deleteAsset(pic.file_path);

      await RecipePicture.update(
        { file_path: newPath, status: "approved", approved_at: new Date() },
        { where: { id: pictureId } }
      );
      logAdminAction({ adminId: req.userId, action: "replace_recipe_picture", targetType: "photo", targetId: pictureId });
      return res.json({ success: true, file_path: newPath });
    } catch (error) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.json({ success: false, message: error.message });
    }
  },

  // GET /admin/logs
  async getAdminLogs(req, res) {
    if (req.userRole !== "superadmin" && req.userRole !== "super_admin") {
      return res.status(403).json({ error: "Permission insuffisante" });
    }
    try {
      const { QueryTypes } = await import("sequelize");
      const sequelize = (await import("../database/sequelize-client.js")).default;

      const logs = await sequelize.query(
        `SELECT al.id, al.action, al.target_type, al.target_id, al.detail, al.created_at,
                u.pseudo AS admin_pseudo
         FROM admin_logs al
         LEFT JOIN users u ON u.id = al.admin_id
         ORDER BY al.created_at DESC
         LIMIT 200`,
        { type: QueryTypes.SELECT }
      );

      return res.json({ success: true, logs });
    } catch (error) {
      return renderServerError(res, error, "Erreur lors de la récupération des logs.");
    }
  },

  /* Modération pseudo */
  async validateUserPseudo(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await User.findByPk(userId);
      if (!user || !user.pending_pseudo) return res.redirect("/admin?success=admin_pseudo_error");
      await User.update(
        { pseudo: user.pending_pseudo, pending_pseudo: null, pseudo_status: "approved" },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "approve_user_pseudo", targetType: "user", targetId: userId });
      return res.redirect("/admin?success=admin_pseudo_approved");
    } catch (error) {
      return renderServerError(res, error, "Erreur validation pseudo.");
    }
  },

  async rejectUserPseudo(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      await User.update(
        { pending_pseudo: null, pseudo_status: "rejected" },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "reject_user_pseudo", targetType: "user", targetId: userId });
      return res.redirect("/admin?success=admin_pseudo_rejected");
    } catch (error) {
      return renderServerError(res, error, "Erreur rejet pseudo.");
    }
  },

  /* Modération bio auteur */
  async validateUserBio(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await User.findByPk(userId);
      if (!user || !user.pending_bio) return res.redirect("/admin?success=admin_bio_error");
      await User.update(
        { bio: user.pending_bio, pending_bio: null, bio_status: "approved" },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "approve_user_bio", targetType: "user", targetId: userId });
      return res.redirect("/admin?success=admin_bio_approved");
    } catch (error) {
      return renderServerError(res, error, "Erreur validation bio.");
    }
  },

  async rejectUserBio(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      await User.update(
        { pending_bio: null, bio_status: "rejected" },
        { where: { id: userId } }
      );
      logAdminAction({ adminId: req.userId, action: "reject_user_bio", targetType: "user", targetId: userId });
      return res.redirect("/admin?success=admin_bio_rejected");
    } catch (error) {
      return renderServerError(res, error, "Erreur rejet bio.");
    }
  },

  /* Polling admin : compteurs en attente */
  async getPendingCount(req, res) {
    try {
      const [users, recipes, notices, recipePictures, movieEdits, movieDeletes] = await Promise.all([
        User.findAll({ attributes: ["banner_status", "pending_banner_image", "pending_picture", "picture_status", "pending_pseudo", "pseudo_status", "pending_bio", "bio_status"] }),
        Recipe.count({ where: { status: "pending" } }),
        Notice.count({ where: { status: "pending" } }),
        RecipePicture.count({ where: { status: "pending" } }),
        Movie.count({ where: { edit_status: "pending" } }),
        Movie.count({ where: { delete_request_status: "pending" } }),
      ]);

      const banners = users.filter(u => u.pending_banner_image && u.banner_status === "pending").length;
      const photos  = users.filter(u => u.pending_picture  && u.picture_status  === "pending").length;
      const pseudos = users.filter(u => u.pending_pseudo   && u.pseudo_status   === "pending").length;
      const bios    = users.filter(u => u.pending_bio      && u.bio_status      === "pending").length;
      const profils = banners + photos + pseudos + bios;
      const filmEdits = movieEdits + movieDeletes;

      return res.json({ success: true, banners, photos, pseudos, bios, profils, recipes, notices, recipePictures, filmEdits });
    } catch (error) {
      return res.status(500).json({ success: false });
    }
  },

  async getGamificationStats(req, res) {
    try {
      const { QueryTypes } = await import("sequelize");
      const sequelize = (await import("../database/sequelize-client.js")).default;

      const [topMembers, totals, levelDist] = await Promise.all([
        // Top 15 membres par points
        sequelize.query(
          `SELECT u.id, u.pseudo, u.picture, up.points, up.level_code, up.active_frame_code
           FROM user_points up
           JOIN users u ON u.id = up.id_user
           ORDER BY up.points DESC
           LIMIT 15`,
          { type: QueryTypes.SELECT }
        ),
        // Totaux globaux
        sequelize.query(
          `SELECT COALESCE(SUM(points),0)::int AS total_xp,
                  COUNT(*)::int AS total_members,
                  ROUND(AVG(points))::int AS avg_xp,
                  ROUND(AVG(level_code::int),1)::float AS avg_level
           FROM user_points`,
          { type: QueryTypes.SELECT }
        ),
        // Distribution par niveau
        sequelize.query(
          `SELECT level_code, COUNT(*)::int AS count FROM user_points GROUP BY level_code ORDER BY level_code::int`,
          { type: QueryTypes.SELECT }
        ),
      ]);

      return res.json({ success: true, topMembers, totals: totals[0], levelDist });
    } catch (error) {
      return renderServerError(res, error, "Erreur stats gamification.");
    }
  },
};

export default adminController;
