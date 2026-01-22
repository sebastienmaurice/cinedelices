import { Recipe, Movie, Notice, User, UsersRecipes } from "../models/index.model.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { StatusCodes } from "http-status-codes";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

const authController = {
  // pour se connecter
  async login(req, res) {
    const { pseudo, password } = req.body;

    try {
      const user = await User.findOne({ where: { pseudo: pseudo } });

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).render("error", {
          error: "401",
          message: "pseudo ou mot de passe invalide",
          role: req.userRole,
        });
      }

      // on récupère le mot de passe de l'utilisateur pour le comparer avec celui fourni après qu'il ai été haché
      const hash = user.password;
      // comparaison du mot de passe donné avec celui enregistré
      const ok = await argon2.verify(hash, password);

      if (!ok) {
        return res.status(StatusCodes.UNAUTHORIZED).render("error", {
          error: "401",
          message: "Pseudo ou mot de passe invalide",
          role: req.userRole,
        });
      }

      // Création du token
      const token = jwt.sign(
        // le payload: ce sont les infos que contient le token
        { user_id: user.id, pseudo: user.pseudo, role: user.role },
        // JWT SECRET est la clé de chiffrement des données
        process.env.JWT_SECRET,
        // temps de validité du token avant expiration
        { expiresIn: "2h" }
      );

      // On stocke le token dans un cookie httpOnly
      res.cookie("token", token, {
        httpOnly: true, // Sécurise contre les attaques XSS
        secure: false, // Mettre true pour etre en HTTPS
        maxAge: 1000 * 60 * 60 * 2, // 1000 milliseconde = 1 seconde * 60 secondes = 1 minute * 60 minutes = 1 heure * 2 = 2 heures
      });

      res.status(StatusCodes.OK).redirect("/");
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(StatusCodes.CONFLICT).render("error", {
          error: "409",
          message: "le pseudo existe déjà.",
          role: req.userRole,
        });
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  // Pour s'inscrire (création de compte utilisateur)
  async register(req, res) {
    // Extraction des données du formulaire d'inscription
    // Note : sanitization à prévoir pour le pseudo (futur amélioration sécurité)
    const { first_name, last_name, pseudo, email, password, role } = req.body;

    try {
      const hash = await argon2.hash(password);

      const user = await User.create({
        first_name: first_name,
        last_name: last_name,
        pseudo: pseudo,
        email: email,
        password: hash,
        role: "user",
      });
      // const user = await User.create({ toutes les données });

      res.status(StatusCodes.CREATED).redirect("/");
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(StatusCodes.CONFLICT).render("error", {
          error: "409",
          message: "Ce pseudo est déjà utilisé.",
          role: req.userRole,
        });
      }

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).render("error", {
        error: "500",
        message: "Erreur serveur.",
        role: req.userRole,
      });
    }
  },

  //page profil
  async profil(req, res) {
    //recuperation info user
    if (!req.params.id) {
      return res.status(400).render("ID utilisateur manquant");
    }
    try {
      // Refactoring : suppression du console.log de debug
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ["password"] },
      });

      // Refactoring : utilisation du helper centralisé renderNotFound()
      if (!user) {
        return renderNotFound(res, "Utilisateur", req.userRole);
      }

      const userRecipes = await Recipe.findAll({
        where: { id_user: user.id },
        include: [{ model: Movie, attributes: ["title"] }],
        order: [["id", "DESC"]],
      });

      const userMovies = await Movie.findAll({
        where: { id_user: user.id },
        order: [["id", "DESC"]],
      });

      const userNotices = await Notice.findAll({
        where: { id_user: user.id },
        include: [
          {
            model: Recipe,
            attributes: ["id", "name"],
            include: [{ model: Movie, attributes: ["id", "title"] }],
          },
        ],
        order: [["id", "DESC"]],
        limit: 6,
      });

      const userNoticesCount = await Notice.count({
        where: { id_user: user.id },
      });

      // Rendu de la vue avec les données utilisateur
      // ajout de la gestion de role
      res.render("user-profile", {
        user,
        role: req.userRole,
        userRecipes,
        userMovies,
        userNotices,
        userNoticesCount,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
    }
  },

  async updateProfile(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);

      if (!userId || Number.isNaN(userId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "ID utilisateur invalide",
        });
      }

      if (req.userRole !== "admin" && req.userId !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      const {
        first_name,
        last_name,
        pseudo,
        email,
        password,
        notify_recipes,
        notify_cinema,
        remove_avatar,
      } = req.body;

      const updateData = {};
      if (first_name) updateData.first_name = first_name;
      if (last_name) updateData.last_name = last_name;
      if (pseudo) updateData.pseudo = pseudo;
      if (email) updateData.email = email;

      if (password && password.trim() !== "") {
        updateData.password = await argon2.hash(password);
      }

      if (typeof notify_recipes !== "undefined") {
        updateData.notify_recipes =
          notify_recipes === true ||
          notify_recipes === "true" ||
          notify_recipes === "1";
      }

      if (typeof notify_cinema !== "undefined") {
        updateData.notify_cinema =
          notify_cinema === true ||
          notify_cinema === "true" ||
          notify_cinema === "1";
      }

      if (remove_avatar === "true" && !req.file) {
        updateData.picture = null;
        updateData.picture_status = "approved";
      }

      if (req.file) {
        updateData.picture = `/images/profiles/${req.file.filename}`;
        updateData.picture_status = "pending";
      }

      if (updateData.pseudo || updateData.email) {
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              updateData.pseudo ? { pseudo: updateData.pseudo } : null,
              updateData.email ? { email: updateData.email } : null,
            ].filter(Boolean),
            id: { [Op.ne]: userId },
          },
        });

        if (existingUser) {
          return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: "Pseudo ou email déjà utilisé.",
          });
        }
      }

      await User.update(updateData, { where: { id: userId } });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Profil mis à jour avec succès.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la mise à jour du profil.",
        error: error.message,
      });
    }
  },

  async deleteAccount(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);

      if (!userId || Number.isNaN(userId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "ID utilisateur invalide",
        });
      }

      if (req.userRole !== "admin" && req.userId !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      await UsersRecipes.destroy({ where: { id_user: userId } });
      await Notice.destroy({ where: { id_user: userId } });
      await User.destroy({ where: { id: userId } });

      res.clearCookie("token");
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Compte supprimé avec succès.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la suppression du compte.",
        error: error.message,
      });
    }
  },

  async updateUserRecipe(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const recipeId = parseInt(req.params.recipeId, 10);

      if (!userId || Number.isNaN(userId) || Number.isNaN(recipeId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Paramètres invalides.",
        });
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Recette introuvable.",
        });
      }

      if (req.userRole !== "admin" && recipe.id_user !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit.",
        });
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
      if (category) {
        const allowedCategories = ["entrée", "plat", "dessert"];
        const normalizedCategory = category.trim().toLowerCase();
        if (!allowedCategories.includes(normalizedCategory)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Catégorie invalide.",
          });
        }
        updateData.category = normalizedCategory;
      }

      if (time) {
        const timeValue = parseInt(time, 10);
        if (Number.isNaN(timeValue) || timeValue < 1) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Le temps doit être supérieur à 0.",
          });
        }
        updateData.time = timeValue;
      }

      if (difficulty) {
        const allowedDifficulties = ["Facile", "Moyenne", "Difficile"];
        const normalizedDifficulty = difficulty.trim();
        if (!allowedDifficulties.includes(normalizedDifficulty)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Difficulté invalide.",
          });
        }
        updateData.difficulty = normalizedDifficulty;
      }

      if (ingredients) updateData.ingredients = ingredients.trim();
      if (preparation) updateData.preparation = preparation.trim();

      if (req.file) {
        updateData.picture = `/images/recipes/${req.file.filename}`;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Aucune modification détectée.",
        });
      }

      if (recipe.status === true) {
        if (recipe.edit_status === "pending") {
          return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: "Une modification est déjà en attente de validation.",
          });
        }

        const pendingData = {
          edit_status: "pending",
          edit_requested_at: new Date(),
        };

        if (updateData.name) pendingData.pending_name = updateData.name;
        if (updateData.description)
          pendingData.pending_description = updateData.description;
        if (updateData.picture) pendingData.pending_picture = updateData.picture;
        if (updateData.category) pendingData.pending_category = updateData.category;
        if (updateData.ingredients)
          pendingData.pending_ingredients = updateData.ingredients;
        if (updateData.preparation)
          pendingData.pending_preparation = updateData.preparation;
        if (updateData.time) pendingData.pending_time = updateData.time;
        if (updateData.difficulty)
          pendingData.pending_difficulty = updateData.difficulty;

        await Recipe.update(pendingData, { where: { id: recipeId } });
        return res.status(StatusCodes.OK).json({
          success: true,
          pending: true,
          message: "Modification envoyée pour validation.",
        });
      }

      await Recipe.update(updateData, { where: { id: recipeId } });
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Recette mise à jour.",
        applied: true,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la mise à jour de la recette.",
      });
    }
  },

  async deleteUserRecipe(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const recipeId = parseInt(req.params.recipeId, 10);

      if (!userId || Number.isNaN(userId) || Number.isNaN(recipeId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Paramètres invalides.",
        });
      }

      const recipe = await Recipe.findByPk(recipeId);
      if (!recipe) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Recette introuvable.",
        });
      }

      if (req.userRole !== "admin" && recipe.id_user !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit.",
        });
      }

      await Notice.destroy({ where: { id_recipe: recipeId } });
      await UsersRecipes.destroy({ where: { id_recipe: recipeId } });
      await Recipe.destroy({ where: { id: recipeId } });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Recette supprimée.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la suppression de la recette.",
      });
    }
  },

  async updateUserMovie(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const movieId = parseInt(req.params.movieId, 10);

      if (!userId || Number.isNaN(userId) || Number.isNaN(movieId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Paramètres invalides.",
        });
      }

      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Film introuvable.",
        });
      }

      if (req.userRole !== "admin") {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Action réservée aux administrateurs.",
        });
      }

      if (movie.id_user !== userId && req.userRole !== "admin") {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit.",
        });
      }

      const { title, year, genre } = req.body;
      const updateData = {};

      if (title) updateData.title = title.trim();
      if (year) {
        const yearValue = parseInt(year, 10);
        const maxYear = new Date().getFullYear() + 5;
        if (Number.isNaN(yearValue) || yearValue < 1888 || yearValue > maxYear) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Année invalide.",
          });
        }
        updateData.year = yearValue;
      }

      if (genre) {
        const allowedGenres = [
          "action",
          "animé",
          "aventure",
          "comédie",
          "drame",
          "fantastique",
          "horreur",
          "romantique",
          "science-fiction",
          "thriller",
        ];
        const normalizedGenre = genre.trim().toLowerCase();
        if (!allowedGenres.includes(normalizedGenre)) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Genre invalide.",
          });
        }
        updateData.genre = normalizedGenre;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Aucune modification détectée.",
        });
      }

      if (movie.status === true) {
        if (movie.edit_status === "pending") {
          return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: "Une modification est déjà en attente de validation.",
          });
        }

        const pendingData = {
          edit_status: "pending",
          edit_requested_at: new Date(),
        };

        if (updateData.title) pendingData.pending_title = updateData.title;
        if (updateData.year) pendingData.pending_year = updateData.year;
        if (updateData.genre) pendingData.pending_genre = updateData.genre;

        await Movie.update(pendingData, { where: { id: movieId } });
        return res.status(StatusCodes.OK).json({
          success: true,
          pending: true,
          message: "Modification envoyée pour validation.",
        });
      }

      await Movie.update(updateData, { where: { id: movieId } });
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Film mis à jour.",
        applied: true,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la mise à jour du film.",
      });
    }
  },

  async updateUserNotice(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const noticeId = parseInt(req.params.noticeId, 10);

      if (!userId || Number.isNaN(userId) || Number.isNaN(noticeId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Paramètres invalides.",
        });
      }

      const notice = await Notice.findByPk(noticeId);
      if (!notice) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Avis introuvable.",
        });
      }

      if (req.userRole !== "admin") {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Action réservée aux administrateurs.",
        });
      }

      if (notice.id_user !== userId && req.userRole !== "admin") {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit.",
        });
      }

      const { content, quote } = req.body;
      const updateData = {};

      if (content) updateData.content = content.trim();
      if (quote) {
        const quoteValue = parseInt(quote, 10);
        if (Number.isNaN(quoteValue) || quoteValue < 1 || quoteValue > 5) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Note invalide.",
          });
        }
        updateData.quote = quoteValue;
      }

      if (Object.keys(updateData).length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Aucune modification détectée.",
        });
      }

      if (notice.status === true) {
        if (notice.edit_status === "pending") {
          return res.status(StatusCodes.CONFLICT).json({
            success: false,
            message: "Une modification est déjà en attente de validation.",
          });
        }

        const pendingData = {
          edit_status: "pending",
          edit_requested_at: new Date(),
        };

        if (updateData.content) pendingData.pending_content = updateData.content;
        if (updateData.quote) pendingData.pending_quote = updateData.quote;

        await Notice.update(pendingData, { where: { id: noticeId } });
        return res.status(StatusCodes.OK).json({
          success: true,
          pending: true,
          message: "Modification envoyée pour validation.",
        });
      }

      await Notice.update(updateData, { where: { id: noticeId } });
      return res.status(StatusCodes.OK).json({
        success: true,
        applied: true,
        message: "Avis mis à jour.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la mise à jour de l'avis.",
      });
    }
  },

  async deleteUserNotice(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const noticeId = parseInt(req.params.noticeId, 10);

      if (!userId || Number.isNaN(userId) || Number.isNaN(noticeId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Paramètres invalides.",
        });
      }

      const notice = await Notice.findByPk(noticeId);
      if (!notice) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Avis introuvable.",
        });
      }

      if (req.userRole !== "admin" && notice.id_user !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit.",
        });
      }

      if (notice.status === true) {
        if (notice.delete_request_status === "pending") {
          return res.status(StatusCodes.OK).json({
            success: true,
            request: true,
            message:
              "Une demande de suppression est déjà en attente de validation.",
          });
        }

        await Notice.update(
          {
            delete_request_status: "pending",
            delete_request_at: new Date(),
          },
          { where: { id: noticeId } }
        );

        return res.status(StatusCodes.OK).json({
          success: true,
          request: true,
          message: "Demande de suppression envoyée.",
        });
      }

      await Notice.destroy({ where: { id: noticeId } });
      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Avis supprimé.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la suppression de l'avis.",
      });
    }
  },

  async deleteUserMovie(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      const movieId = parseInt(req.params.movieId, 10);

      if (!userId || Number.isNaN(userId) || Number.isNaN(movieId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Paramètres invalides.",
        });
      }

      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Film introuvable.",
        });
      }

      if (req.userRole !== "admin" && movie.id_user !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Accès interdit.",
        });
      }

      if (movie.status === true) {
        if (movie.delete_request_status === "pending") {
          return res.status(StatusCodes.OK).json({
            success: true,
            request: true,
            message:
              "Une demande de suppression est déjà en attente de validation.",
          });
        }

        await Movie.update(
          {
            delete_request_status: "pending",
            delete_request_by: userId,
            delete_request_at: new Date(),
          },
          { where: { id: movieId } }
        );

        return res.status(StatusCodes.OK).json({
          success: true,
          request: true,
          message:
            "Demande de suppression envoyée à l'administrateur. Le film reste visible jusqu'à décision.",
        });
      }

      const recipes = await Recipe.findAll({ where: { id_movie: movieId } });
      const recipeIds = recipes.map((recipe) => recipe.id);
      if (recipeIds.length > 0) {
        await Notice.destroy({ where: { id_recipe: recipeIds } });
        await UsersRecipes.destroy({ where: { id_recipe: recipeIds } });
        await Recipe.destroy({ where: { id_movie: movieId } });
      }

      await Movie.destroy({ where: { id: movieId } });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Film supprimé.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la suppression du film.",
      });
    }
  },

  //page avis
  quote(req, res) {
    res.send("donne note et avis");
    // ajout de la gestion de role
    //res.render("user-quote" ,{ role: req.userRole });
  },

  //deconnexion
  async logout(req, res) {
    res.clearCookie("token");
    res.redirect("/");
  },
};

export default authController;
