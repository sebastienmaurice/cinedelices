import { Op, fn, col } from "sequelize";
import { Recipe, Movie, Notice, User, Favorite, Rating, RecipePicture, UserPoints, NoticeLike, NoticePicture } from "../models/index.model.js";
import { enrichMovieWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { awardActionXP } from "../services/gamification.service.js";
import { computeLevel, xpProgress, FRAME_UNLOCKS, RANK_TITLES } from "../utils/gamification.utils.js";
import { processStepImages, cleanupFiles } from "../utils/recipe-image-processor.js";
import { timeAgo } from "../utils/time-ago.js";

// Nombre maximum de photos jointes à un avis (cf. uploadNoticePhotos, champ "noticePictures").
const NOTICE_MAX_PICTURES = 3;

/**
 * Récupère les IDs des recettes favorites de l'utilisateur
 * @param {number|undefined} userId - ID de l'utilisateur connecté
 * @returns {Promise<number[]>} - Liste des IDs de recettes favorites
 */
async function getUserFavoriteRecipeIds(userId) {
  if (!userId) return [];

  const favorites = await Favorite.findAll({
    where: { id_user: userId, entity_type: "recipe" },
    attributes: ["entity_id"],
  });

  return favorites.map((f) => f.entity_id);
}

/**
 * Récupère les notes de l'utilisateur pour les recettes
 * @param {number|undefined} userId - ID de l'utilisateur connecté
 * @returns {Promise<Object>} - Map entityId -> score
 */
async function getUserRecipeRatings(userId) {
  if (!userId) return {};

  const ratings = await Rating.findAll({
    where: { id_user: userId, entity_type: "recipe" },
    attributes: ["entity_id", "score"],
  });

  return ratings.reduce((acc, r) => {
    acc[r.entity_id] = r.score;
    return acc;
  }, {});
}

/**
 * Récupère les moyennes des notes pour les recettes
 * @param {number[]} recipeIds - IDs des recettes
 * @returns {Promise<Object>} - Map entityId -> { average, count }
 */
async function getRecipeAverageRatings(recipeIds) {
  if (!recipeIds || recipeIds.length === 0) return {};

  const avgRatings = await Rating.findAll({
    where: { entity_type: "recipe", entity_id: { [Op.in]: recipeIds } },
    attributes: [
      "entity_id",
      [fn("AVG", col("score")), "average"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["entity_id"],
    raw: true,
  });

  return avgRatings.reduce((acc, r) => {
    acc[r.entity_id] = {
      average: parseFloat(r.average).toFixed(1),
      count: parseInt(r.count),
    };
    return acc;
  }, {});
}

/**
 * Enrichit les recettes avec favoris et notes
 * @param {Array} recipes - Liste des recettes
 * @param {number[]} favoriteIds - IDs des recettes favorites
 * @param {Object} userRatingsMap - Notes de l'utilisateur
 * @param {Object} avgRatingsMap - Moyennes des notes
 * @returns {Array} - Recettes enrichies
 */
// isNew = état dérivé, jamais stocké : status approved + validated_at (ou createdAt) < 3 jours
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap) {
  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS);
  return recipes.map((recipe) => {
    const plain = recipe.toJSON ? recipe.toJSON() : recipe;
    const avgData = avgRatingsMap[plain.id];
    // validated_at en priorité (date réelle de validation admin), sinon createdAt en fallback
    const refDate = plain.validated_at
      ? new Date(plain.validated_at)
      : plain.createdAt
        ? new Date(plain.createdAt)
        : null;

    return {
      ...plain,
      // plain.contributor est déjà peuplé par Sequelize grâce à l'alias "contributor"
      isFavorite: favoriteIds.includes(plain.id),
      userRating: userRatingsMap[plain.id] || null,
      avgRating: avgData ? avgData.average : null,
      ratingCount: avgData ? avgData.count : 0,
      // isNew : calculé dynamiquement, non persisté en base
      isNew: plain.status === "approved" && refDate ? refDate >= threeDaysAgo : false,
    };
  });
}

const recipesController = {
  // Afficher toutes les recettes (filtre catégorie + recherche)
  async allRecipes(req, res) {
    try {
      const category = (req.query.category || "all").trim().toLowerCase();
      const q = (req.query.q || "").trim();
      const sort = req.query.sort || "recent";

      const whereClause = { status: "approved" };
      if (category !== "all") whereClause.category = category;
      if (q) whereClause.name = { [Op.iLike]: `%${q}%` };

      // Tri Sequelize (sauf "rating" calculé après enrichissement)
      let order;
      if (sort === "oldest") order = [["validated_at", "ASC"]];
      else if (sort === "duration") order = [["duration", "ASC"]];
      else order = [["validated_at", "DESC"]]; // "recent" par défaut

      const recipes = await Recipe.findAll({
        where: whereClause,
        include: [
          { model: User, as: "contributor", attributes: ["id", "pseudo", "picture", "role"] },
          { model: Movie, attributes: ["id", "title", "slug"], required: false },
          { model: RecipePicture, as: "RecipePictures", attributes: ["file_path", "position"], where: { position: 1 }, required: false },
        ],
        order,
      });

      const recipeIds = recipes.map((r) => r.id);
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings(recipeIds);
      let enrichedRecipes = enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap);

      // Tri par note (en mémoire, avgRating calculé après enrichissement)
      if (sort === "rating") {
        enrichedRecipes = enrichedRecipes.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      }

      const distinctMovies = new Set(recipes.filter((r) => r.Movie).map((r) => r.Movie.id));

      res.render("all-recipes", {
        recipes: enrichedRecipes,
        totalCount: enrichedRecipes.length,
        movieCount: distinctMovies.size,
        categoryFilter: category,
        searchQuery: q,
        sortBy: sort,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
  // Afficher le film et ses recettes
  async movieRecipes(req, res) {
    try {
      const param = req.params.id;
      let movie;

      if (/^\d+$/.test(param)) {
        // Ancienne URL numérique → redirect 301 vers slug
        movie = await Movie.findOne({ where: { id: param, status: "approved" } });
        if (movie?.slug) return res.redirect(301, `/recipes-movie/${movie.slug}`);
        if (movie) return res.redirect(301, `/recipes-movie/${movie.id}`);
      } else {
        movie = await Movie.findOne({ where: { slug: param, status: "approved" } });
      }

      // Utilisation du helper centralisé pour les erreurs 404
      if (!movie) {
        return renderNotFound(res, "Film");
      }

      // Toutes les recettes du film — jointure User via alias "contributor"
      const recipes = await Recipe.findAll({
        where: { id_movie: movie.id, status: "approved" },
        include: [
          {
            model: User,
            as: "contributor",
            attributes: ["id", "pseudo", "picture", "role"],
          },
          {
            model: RecipePicture,
            as: "RecipePictures",
            attributes: ["file_path", "position"],
            where: { position: 1 },
            required: false,
          },
        ],
      });

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      // Récupérer les favoris et notes de l'utilisateur connecté
      const recipeIds = recipes.map((r) => r.id);
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings(recipeIds);
      const enrichedRecipes = enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap);
      res.render("recipes-movie", {
        movie: enrichedMovie,
        recipes: enrichedRecipes,
        authorDisplayName: "",
        isAuthorFiltered: false,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
  /*
    movieRecipes :
    - Récupère un film par son id avec Movie.findByPk
    - Si aucun film trouvé => 404
    - Charge toutes les recettes associées (Recipe.findAll avec id_movie)
    - Rend la vue "recipes-movie" avec le film, les recettes et le rôle utilisateur
  */

  // Filtrage des recettes du film par catégorie
  async filtredRecipes(req, res) {
    try {
      const { id: param, category } = req.params;
      let movie;

      if (/^\d+$/.test(param)) {
        // Ancienne URL numérique → redirect 301 vers slug
        movie = await Movie.findOne({ where: { id: param, status: "approved" } });
        if (movie?.slug) return res.redirect(301, `/recipes-movie/category/${movie.slug}/${category}`);
        if (movie) return res.redirect(301, `/recipes-movie/category/${movie.id}/${category}`);
      } else {
        movie = await Movie.findOne({ where: { slug: param, status: "approved" } });
      }

      if (!movie) {
        return renderNotFound(res, "Film");
      }

      // Jointure User via alias "contributor" — même include dans les 2 cas
      const userInclude = [
        { model: User, as: "contributor", attributes: ["id", "pseudo", "picture", "role"] },
        { model: RecipePicture, as: "RecipePictures", attributes: ["file_path", "position"], where: { position: 1 }, required: false },
      ];

      let recipes;
      if (!category || category === "all") {
        recipes = await Recipe.findAll({
          where: { id_movie: movie.id, status: "approved" },
          include: userInclude,
        });
      } else {
        recipes = await Recipe.findAll({
          where: {
            id_movie: movie.id,
            category: category,
            status: "approved",
          },
          include: userInclude,
        });
      }

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      // Récupérer les favoris et notes de l'utilisateur connecté
      const recipeIds = recipes.map((r) => r.id);
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings(recipeIds);
      const enrichedRecipes = enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap);

      res.render("recipes-movie", {
        movie: enrichedMovie,
        recipes: enrichedRecipes,
        authorDisplayName: "",
        isAuthorFiltered: false,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
  /*
    filtredRecipes :
    - Récupère les paramètres id du film et la catégorie
    - Vérifie que le film existe sinon 404
    - Charge les recettes du film :
        * toutes si category absent ou "all"
        * sinon filtre sur la colonne category
    - Rend la vue "recipes-movie" avec la liste filtrée
  */

  // Afficher le détail d'une recette spécifique
  async detailRecipes(req, res) {
    try {
      const param = req.params.id;
      let recipe;

      if (/^\d+$/.test(param)) {
        // Ancienne URL numérique → redirect 301 vers slug
        recipe = await Recipe.findOne({ where: { id: param, status: "approved" } });
        if (recipe?.slug) return res.redirect(301, `/recipes-movie/details/${recipe.slug}`);
        if (recipe) return res.redirect(301, `/recipes-movie/details/${recipe.id}`);
      } else {
        recipe = await Recipe.findOne({ where: { slug: param, status: "approved" } });
      }

      // Refactoring : utilisation du helper centralisé renderNotFound()
      if (!recipe) {
        return renderNotFound(res, "Recette");
      }

      const plainRecipe = recipe.get({ plain: true });

      // Pas de filtre status : si la recette est approuvée, son film est accessible
      // (les films TMDB sont auto-approuvés ; les films manuels peuvent être encore en attente)
      const movie = await Movie.findOne({
        where: { id: plainRecipe.id_movie },
      });
      const enrichedMovie = movie ? enrichMovieWithImagePaths(movie) : null;

      // Auteur obligatoire (id_user NOT NULL) — récupération directe sans fallback
      const contributor = await User.findByPk(plainRecipe.id_user, {
        attributes: ["id", "pseudo", "picture", "first_name", "last_name", "role"],
      });

      // Formatage du texte pour l'affichage
      // Ces fonctions extraient les blocs de texte pour faciliter l'affichage dans la vue
      const descriptionBlocks = formatDescriptionBlocks(
        plainRecipe.description
      );
      const ingredientsBlocks = formatIngredientsBlocks(
        plainRecipe.ingredients
      );
      const preparationBlocks = formatPreparationBlocks(
        plainRecipe.preparation
      );

      // Récupérer les avis associés à la recette (racines uniquement — les
      // réponses sont chargées à part via l'association "replies") avec les
      // infos utilisateur, les photos jointes et les réponses.
      const noticeUserAttrs = ["id", "pseudo", "first_name", "last_name", "picture", "role"];
      const notices = await Notice.findAll({
        where: { id_recipe: plainRecipe.id, status: "approved", parent_id: null },
        include: [
          { model: User, attributes: noticeUserAttrs },
          { model: NoticePicture, as: "pictures", attributes: ["file_path", "position"] },
          {
            model: Notice,
            as: "replies",
            where: { status: "approved" },
            required: false,
            include: [{ model: User, attributes: noticeUserAttrs }],
          },
        ],
        order: [["id", "DESC"]], // Plus récents en premier
      });

      // Avis likés par l'utilisateur connecté (racines + réponses)
      let likedNoticeIds = new Set();
      if (req.userId) {
        const likedRows = await NoticeLike.findAll({
          where: { id_user: req.userId },
          attributes: ["id_notice"],
          raw: true,
        });
        likedNoticeIds = new Set(likedRows.map((r) => r.id_notice));
      }

      // Niveau + cadre actif de chaque auteur d'avis (racines + réponses) —
      // affiché en anneau doré autour de l'avatar, comme sur la page auteur.
      const noticeAuthorIds = new Set();
      notices.forEach((n) => {
        if (n.id_user) noticeAuthorIds.add(n.id_user);
        (n.replies || []).forEach((r) => r.id_user && noticeAuthorIds.add(r.id_user));
      });
      const authorPointsRows = noticeAuthorIds.size
        ? await UserPoints.findAll({
            where: { id_user: Array.from(noticeAuthorIds) },
            raw: true,
          })
        : [];
      const authorLevelMap = {};
      authorPointsRows.forEach((row) => {
        const level = computeLevel(row.points);
        const frame = FRAME_UNLOCKS.find((f) => f.code === row.active_frame_code) || FRAME_UNLOCKS[0];
        authorLevelMap[row.id_user] = { level, frameThumb: frame.thumbUrl };
      });

      const decorateNotice = (n) => ({
        ...n,
        timeAgo: timeAgo(n.createdAt),
        likedByUser: likedNoticeIds.has(n.id),
        authorLevel: authorLevelMap[n.id_user]?.level || 1,
        authorFrameThumb: authorLevelMap[n.id_user]?.frameThumb || null,
      });

      const plainNotices = notices.map((notice) => {
        const plain = notice.get({ plain: true });
        return {
          ...decorateNotice(plain),
          pictures: (plain.pictures || []).sort((a, b) => a.position - b.position),
          replies: (plain.replies || []).map(decorateNotice),
        };
      });

      //! Calcul de la moyenne des notes (avis racines uniquement, notés 1-5)
      // Moyenne décimale (ex. "4.3") — plus précise et cohérente avec la note
      // TMDB des films ("7.8/10") et avgRating des recettes (déjà en .toFixed(1)).
      // Les étoiles pleines/vides continuent d'utiliser Math.round(averageQuote)
      // à l'affichage : la précision décimale ne concerne que le chiffre affiché.
      let averageQuote = 0; // Valeur par défaut si pas d'avis
      if (plainNotices.length > 0) {
        const sum = plainNotices.reduce((acc, n) => acc + (n.quote || 0), 0); // Somme des notes
        averageQuote = (sum / plainNotices.length).toFixed(1); // ex. "4.3" (toujours 1 décimale)
      }

      // Vérifier si cette recette est en favori et récupérer les notes
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const isFavorite = favoriteIds.includes(plainRecipe.id);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings([plainRecipe.id]);
      const userRating = userRatingsMap[plainRecipe.id] || null;
      const avgData = avgRatingsMap[plainRecipe.id];

      // Photos complémentaires (positions 2 et 3) pour le carousel de la page détail
      const recipePictures = await RecipePicture.findAll({
        where: { recipe_id: plainRecipe.id },
        order: [["position", "ASC"]],
        raw: true,
      });

      // Progression XP/niveau du contributeur — version condensée (avatar,
      // pseudo, niveau, barre XP) affichée à côté de la galerie. Lecture
      // seule du total de points déjà calculé (pas de recomputation ici,
      // contrairement à syncUserXP() utilisé sur la page profil).
      const contributorPoints = contributor
        ? await UserPoints.findOne({ where: { id_user: contributor.id }, raw: true })
        : null;
      const contributorXp = contributorPoints ? contributorPoints.points : 0;
      const contributorLevel = computeLevel(contributorXp);
      const contributorXpProgress = xpProgress(contributorXp, contributorLevel);
      // Cadres débloqués — même logique que getUserGamificationData(), sans
      // le recalcul XP complet (lecture seule, cf. commentaire plus haut).
      const contributorFrames = FRAME_UNLOCKS.filter(
        (f) => f.code !== "none" && contributorLevel >= f.minLvl
      );
      const contributorRank = RANK_TITLES[contributorLevel] || RANK_TITLES[1];
      // Nombre de recettes publiées par ce contributeur — même métrique que la page /auteur/#
      const contributorRecipesCount = contributor
        ? await Recipe.count({ where: { id_user: contributor.id, status: "approved" } })
        : 0;

      // Recettes recommandées — priorité aux autres recettes du même film,
      // repli sur la même catégorie si besoin, jusqu'à 8 résultats (carrousel).
      const RECO_LIMIT = 8;
      let recommendedRecipes = [];
      if (plainRecipe.id_movie) {
        recommendedRecipes = await Recipe.findAll({
          where: { id_movie: plainRecipe.id_movie, id: { [Op.ne]: plainRecipe.id }, status: "approved" },
          include: [{ model: Movie, attributes: ["title", "slug", "id"] }],
          limit: RECO_LIMIT,
          order: [["id", "DESC"]],
        });
      }
      if (recommendedRecipes.length < RECO_LIMIT && plainRecipe.category) {
        const excludeIds = [plainRecipe.id, ...recommendedRecipes.map((r) => r.id)];
        const fallback = await Recipe.findAll({
          where: { category: plainRecipe.category, id: { [Op.notIn]: excludeIds }, status: "approved" },
          include: [{ model: Movie, attributes: ["title", "slug", "id"] }],
          limit: RECO_LIMIT - recommendedRecipes.length,
          order: [["id", "DESC"]],
        });
        recommendedRecipes = [...recommendedRecipes, ...fallback];
      }
      const plainRecommended = recommendedRecipes.map((r) => r.get({ plain: true }));

      res.render("recipe-detail", {
        recipe: {
          ...plainRecipe,
          isFavorite,
          userRating,
          avgRating: avgData ? avgData.average : null,
          ratingCount: avgData ? avgData.count : 0,
        },
        movie: enrichedMovie,
        descriptionBlocks,
        ingredientsBlocks,
        preparationBlocks,
        averageQuote,
        totalAvis: plainNotices.length,
        notices: plainNotices,
        recipePictures,
        // Auteur toujours présent (id_user NOT NULL)
        contributor: {
          ...(contributor.get ? contributor.get({ plain: true }) : contributor),
          pseudo:
            contributor.pseudo ||
            [contributor.first_name, contributor.last_name].filter(Boolean).join(" "),
          level: contributorLevel,
          xp: contributorXp,
          xpProgress: contributorXpProgress,
          frames: contributorFrames,
          framesTotal: FRAME_UNLOCKS.length - 1, // total débloquable, hors "sans cadre"
          rank: contributorRank,
          recipesCount: contributorRecipesCount,
        },
        recommendedRecipes: plainRecommended,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
    }
  },
  /*
    detailRecipes :
    - Trouve une recette par son id
    - Si introuvable => 404
    - Convertit la recette en objet simple (plain)
    - Formate description, ingrédients, préparation en tableaux prêts à afficher
    - Rend la vue "recipe-detail" avec la recette et les blocs formatés
  */
};

/**
 * Fonctions utilitaires internes pour le formatage du texte
 * Simplification Étape 3.2 : Extraction des fonctions de formatage pour améliorer la lisibilité
 */

/**
 * Formate la description en paragraphes (séparés par des retours à la ligne doubles)
 * @param {string} description - Texte de description
 * @returns {Array<string>} - Tableau de paragraphes formatés
 */
function formatDescriptionBlocks(description) {
  return (description || "")
    .replace(/\r\n/g, "\n") // Normaliser les retours à la ligne
    .split(/\n{2,}/) // Séparer par retours à la ligne doubles (paragraphes)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean); // Retirer les chaînes vides
}

/**
 * Formate les ingrédients en liste.
 * Accepte le nouveau format JSON ["item1","item2"] ou l'ancien format texte brut (retours à la ligne).
 * @param {string} ingredients
 * @returns {Array<string>}
 */
function formatIngredientsBlocks(ingredients) {
  const raw = (ingredients || "").trim();
  if (raw.startsWith("[")) {
    try {
      return JSON.parse(raw).map((s) => String(s).trim()).filter(Boolean);
    } catch (_) {}
  }
  // Ancien format : un ingrédient par ligne
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

// Libellés affichés pour le type d'étape (voir add-recipes-movies.ejs STEP_TYPES)
const STEP_TYPE_LABELS = {
  preparation: "Préparation",
  cuisson: "Cuisson",
  repos: "Repos",
  service: "Service",
};

/**
 * Extrait le titre (+ type/durée éventuels) d'une étape depuis son HTML.
 * Cherche un <strong [data-type="..."] [data-duration="..."]> en début de
 * contenu : "1. Titre" → title="Titre", body=reste.
 * @param {string} html
 * @returns {{ title: string, body: string, type: string|null, typeLabel: string|null, duration: number|null }}
 */
function extractStepTitle(html) {
  const m = html.match(/^<strong([^>]*)>([\s\S]*?)<\/strong>([\s\S]*)$/i);
  if (!m) return { title: '', body: html, type: null, typeLabel: null, duration: null };

  const attrs = m[1] || '';
  const typeMatch = attrs.match(/data-type="([^"]*)"/);
  const durationMatch = attrs.match(/data-duration="([^"]*)"/);
  const type = typeMatch && typeMatch[1] ? typeMatch[1] : null;
  const duration = durationMatch && durationMatch[1] ? parseInt(durationMatch[1], 10) : null;

  // Nettoyer le titre : retirer "N. " ou "N - " en tête
  const title = m[2].replace(/^\d+[\s.]*[-–—]?\s*/, '').trim();

  // Nettoyer le début du body : retirer <br> et tiret éventuels
  const body = m[3]
    .replace(/^(<br\s*\/?>\s*)+/i, '')
    .replace(/^\s*[-–—]\s*/, '')
    .trim();

  return {
    title,
    body: body || m[3].trim(),
    type,
    typeLabel: type && STEP_TYPE_LABELS[type] ? STEP_TYPE_LABELS[type] : null,
    duration: Number.isFinite(duration) ? duration : null,
  };
}

/**
 * Formate la préparation en étapes.
 * Accepte le nouveau format JSON ["étape1","étape2"] ou l'ancien format texte brut.
 * Retourne des objets { title, body } pour le rendu dans la vue.
 * @param {string} preparation
 * @returns {Array<{title: string, body: string}>}
 */
function formatPreparationBlocks(preparation) {
  const raw = (preparation || "").trim();
  let steps = [];

  if (raw.startsWith("[")) {
    try {
      steps = JSON.parse(raw).map((s) => String(s).trim()).filter(Boolean);
    } catch (_) {}
  }

  if (!steps.length) {
    steps = raw
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .flatMap((chunk) => chunk.split(/\n/))
      .map((step) => step.trim())
      .filter(Boolean);
  }

  return steps.map(extractStepTitle);
}

// Ajouter submitNotice dans l'objet recipesController
recipesController.submitNotice = async function submitNotice(req, res) {
  const pictureFiles = req.files?.noticePictures || [];
  try {
    const param = req.params.id;
    const { comment, quote, parentId, anonymous } = req.body;
    const isReply = !!parentId;
    const parsedQuote = parseInt(quote, 10);
    const isAnonymous = anonymous === "true" || anonymous === "on" || anonymous === "1";

    if (!comment || !comment.trim()) {
      cleanupFiles(pictureFiles);
      return res.status(400).json({ success: false, message: "Le contenu de l'avis est obligatoire." });
    }
    // Une réponse n'a pas de note — seul l'avis racine est noté.
    if (!isReply && (!parsedQuote || parsedQuote < 1 || parsedQuote > 5)) {
      cleanupFiles(pictureFiles);
      return res.status(400).json({ success: false, message: "La note doit être comprise entre 1 et 5." });
    }
    if (pictureFiles.length > NOTICE_MAX_PICTURES) {
      cleanupFiles(pictureFiles);
      return res.status(400).json({
        success: false,
        message: `Vous pouvez joindre au maximum ${NOTICE_MAX_PICTURES} photos.`,
      });
    }

    let recipe;
    if (/^\d+$/.test(param)) {
      recipe = await Recipe.findOne({ where: { id: param, status: "approved" } });
    } else {
      recipe = await Recipe.findOne({ where: { slug: param, status: "approved" } });
    }
    if (!recipe) {
      cleanupFiles(pictureFiles);
      return res.status(404).json({ success: false, message: "Recette introuvable." });
    }

    let parentNotice = null;
    if (isReply) {
      parentNotice = await Notice.findOne({ where: { id: parentId, id_recipe: recipe.id } });
      if (!parentNotice) {
        cleanupFiles(pictureFiles);
        return res.status(404).json({ success: false, message: "Avis d'origine introuvable." });
      }
    }

    // Traitement des photos jointes (pipeline allégé, cf. photos d'étapes de préparation)
    let processedPictures = [];
    if (pictureFiles.length > 0) {
      try {
        processedPictures = await processStepImages(pictureFiles);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: `Impossible de traiter la photo "${err.filename || ""}". Vérifiez le format et réessayez.`,
        });
      }
    }

    const notice = await Notice.create({
      content: comment.trim(),
      quote: isReply ? 0 : parsedQuote,
      id_user: req.userId,
      id_recipe: recipe.id,
      parent_id: isReply ? parentNotice.id : null,
      is_anonymous: isAnonymous,
      status: "pending",
    });

    if (processedPictures.length > 0) {
      await NoticePicture.bulkCreate(
        processedPictures.map((p, idx) => ({
          id_notice: notice.id,
          file_path: p.relPath,
          position: idx + 1,
        }))
      );
    }

    // XP pour les membres uniquement (fire-and-forget)
    const xpResult = await awardActionXP(req.userId, req.userRole, "comment_posted").catch(() => null);

    return res.json({
      success:   true,
      message:   isReply
        ? "Votre réponse a été envoyée et sera publiée après modération."
        : "Votre avis a été envoyé et sera publié après modération.",
      xpGained:  xpResult?.xpGained  ?? 0,
      newXP:     xpResult?.newXP      ?? 0,
      newLevel:  xpResult?.newLevel   ?? 0,
      leveledUp: xpResult?.leveledUp  ?? false,
      rank:      xpResult?.rank       ?? "",
    });
  } catch (error) {
    cleanupFiles(pictureFiles);
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

export default recipesController;
