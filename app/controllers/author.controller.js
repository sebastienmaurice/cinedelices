import { Op, fn, col } from "sequelize";
import { Recipe, Movie, Notice, User, Favorite, Rating } from "../models/index.model.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { getUserGamificationData } from "../services/gamification.service.js";
import { xpProgress } from "../utils/gamification.utils.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";

/* ─────────────────────────────────────────────────────
   Helpers partagés (favoris, notes, enrichissement)
───────────────────────────────────────────────────── */
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

async function _getFavoriteRecipeIds(userId) {
  if (!userId) return [];
  const favs = await Favorite.findAll({
    where: { id_user: userId, entity_type: "recipe" },
    attributes: ["entity_id"],
  });
  return favs.map((f) => f.entity_id);
}

async function _getUserRecipeRatings(userId) {
  if (!userId) return {};
  const rows = await Rating.findAll({
    where: { id_user: userId, entity_type: "recipe" },
    attributes: ["entity_id", "score"],
  });
  return rows.reduce((acc, r) => { acc[r.entity_id] = r.score; return acc; }, {});
}

async function _getAvgRatings(recipeIds) {
  if (!recipeIds?.length) return {};
  const rows = await Rating.findAll({
    where: { entity_type: "recipe", entity_id: { [Op.in]: recipeIds } },
    attributes: [
      "entity_id",
      [fn("AVG", col("score")), "average"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["entity_id"],
    raw: true,
  });
  return rows.reduce((acc, r) => {
    acc[r.entity_id] = { average: parseFloat(r.average).toFixed(1), count: parseInt(r.count) };
    return acc;
  }, {});
}

function _enrichRecipes(recipes, favoriteIds, userRatingsMap, avgRatingsMap) {
  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS);
  return recipes.map((recipe) => {
    const plain = recipe.toJSON ? recipe.toJSON() : recipe;
    const avgData = avgRatingsMap[plain.id];
    const refDate = plain.validated_at
      ? new Date(plain.validated_at)
      : plain.createdAt ? new Date(plain.createdAt) : null;
    return {
      ...plain,
      isFavorite: favoriteIds.includes(plain.id),
      userRating: userRatingsMap[plain.id] || null,
      avgRating: avgData ? avgData.average : null,
      ratingCount: avgData ? avgData.count : 0,
      isNew: plain.status === "approved" && refDate ? refDate >= threeDaysAgo : false,
    };
  });
}

/* ─────────────────────────────────────────────────────
   Controller
───────────────────────────────────────────────────── */
const authorController = {
  /**
   * GET /auteur/:id
   * Page publique de l'auteur : hero gamification + liste de ses recettes approuvées.
   */
  async authorPage(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId || isNaN(userId)) return renderNotFound(res, "Auteur");

      const author = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!author) return renderNotFound(res, "Auteur");

      // Seuls les auteurs avec au moins 1 recette approuvée ont une page auteur
      const approvedCount = await Recipe.count({
        where: { id_user: userId, status: "approved" },
      });
      if (approvedCount === 0) return renderNotFound(res, "Auteur");

      // Recettes approuvées de l'auteur (avec film et notes)
      const recipes = await Recipe.findAll({
        where: { id_user: userId, status: "approved" },
        include: [
          { model: User, as: "contributor", attributes: ["id", "pseudo", "picture", "role"] },
          { model: Movie, attributes: ["id", "title", "slug"], required: false },
        ],
        order: [["validated_at", "DESC"]],
      });

      const recipeIds = recipes.map((r) => r.id);
      const [favoriteIds, userRatingsMap, avgRatingsMap] = await Promise.all([
        _getFavoriteRecipeIds(req.userId),
        _getUserRecipeRatings(req.userId),
        _getAvgRatings(recipeIds),
      ]);
      const enrichedRecipes = _enrichRecipes(recipes, favoriteIds, userRatingsMap, avgRatingsMap);

      // Toutes les contributions (approuvées ou non) pour le calcul XP
      const [allRecipes, allMovies, allNotices] = await Promise.all([
        Recipe.findAll({ where: { id_user: userId } }),
        Movie.findAll({ where: { id_user: userId } }),
        Notice.findAll({ where: { id_user: userId } }),
      ]);

      // Films approuvés pour le CTA banner (animation affiches)
      const ctaMoviesRaw = await Movie.findAll({
        where: { status: "approved" },
        limit: 12,
        order: [["id", "DESC"]],
      });
      const ctaMovies = enrichMoviesWithImagePaths(ctaMoviesRaw);

      const gamif = await getUserGamificationData(userId, {
        recipes:  allRecipes,
        movies:   allMovies,
        notices:  allNotices,
        userRole: author.role,
      });

      const xpProg = xpProgress(gamif.xp, gamif.level);
      const isOwner = !!(req.userId && parseInt(req.userId, 10) === userId);

      const isAdminAuthor = author.role === "admin" || author.role === "superadmin";

      // Tous les cadres sauf "none" — débloqués et verrouillés affichés sur la page auteur
      const userFrames = gamif.frames.filter((f) => f.code !== 'none');

      return res.render("author-page", {
        author,
        recipes: enrichedRecipes,
        recipesCount: approvedCount,
        isOwner,
        isAdminAuthor,
        // Gamification
        userXP:          gamif.xp,
        userLevel:       gamif.level,
        userRank:        gamif.rank,
        userActiveFrame: gamif.activeFrameUrl,
        userActiveFrameId: gamif.activeFrameCode,
        userFrames,
        xpPct:           xpProg.pct,
        xpCurrent:       xpProg.current,
        xpNeeded:        xpProg.needed,
        ctaMovies,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
};

export default authorController;
