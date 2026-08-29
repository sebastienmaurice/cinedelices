import { Recipe, Movie, Notice, User, UsersRecipes, Favorite, Rating, RecipePicture } from "../models/index.model.js";
import { processRecipeImages, cleanupFiles } from "../utils/recipe-image-processor.js";
import { getUserGamificationData, awardWeeklyLoginXP, awardDailyLoginXP } from "../services/gamification.service.js";
import { isStaffRole } from "../utils/gamification.utils.js";
import {
  createAndSendResetToken,
  findActiveToken,
  markTokenUsed,
} from "../services/password-reset.service.js";
import { OAuth2Client } from "google-auth-library";
import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import { StatusCodes } from "http-status-codes";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { deleteAsset, uploadBufferToCloudinary } from "../utils/asset-manager.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === "production";

const authController = {
  // pour se connecter (accepte pseudo ou email)
  async login(req, res) {
    const { pseudo, password } = req.body;

    try {
      // Recherche par pseudo (lowercase) ou par email (lowercase)
      const identifier = pseudo.trim();
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { pseudo: { [Op.iLike]: identifier } },
            { email: { [Op.iLike]: identifier } },
          ],
        },
      });

      if (!user) {
        return res.status(StatusCodes.UNAUTHORIZED).render("error", {
          error: "401",
          message: "pseudo ou mot de passe invalide",
        });
      }

      // Compte Google-only : pas de mot de passe enregistré
      if (!user.password) {
        return res.status(StatusCodes.UNAUTHORIZED).render("error", {
          error: "401",
          message: "Ce compte utilise la connexion Google. Utilisez le bouton « Se connecter avec Google ».",
        });
      }

      const hash = user.password;
      const ok = await argon2.verify(hash, password);

      if (!ok) {
        return res.status(StatusCodes.UNAUTHORIZED).render("error", {
          error: "401",
          message: "Pseudo ou mot de passe invalide",
        });
      }

      // Vérifier si le compte est suspendu
      if (user.suspended) {
        const stillSuspended = !user.suspended_until || new Date(user.suspended_until) > new Date();
        if (stillSuspended) {
          const until = user.suspended_until
            ? ` jusqu'au ${new Date(user.suspended_until).toLocaleDateString("fr-FR")}`
            : " indéfiniment";
          const reason = user.suspension_reason ? ` Motif : ${user.suspension_reason}` : "";
          return res.status(StatusCodes.FORBIDDEN).render("error", {
            error: "403",
            message: `Votre compte est suspendu${until}.${reason}`,
          });
        }
        // Suspension expirée → lever automatiquement
        await User.update(
          { suspended: false, suspended_until: null, suspension_reason: null },
          { where: { id: user.id } }
        );
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
        secure: isProduction,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 2, // 1000 milliseconde = 1 seconde * 60 secondes = 1 minute * 60 minutes = 1 heure * 2 = 2 heures
      });

      // XP de connexion — réservé aux membres classiques uniquement
      if (!isStaffRole(user.role)) {
        awardWeeklyLoginXP(user.id).catch((e) => console.error("Weekly XP login:", e.message));
        awardDailyLoginXP(user.id).catch((e) => console.error("Daily streak XP:", e.message));
      }

      res.status(StatusCodes.OK).redirect("/");
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(StatusCodes.CONFLICT).render("error", {
          error: "409",
          message: "le pseudo existe déjà.",
        });
      }
      return renderServerError(res, error);
    }
  },

  // Pour s'inscrire (création de compte utilisateur)
  async register(req, res) {
    // Extraction des données du formulaire d'inscription
    // Note : sanitization à prévoir pour le pseudo (futur amélioration sécurité)
    const { pseudo, email, password, rgpd_consent } = req.body;

    // Vérification consentement RGPD obligatoire
    if (!rgpd_consent) {
      return res.status(400).json({
        success: false,
        message: "Vous devez accepter la politique de confidentialité pour créer un compte."
      });
    }

    try {
      const hash = await argon2.hash(password);

      const user = await User.create({
        first_name: "",
        last_name: "",
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
        secure: isProduction,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 2, // 2 heures
      });

      res.status(StatusCodes.CREATED).redirect("/");
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(StatusCodes.CONFLICT).render("error", {
          error: "409",
          message: "Ce pseudo est déjà utilisé.",
        });
      }
      return renderServerError(res, error);
    }
  },

  //page profil
  async profil(req, res) {
    if (!req.params.id) {
      return res.status(400).render("ID utilisateur manquant");
    }

    // Seul le propriétaire du compte (ou un admin/super_admin) peut accéder au profil
    const isOwner = String(req.userId) === String(req.params.id);
    const isAdmin = req.userRole === "admin" || req.userRole === "super_admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).render("error", {
        error: "403",
        message: "Vous n'êtes pas autorisé à accéder à ce profil.",
      });
    }

    try {
      const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ["password"] },
        // google_id est inclus pour conditionner l'affichage côté vue (section mot de passe)
      });

      if (!user) {
        return renderNotFound(res, "Utilisateur");
      }

      const userRecipes = await Recipe.findAll({
        where: { id_user: user.id },
        include: [
          { model: Movie, attributes: ["title"] },
          { model: RecipePicture, as: "RecipePictures", attributes: ["file_path", "position"] },
        ],
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

      // Gamification — calcul XP + cadres + activité
      const gamif = await getUserGamificationData(user.id, {
        recipes:  userRecipes,
        movies:   userMovies,
        notices:  userNotices,
        userRole: req.userRole,
      });

      // Rendu de la vue avec les données utilisateur
      res.render("user-profile", {
        user,
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
        // Gamification
        userXP:           gamif.xp,
        userLevel:        gamif.level,
        userStreak:       0,
        userActiveFrame:  gamif.activeFrameUrl,
        userActiveFrameId:gamif.activeFrameCode,
        userFrames:       gamif.frames,
        userActivity:     gamif.activity,
        userCommentsCount:0,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
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
      /* Le pseudo ne se met PAS à jour directement — il passe en modération */
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
        await deleteAsset(user.picture);
        updateData.picture = null;
        updateData.picture_status = "approved";
      }

      if (req.file) {
        await deleteAsset(user.picture);
        // req.file.buffer (memoryStorage) → upload vers Cloudinary
        const result = await uploadBufferToCloudinary(req.file.buffer, { folder: "cinedelices/profiles" });
        updateData.picture = result.secure_url;
        updateData.picture_status = "pending";
      }

      /* Soumission pseudo en modération */
      if (pseudo && pseudo.trim()) {
        const trimmedPseudo = pseudo.trim();
        /* Vérifier unicité contre pseudo actif ET pseudos en attente */
        const conflict = await User.findOne({
          where: {
            [Op.or]: [{ pseudo: trimmedPseudo }, { pending_pseudo: trimmedPseudo }],
            id: { [Op.ne]: userId },
          },
        });
        if (conflict) {
          return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Ce pseudo est déjà pris." });
        }
        updateData.pending_pseudo = trimmedPseudo;
        updateData.pseudo_status  = "pending";
      }

      if (updateData.email) {
        const existingUser = await User.findOne({
          where: { email: updateData.email, id: { [Op.ne]: userId } },
        });
        if (existingUser) {
          return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Email déjà utilisé." });
        }
      }

      await User.update(updateData, { where: { id: userId } });

      return res.status(StatusCodes.OK).json({
        success: true,
        message: pseudo ? "Pseudo soumis — en attente de validation par un admin." : "Profil mis à jour avec succès.",
        pseudo_status: pseudo ? "pending" : undefined,
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

      // Supprimer l'éventuelle photo précédente en attente (non encore validée)
      if (user.pending_picture) await deleteAsset(user.pending_picture);

      // req.file.buffer (memoryStorage) → upload vers Cloudinary
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, { folder: "cinedelices/profiles" });
      const pendingPicture = uploadResult.secure_url;
      await User.update(
        { pending_picture: pendingPicture, picture_status: "pending" },
        { where: { id: userId } }
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Photo envoyée. En attente de validation admin.",
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

      // --- VALIDATION DU RATIO (paysage uniquement) ---
      const meta = await sharp(req.file.path).metadata();
      const ratio = meta.width / meta.height;
      if (ratio < 1.5) {
        fs.unlink(req.file.path, () => {});
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "L'image doit être en format paysage (ratio minimum 3:2). Les formats portrait ou carré ne sont pas acceptés.",
        });
      }

      // --- SUPPRESSION de la bannière EN ATTENTE précédente si elle existe ---
      // On ne touche PAS à banner_image (bannière approuvée) pour ne pas la perdre en cas de refus
      if (user.pending_banner_image) {
        await deleteAsset(user.pending_banner_image);
      }

      // --- TRAITEMENT avec Sharp → Buffer WebP ---
      // Sharp redimensionne en 1408×350 (fit: cover) et convertit en WebP qualité 80
      const buffer = await sharp(req.file.path)
        .resize(1408, 350, { fit: "cover" })
        .webp({ quality: 80 })
        .toBuffer();

      // Suppression du fichier temporaire Multer
      fs.unlink(req.file.path, () => {});

      // --- UPLOAD du buffer WebP sur Cloudinary ---
      // public_id distinct (-pending) pour ne pas écraser la bannière approuvée existante
      const cloudResult = await uploadBufferToCloudinary(buffer, {
        folder:    "cinedelices/banners",
        public_id: `user-${userId}-pending`,
        overwrite: true,
      });

      const bannerPath = cloudResult.secure_url;
      await User.update(
        { pending_banner_image: bannerPath, banner_status: "pending" },
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

      // Suppression de l'asset Cloudinary (ou fichier local en dev)
      if (user.banner_image) {
        await deleteAsset(user.banner_image);
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

  /**
   * POST /auth/profil/:id/bio
   * Body : { bio: "..." }
   * Soumet la bio auteur en modération (même convention que le pseudo :
   * pending_bio + bio_status="pending", publiée après validation admin).
   */
  async updateBio(req, res) {
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

      const bio = (req.body.bio || "").trim();
      if (!bio) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "La bio ne peut pas être vide.",
        });
      }
      if (bio.length > 500) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "La bio ne peut pas dépasser 500 caractères.",
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: "Utilisateur non trouvé",
        });
      }

      await User.update(
        { pending_bio: bio, bio_status: "pending" },
        { where: { id: userId } }
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: "Bio soumise — en attente de validation par un admin.",
        bio_status: "pending",
        pending_bio: bio,
      });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de l'enregistrement de la bio.",
        error: error.message,
      });
    }
  },

  /**
   * POST /auth/profil/:id/hero-position
   * Body : { posY: 0-100 }
   * Position verticale personnalisée du hero banner (page auteur) — pure
   * préférence d'affichage, aucune modération nécessaire (contrairement à
   * la bio/bannière/pseudo qui sont du contenu public à valider).
   */
  async updateHeroPosition(req, res) {
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

      const posY = parseInt(req.body.posY, 10);
      if (!Number.isInteger(posY) || posY < 0 || posY > 100) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: "Position invalide.",
        });
      }

      await User.update(
        { hero_banner_pos_y: posY },
        { where: { id: userId } }
      );

      return res.status(StatusCodes.OK).json({ success: true, posY });
    } catch (error) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Erreur lors de l'enregistrement de la position.",
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

      await deleteAsset(user.picture);
      await deleteAsset(user.banner_image);

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

      // Multi-photos : req.files (array) ou req.file (single legacy)
      const uploadedFiles = req.files && req.files.length > 0
        ? req.files
        : req.file ? [req.file] : [];
      let newPictures = [];
      if (uploadedFiles.length > 0) {
        try {
          newPictures = await processRecipeImages(uploadedFiles);
          updateData.picture = newPictures[0].relPath;
        } catch (err) {
          cleanupFiles(uploadedFiles.filter((f) => fs.existsSync(f.path)));
          return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: err.message === "ratio"
              ? (err.type === "extreme"
                ? `L'image "${err.filename}" est trop panoramique (${err.w}×${err.h} px). Ratio max 2:1.`
                : `L'image "${err.filename}" est en portrait ou carré (${err.w}×${err.h} px). Utilisez une image en paysage (ratio ≥ 1,3).`)
              : "Erreur lors du traitement des photos.",
          });
        }
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
        if (updateData.picture) {
          pendingData.pending_picture = updateData.picture;
        }
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

      // Recette rejetée modifiée → repasse en pending (resoumission pour revalidation)
      const isResubmission = recipe.status === "rejected";
      if (isResubmission) {
        updateData.status = "pending";
        updateData.edit_requested_at = new Date();
      }

      // Recette non encore approuvée : mise à jour directe
      if (updateData.picture && recipe.picture) await deleteAsset(recipe.picture);

      await Recipe.update(updateData, { where: { id: recipeId } });

      // Mise à jour de recipe_pictures si de nouvelles photos ont été uploadées
      if (newPictures.length > 0) {
        const oldPics = await RecipePicture.findAll({ where: { recipe_id: recipeId } });
        for (const p of oldPics) { await deleteAsset(p.file_path); }
        await RecipePicture.destroy({ where: { recipe_id: recipeId } });
        await RecipePicture.bulkCreate(
          newPictures.map(({ relPath, position }) => ({
            recipe_id: recipeId,
            file_path: relPath,
            position,
          }))
        );
      }

      return res.status(StatusCodes.OK).json({
        success: true,
        message: isResubmission
          ? "Recette modifiée et renvoyée pour validation."
          : "Recette mise à jour.",
        applied: true,
        resubmitted: isResubmission,
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

      // Recette approuvée : demande de suppression admin (ne pas supprimer directement)
      if (req.userRole !== "admin" && recipe.status === "approved") {
        if (recipe.delete_request_status === "pending") {
          return res.status(StatusCodes.OK).json({
            success: true,
            request: true,
            message: "Une demande de suppression est déjà en attente de validation.",
          });
        }
        await Recipe.update(
          { delete_request_status: "pending", delete_request_at: new Date() },
          { where: { id: recipeId } }
        );
        return res.status(StatusCodes.OK).json({
          success: true,
          request: true,
          message: "Demande de suppression envoyée à l'équipe Ciné Délices.",
        });
      }

      // Recette non approuvée (pending/rejected) ou action admin : suppression directe
      await deleteAsset(recipe.picture);
      await deleteAsset(recipe.pending_picture);

      // Supprimer les assets des photos secondaires (recipe_pictures)
      const recipePictures = await RecipePicture.findAll({ where: { recipe_id: recipeId } });
      for (const p of recipePictures) { await deleteAsset(p.file_path); }

      await Notice.destroy({ where: { id_recipe: recipeId } });
      await UsersRecipes.destroy({ where: { id_recipe: recipeId } });
      await Recipe.destroy({ where: { id: recipeId } }); // ON DELETE CASCADE supprime recipe_pictures en BDD

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

  /* Polling user : statut pseudo courant */
  async getPseudoStatus(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (req.userId !== userId) return res.status(StatusCodes.FORBIDDEN).json({ success: false });
      const user = await User.findByPk(userId, { attributes: ["pseudo", "pending_pseudo", "pseudo_status"] });
      if (!user) return res.status(StatusCodes.NOT_FOUND).json({ success: false });
      return res.json({ success: true, pseudo: user.pseudo, pending_pseudo: user.pending_pseudo, pseudo_status: user.pseudo_status });
    } catch {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
    }
  },

  /* Polling user : statut bannière courant */
  async getBannerStatus(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (req.userId !== userId) return res.status(StatusCodes.FORBIDDEN).json({ success: false });
      const user = await User.findByPk(userId, { attributes: ["banner_status", "banner_image"] });
      if (!user) return res.status(StatusCodes.NOT_FOUND).json({ success: false });
      return res.json({ success: true, banner_status: user.banner_status, banner_image: user.banner_image });
    } catch {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false });
    }
  },

  // ─────────────────────────────────────────────────────────────
  //  FORGOT / RESET PASSWORD
  // ─────────────────────────────────────────────────────────────

  // GET /auth/forgot-password — affiche le formulaire
  async forgotPasswordForm(req, res) {
    return res.render("forgot-password", {
      sent: false,
      error: null,
    });
  },

  // POST /auth/forgot-password — envoie le lien (réponse neutre)
  async forgotPasswordSubmit(req, res) {
    const raw = (req.body.identifier || "").trim();
    const NEUTRAL_VIEW = {
      sent: true,
      error: null,
    };

    try {
      if (!raw) {
        return res.status(StatusCodes.BAD_REQUEST).render("forgot-password", {
          sent: false,
          error: "Merci de renseigner votre email ou identifiant.",
        });
      }

      // Recherche par email OU pseudo (insensible à la casse)
      const user = await User.findOne({
        where: {
          [Op.or]: [
            { email:  { [Op.iLike]: raw } },
            { pseudo: { [Op.iLike]: raw } },
          ],
        },
      });

      if (user && user.email) {
        try {
          await createAndSendResetToken(user);
        } catch (e) {
          // On log mais on ne révèle rien à l'utilisateur (réponse neutre)
          console.error("[forgot-password] sendMail failed:", e.message);
        }
      }

      // Réponse neutre dans tous les cas (existe / n'existe pas / mail KO)
      return res.render("forgot-password", NEUTRAL_VIEW);
    } catch (error) {
      console.error("[forgot-password] error:", error);
      return res.render("forgot-password", NEUTRAL_VIEW);
    }
  },

  // GET /auth/reset-password?token=XXX — vérifie token puis affiche form
  async resetPasswordForm(req, res) {
    const token = (req.query.token || "").trim();
    const record = await findActiveToken(token);

    if (!record) {
      return res.status(StatusCodes.BAD_REQUEST).render("reset-password", {
        tokenValid: false,
        token: null,
        error: "Ce lien de réinitialisation est invalide ou a expiré.",
        success: false,
      });
    }

    return res.render("reset-password", {
      tokenValid: true,
      token,
      error: null,
      success: false,
    });
  },

  // POST /auth/reset-password — applique le nouveau mot de passe
  async resetPasswordSubmit(req, res) {
    const token = (req.body.token || "").trim();
    const { password, confirm_password } = req.body;

    const record = await findActiveToken(token);
    if (!record) {
      return res.status(StatusCodes.BAD_REQUEST).render("reset-password", {
        tokenValid: false,
        token: null,
        error: "Ce lien de réinitialisation est invalide ou a expiré.",
        success: false,
      });
    }

    // Validation mot de passe (même règle que register)
    const strongPwd = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,255}$/;
    if (!password || !strongPwd.test(password)) {
      return res.status(StatusCodes.BAD_REQUEST).render("reset-password", {
        tokenValid: true,
        token,
        error:
          "Mot de passe trop faible. Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.",
        success: false,
      });
    }

    if (password !== confirm_password) {
      return res.status(StatusCodes.BAD_REQUEST).render("reset-password", {
        tokenValid: true,
        token,
        error: "Les mots de passe ne correspondent pas.",
        success: false,
      });
    }

    try {
      const hash = await argon2.hash(password);
      await User.update({ password: hash }, { where: { id: record.user_id } });
      await markTokenUsed(record);

      return res.render("reset-password", {
        tokenValid: false,
        token: null,
        error: null,
        success: true,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },

  // ── Authentification Google OAuth ──────────────────────────────────────────

  /**
   * Sanitise un nom Google en pseudo valide (alphanum + underscore, max 20 car.)
   */
  _sanitizePseudo(name) {
    return (name || "")
      .toLowerCase()
      .replace(/[éèêë]/g, "e").replace(/[àâ]/g, "a").replace(/[ôö]/g, "o")
      .replace(/[îï]/g, "i").replace(/[ùûü]/g, "u").replace(/ç/g, "c")
      .replace(/[^a-z0-9_]/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 20) || "user";
  },

  /** Vérifie le credential Google et retourne le payload */
  async _verifyGoogleToken(credential) {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  },

  /** Crée un JWT et le stocke dans un cookie httpOnly */
  _issueJwt(res, user) {
    const token = jwt.sign(
      { user_id: user.id, pseudo: user.pseudo, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2,
    });
  },

  /**
   * POST /auth/google
   * Reçoit le credential (ID token) de Google Identity Services.
   * - Si l'utilisateur existe → connexion directe
   * - Si nouveau et pseudo disponible → création + connexion
   * - Si nouveau et pseudo occupé → retourne {status:'pseudo_required'}
   */
  async googleAuth(req, res) {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: "credential manquant" });

    try {
      const payload = await authController._verifyGoogleToken(credential);
      const { sub: googleId, email, given_name, family_name, name, picture } = payload;

      // 1. Cherche un compte existant par google_id ou par email
      let user = await User.findOne({
        where: { [Op.or]: [{ google_id: googleId }, { email }] },
      });

      if (user) {
        // Lie le google_id si ce n'est pas encore fait (compte local existant)
        if (!user.google_id) {
          await user.update({ google_id: googleId, avatar_url: picture || user.avatar_url });
        }
        authController._issueJwt(res, user);
        if (!isStaffRole(user.role)) {
          awardWeeklyLoginXP(user.id).catch(() => {});
          awardDailyLoginXP(user.id).catch(() => {});
        }
        return res.json({ status: "ok" });
      }

      // 2. Nouvel utilisateur — essai de pseudo automatique
      const basePseudo = authController._sanitizePseudo(given_name || name || email.split("@")[0]);
      const pseudoExists = await User.findOne({ where: { pseudo: basePseudo } });

      if (pseudoExists) {
        // Pseudo déjà pris : demander à l'utilisateur d'en choisir un
        return res.json({
          status: "pseudo_required",
          googleData: { email, given_name, family_name, picture, suggestedPseudo: basePseudo },
        });
      }

      // Pseudo disponible : création du compte
      user = await User.create({
        first_name: given_name || name || "Utilisateur",
        last_name: family_name || "",
        pseudo: basePseudo,
        email,
        password: null,
        google_id: googleId,
        avatar_url: picture || null,
        role: "user",
      });

      authController._issueJwt(res, user);
      return res.json({ status: "ok" });
    } catch (err) {
      console.error("Google auth error:", err.message);
      return res.status(401).json({ error: "Token Google invalide ou expiré" });
    }
  },

  /**
   * POST /auth/google/complete
   * Appelé quand l'utilisateur choisit son pseudo (cas pseudo_required).
   * Re-vérifie le token Google pour sécurité, puis crée le compte.
   */
  /**
   * POST /auth/google/code
   * Reçoit un authorization code (code flow popup) et l'échange contre des tokens.
   * Même logique métier que googleAuth mais via code OAuth2 au lieu de credential One Tap.
   */
  async googleCode(req, res) {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "code manquant" });

    try {
      const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "postmessage"
      );
      const { tokens } = await oAuth2Client.getToken(code);
      if (!tokens.id_token) throw new Error("Pas d'id_token dans la réponse Google");

      const payload = await authController._verifyGoogleToken(tokens.id_token);
      const { sub: googleId, email, given_name, family_name, name, picture } = payload;

      let user = await User.findOne({
        where: { [Op.or]: [{ google_id: googleId }, { email }] },
      });

      if (user) {
        if (!user.google_id) {
          await user.update({ google_id: googleId, avatar_url: picture || user.avatar_url });
        }
        authController._issueJwt(res, user);
        if (!isStaffRole(user.role)) {
          awardWeeklyLoginXP(user.id).catch(() => {});
          awardDailyLoginXP(user.id).catch(() => {});
        }
        return res.json({ status: "ok" });
      }

      const basePseudo = authController._sanitizePseudo(given_name || name || email.split("@")[0]);
      const pseudoExists = await User.findOne({ where: { pseudo: basePseudo } });

      if (pseudoExists) {
        // Pseudo pris : émettre un token temporaire signé par le serveur (15 min)
        const tempToken = jwt.sign(
          { googleId, email, given_name, family_name, picture, _type: "google_pending" },
          process.env.JWT_SECRET,
          { expiresIn: "15m" }
        );
        return res.json({
          status: "pseudo_required",
          googleData: { email, given_name, family_name, picture, suggestedPseudo: basePseudo },
          tempToken,
        });
      }

      user = await User.create({
        first_name: given_name || name || "Utilisateur",
        last_name: family_name || "",
        pseudo: basePseudo,
        email,
        password: null,
        google_id: googleId,
        avatar_url: picture || null,
        role: "user",
      });

      authController._issueJwt(res, user);
      return res.json({ status: "ok" });
    } catch (err) {
      console.error("Google code exchange error:", err.message);
      return res.status(401).json({ error: "Authentification Google échouée" });
    }
  },

  async googleComplete(req, res) {
    const { credential, tempToken, pseudo, first_name, last_name } = req.body;
    if ((!credential && !tempToken) || !pseudo)
      return res.status(400).json({ error: "Données manquantes" });

    // Validation basique du pseudo
    if (!/^[a-z0-9_]{3,20}$/.test(pseudo)) {
      return res.status(400).json({ error: "Pseudo invalide (3-20 car., lettres minuscules, chiffres, _)" });
    }

    try {
      let googleId, email, given_name, family_name, picture;

      if (tempToken) {
        // Code flow : vérifier le token temporaire émis par le serveur
        const data = jwt.verify(tempToken, process.env.JWT_SECRET);
        if (data._type !== "google_pending") throw new Error("Token invalide");
        ({ googleId, email, given_name, family_name, picture } = data);
      } else {
        // One Tap flow : vérifier le credential Google
        const payload = await authController._verifyGoogleToken(credential);
        ({ sub: googleId, email, given_name, family_name, picture } = payload);
      }

      // Vérifie unicité du pseudo et de l'email
      const existing = await User.findOne({
        where: { [Op.or]: [{ pseudo }, { email }, { google_id: googleId }] },
      });
      if (existing) {
        if (existing.pseudo === pseudo) return res.status(409).json({ error: "Ce pseudo est déjà utilisé" });
        // Compte déjà existant (email ou google_id) → connexion directe
        if (!existing.google_id) await existing.update({ google_id: googleId, avatar_url: picture || existing.avatar_url });
        authController._issueJwt(res, existing);
        return res.json({ status: "ok" });
      }

      const user = await User.create({
        first_name: first_name || given_name || "Utilisateur",
        last_name: last_name || family_name || "",
        pseudo,
        email,
        password: null,
        google_id: googleId,
        avatar_url: picture || null,
        role: "user",
      });

      authController._issueJwt(res, user);
      return res.json({ status: "ok" });
    } catch (err) {
      console.error("Google complete error:", err.message);
      return res.status(401).json({ error: "Token Google invalide ou expiré" });
    }
  },

  /**
   * GET /auth/google/callback?code=...
   * Reçoit le code d'autorisation Google via redirect flow.
   * Même logique que googleCode mais via GET redirect.
   */
  async googleCallback(req, res) {
    const { code } = req.query;
    if (!code) return res.redirect('/?error=google_no_code');

    try {
      const redirectUri = (process.env.BASE_URL || `${req.protocol}://${req.get('host')}`) + '/auth/google/callback';
      const oAuth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        redirectUri
      );
      const { tokens } = await oAuth2Client.getToken(code);
      if (!tokens.id_token) throw new Error("Pas d'id_token dans la réponse Google");

      const payload = await authController._verifyGoogleToken(tokens.id_token);
      const { sub: googleId, email, given_name, family_name, name, picture } = payload;

      let user = await User.findOne({
        where: { [Op.or]: [{ google_id: googleId }, { email }] },
      });

      if (user) {
        if (!user.google_id) await user.update({ google_id: googleId, avatar_url: picture || user.avatar_url });
        authController._issueJwt(res, user);
        if (!isStaffRole(user.role)) {
          awardWeeklyLoginXP(user.id).catch(() => {});
          awardDailyLoginXP(user.id).catch(() => {});
        }
        return res.redirect('/');
      }

      const basePseudo = authController._sanitizePseudo(given_name || name || email.split("@")[0]);
      const pseudoExists = await User.findOne({ where: { pseudo: basePseudo } });

      if (!pseudoExists) {
        user = await User.create({
          first_name: given_name || name || "Utilisateur",
          last_name: family_name || "",
          pseudo: basePseudo,
          email,
          password: null,
          google_id: googleId,
          avatar_url: picture || null,
          role: "user",
        });
        authController._issueJwt(res, user);
        return res.redirect('/');
      }

      // Pseudo pris → redirect avec paramètre pour que le frontend propose un pseudo
      const tempToken = jwt.sign(
        { googleId, email, given_name, family_name, picture, _type: "google_pending" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );
      return res.redirect(`/?google_pending=${encodeURIComponent(tempToken)}&suggested=${encodeURIComponent(basePseudo)}`);

    } catch (err) {
      console.error("Google callback error:", err.message);
      return res.redirect('/?error=google_auth_failed');
    }
  },

  //deconnexion
  async logout(req, res) {
    // Les options doivent correspondre à celles utilisées lors de la création du cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });
    res.redirect("/");
  },
};

export default authController;
