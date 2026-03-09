import { Recipe, Movie, Notice, User, UsersRecipes, Favorite, Rating } from "../models/index.model.js";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { StatusCodes } from "http-status-codes";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { getContributionBadge } from "../utils/contribution-badge.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Supprime un fichier statique si il existe (chemin relatif à /public) */
function unlinkIfExists(relativePath) {
  if (!relativePath) return;
  const abs = path.join(__dirname, "../public", relativePath);
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
}

const authController = {
  // pour se connecter (accepte pseudo ou email)
  async login(req, res) {
    const { pseudo, password } = req.body;

    try {
      // Recherche par pseudo (lowercase) ou par email (lowercase)
      const identifier = pseudo.trim().toLowerCase();
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { pseudo: identifier },
            { email: identifier },
          ],
        },
      });

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
        secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
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

      // Login automatique après inscription :
      // Création d'un JWT token identique à celui du login
      // pour que l'utilisateur soit connecté immédiatement
      const token = jwt.sign(
        { user_id: user.id, pseudo: user.pseudo, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // HTTPS uniquement en production
        maxAge: 1000 * 60 * 60 * 2, // 2 heures
      });

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

      const userMoviesRaw = await Movie.findAll({
        where: { id_user: user.id },
        order: [["id", "DESC"]],
      });
      // Enrichir les films avec les chemins d'images (cardPath, bannerPath)
      const userMovies = enrichMoviesWithImagePaths(userMoviesRaw);

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

      // Récupérer les favoris de l'utilisateur (films et recettes)
      const userFavoriteMovies = await Favorite.findAll({
        where: { id_user: user.id, entity_type: "movie" },
        attributes: ["entity_id", "created_at"],
        order: [["created_at", "DESC"]],
      });
      const favoriteMovieIds = userFavoriteMovies.map((f) => f.entity_id);
      const favoriteMoviesRaw = favoriteMovieIds.length > 0
        ? await Movie.findAll({ where: { id: favoriteMovieIds } })
        : [];
      // Enrichir les films favoris avec les chemins d'images
      const favoriteMovies = enrichMoviesWithImagePaths(favoriteMoviesRaw);

      const userFavoriteRecipes = await Favorite.findAll({
        where: { id_user: user.id, entity_type: "recipe" },
        attributes: ["entity_id", "created_at"],
        order: [["created_at", "DESC"]],
      });
      const favoriteRecipeIds = userFavoriteRecipes.map((f) => f.entity_id);
      const favoriteRecipes = favoriteRecipeIds.length > 0
        ? await Recipe.findAll({
            where: { id: favoriteRecipeIds },
            include: [{ model: Movie, attributes: ["id", "title"] }],
          })
        : [];

      // Récupérer les notes de l'utilisateur (films et recettes)
      const userMovieRatings = await Rating.findAll({
        where: { id_user: user.id, entity_type: "movie" },
        attributes: ["entity_id", "score", "created_at"],
        order: [["created_at", "DESC"]],
      });
      const ratedMovieIds = userMovieRatings.map((r) => r.entity_id);
      const ratedMoviesRaw = ratedMovieIds.length > 0
        ? await Movie.findAll({ where: { id: ratedMovieIds } })
        : [];
      // Enrichir les films notés avec les chemins d'images
      const ratedMoviesEnriched = enrichMoviesWithImagePaths(ratedMoviesRaw);
      // Associer les scores aux films enrichis
      const ratedMoviesWithScores = ratedMoviesEnriched.map((movie) => {
        const rating = userMovieRatings.find((r) => r.entity_id === movie.id);
        return { ...movie, userScore: rating ? rating.score : null };
      });

      const userRecipeRatings = await Rating.findAll({
        where: { id_user: user.id, entity_type: "recipe" },
        attributes: ["entity_id", "score", "created_at"],
        order: [["created_at", "DESC"]],
      });
      const ratedRecipeIds = userRecipeRatings.map((r) => r.entity_id);
      const ratedRecipes = ratedRecipeIds.length > 0
        ? await Recipe.findAll({
            where: { id: ratedRecipeIds },
            include: [{ model: Movie, attributes: ["id", "title"] }],
          })
        : [];
      // Associer les scores aux recettes
      const ratedRecipesWithScores = ratedRecipes.map((recipe) => {
        const rating = userRecipeRatings.find((r) => r.entity_id === recipe.id);
        return { ...recipe.toJSON(), userScore: rating ? rating.score : null };
      });

      // Calculer les statistiques
      const allRatings = [...userMovieRatings, ...userRecipeRatings];
      const avgUserRating = allRatings.length > 0
        ? (allRatings.reduce((sum, r) => sum + r.score, 0) / allRatings.length).toFixed(1)
        : "0.0";

      // Compter les recettes validées (pour indication UX bannière auteur + badge)
      const validatedRecipeCount = await Recipe.count({
        where: { id_user: user.id, status: "approved" },
      });
      const contributionBadge = getContributionBadge(validatedRecipeCount);

      // Détection de montée en niveau de badge (cookie-based)
      const currentBadgeLevel = contributionBadge ? contributionBadge.level : 0;
      const lastBadgeLevel = parseInt(req.cookies?.lastBadgeLevel || "0", 10);
      const badgeJustUpgraded = currentBadgeLevel > lastBadgeLevel;
      res.cookie("lastBadgeLevel", currentBadgeLevel, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 an
      });

      // Rendu de la vue avec les données utilisateur
      res.render("user-profile", {
        user,
        role: req.userRole,
        userId: req.userId,
        userRecipes,
        userMovies,
        userNotices,
        userNoticesCount,
        // Favoris
        favoriteMovies,
        favoriteRecipes,
        favoriteMoviesCount: favoriteMovies.length,
        favoriteRecipesCount: favoriteRecipes.length,
        // Notes
        ratedMovies: ratedMoviesWithScores,
        ratedRecipes: ratedRecipesWithScores,
        ratedMoviesCount: ratedMoviesWithScores.length,
        ratedRecipesCount: ratedRecipesWithScores.length,
        avgUserRating,
        validatedRecipeCount,
        contributionBadge,
        badgeJustUpgraded,
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

  async uploadProfilePhoto(req, res) {
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

      if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Aucun fichier sélectionné",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      // Supprimer l'ancien fichier physique si existe
      if (user.picture) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const oldPath = path.join(__dirname, "../public", user.picture);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const newPicture = `/images/profiles/${req.file.filename}`;
      await User.update(
        { picture: newPicture, picture_status: "pending" },
        { where: { id: userId } }
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Photo envoyée. En attente de validation.",
        picture: newPicture,
        picture_status: "pending",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de l'upload de la photo.",
        error: error.message,
      });
    }
  },

  /**
   * Upload de bannière auteur avec traitement Sharp
   *
   * Workflow :
   * 1. Multer réceptionne le fichier dans un dossier temporaire (/tmp)
   * 2. On supprime l'ancienne bannière si elle existe (fs.unlink)
   * 3. Sharp redimensionne en 1408×350 (fit: cover) et convertit en WebP
   * 4. Le fichier final est sauvegardé dans /images/banner-auteur/user-{id}.webp
   * 5. Le fichier temporaire Multer est supprimé
   * 6. Le chemin relatif est enregistré en base de données
   *
   * RÔLE DE SHARP :
   * Sharp est une bibliothèque de traitement d'images ultra-rapide (basée sur libvips).
   * Elle garantit que la bannière finale fait exactement 1408×350 pixels en WebP,
   * quelle que soit l'image envoyée par le frontend.
   *
   * POURQUOI ON NE STOCKE PAS L'IMAGE EN BASE (BLOB) :
   * - Les fichiers binaires en DB ralentissent les requêtes et les backups
   * - Le système de fichiers est optimisé pour servir des images statiques
   * - On stocke uniquement le chemin relatif (ex: /images/banner-auteur/user-42.webp)
   */
  async uploadBanner(req, res) {
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

      if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Aucun fichier sélectionné",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      const __dirname = path.dirname(fileURLToPath(import.meta.url));

      // --- SUPPRESSION de l'ancienne bannière si elle existe ---
      // fs.unlink supprime le fichier physique du disque
      if (user.banner_image) {
        const oldPath = path.join(__dirname, "../public", user.banner_image);
        fs.unlink(oldPath, () => {});
      }

      // --- TRAITEMENT avec Sharp ---
      // Dossier de destination des bannières finales
      const outputDir = path.join(__dirname, "../public/images/banner-auteur");
      fs.mkdirSync(outputDir, { recursive: true });

      // Nom du fichier final : user-{id}.webp (un seul fichier par utilisateur)
      const outputFilename = `user-${userId}.webp`;
      const outputPath = path.join(outputDir, outputFilename);

      // Sharp : redimensionnement exact 1408×350, conversion WebP qualité 80
      // fit: "cover" = l'image remplit le cadre sans bandes noires (comme object-fit: cover en CSS)
      await sharp(req.file.path)
        .resize(1408, 350, { fit: "cover" })
        .webp({ quality: 80 })
        .toFile(outputPath);

      // --- SUPPRESSION du fichier temporaire Multer ---
      // Le fichier original n'est plus nécessaire, on le supprime pour économiser l'espace disque
      fs.unlink(req.file.path, () => {});

      // --- MISE À JOUR en base de données ---
      // On stocke uniquement le chemin relatif (pas le chemin absolu du serveur)
      const bannerPath = `/images/banner-auteur/${outputFilename}`;
      await User.update(
        { banner_image: bannerPath, banner_status: "pending" },
        { where: { id: userId } }
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Bannière envoyée. En attente de validation.",
        banner_image: bannerPath,
        banner_status: "pending",
      });
    } catch (error) {
      // Nettoyer le fichier temporaire en cas d'erreur
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de l'upload de la bannière.",
        error: error.message,
      });
    }
  },

  /**
   * Suppression de la bannière auteur (retour à la bannière par défaut)
   *
   * 1. Supprime le fichier physique WebP avec fs.unlink
   * 2. Remet banner_image à null et banner_status à "approved" en base
   *
   * RÔLE DE fs.unlink :
   * Supprime un fichier du disque de manière asynchrone.
   * On passe un callback vide car si le fichier n'existe pas, ce n'est pas grave.
   */
  async deleteBanner(req, res) {
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

      // Supprimer le fichier physique avec fs.unlink (asynchrone)
      if (user.banner_image) {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        const oldPath = path.join(__dirname, "../public", user.banner_image);
        fs.unlink(oldPath, () => {});
      }

      // Remettre les valeurs par défaut en base
      await User.update(
        { banner_image: null, banner_status: "approved" },
        { where: { id: userId } }
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Bannière supprimée.",
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de la suppression de la bannière.",
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

      unlinkIfExists(user.picture);
      unlinkIfExists(user.banner_image);

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

      if (recipe.status === "approved") {
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

      // Recette non encore approuvée : mise à jour directe → supprimer l'ancienne image
      if (updateData.picture && recipe.picture) unlinkIfExists(recipe.picture);

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

      unlinkIfExists(recipe.picture);
      unlinkIfExists(recipe.pending_picture);

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

      if (movie.status === "approved") {
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

      if (notice.status === "approved") {
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

      if (notice.status === "approved") {
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

      if (movie.status === "approved") {
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
