import { Op, fn, col } from "sequelize";
import { Recipe, Movie, Notice, User, Favorite, Rating, UserPoints, CreatorPost } from "../models/index.model.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { getUserGamificationData } from "../services/gamification.service.js";
import { xpProgress } from "../utils/gamification.utils.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { resolveHeroBanner, FRAME_BANNERS, DEFAULT_HERO_BANNER } from "../utils/frame-banners.js";
import { getUserUniverseProgress } from "../services/universe.service.js";
import { resolveCreatorTheme } from "../services/creator-theme.service.js";
import { getFrameGeometry } from "../services/frame-geometry.service.js";

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
/* Date de publication d'un post TikTok : les 32 bits de poids fort de son identifiant
   sont un horodatage Unix (secondes). Retourne un timestamp en ms, ou 0 si illisible. */
function tiktokPublishedAt(url) {
  const m = String(url || "").match(/\/(?:video|photo)\/(\d{15,22})/);
  if (!m) return 0;
  try {
    const sec = Number(BigInt(m[1]) >> 32n);
    return sec > 1.4e9 && sec < 2.2e9 ? sec * 1000 : 0;
  } catch { return 0; }
}

/* Mentions spéciales donnant droit à une page auteur sans recette publiée */
const PARTNER_TITLES = ["Créatrice Partenaire", "Créateur Partenaire"];

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

      // Seuls les auteurs avec au moins 1 recette approuvée ont une page auteur,
      // sauf les créateurs partenaires (mention spéciale) dont la page est visible
      // dès l'inscription pour pouvoir la partager avant la première recette.
      const isPartner = PARTNER_TITLES.includes(author.special_title);
      const approvedCount = await Recipe.count({
        where: { id_user: userId, status: "approved" },
      });
      if (approvedCount === 0 && !isPartner) return renderNotFound(res, "Auteur");

      // Recettes approuvées de l'auteur (avec film et notes)
      const recipes = await Recipe.findAll({
        where: { id_user: userId, status: "approved" },
        include: [
          { model: User, as: "contributor", attributes: ["id", "pseudo", "picture", "role", "special_title"] },
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

      // Bannière du Hero — même priorité que sur /cinepass/ (perso approuvée >
      // variante choisie du cadre équipé > défaut), voir app/utils/frame-banners.js.
      const points = await UserPoints.findOne({ where: { id_user: userId }, attributes: ["active_banner_variant"] });
      const activeBannerVariant = points?.active_banner_variant || null;
      const heroBannerUrl = resolveHeroBanner(author, gamif.activeFrameCode, DEFAULT_HERO_BANNER, activeBannerVariant);
      const frameBannerVariants = FRAME_BANNERS[gamif.activeFrameCode] || [];

      // Phase 15 — Univers actif + Sceau de Maître (Ma Collection). Texte/
      // accent uniquement pour l'instant (pas de visuel Fond/Cadre réel).
      // Sceau calculé à la volée depuis le statut de l'Univers actif —
      // aucune donnée persistée dédiée (validation Phase 15).
      const { universList } = await getUserUniverseProgress(userId);
      const activeUnivers = universList.find((u) => u.actif) || null;
      const hasSceauDeMaitre = !!(activeUnivers && activeUnivers.status === "maitrise");

      // Bande carrousel des posts (créateurs partenaires)
      const creatorPosts = await CreatorPost.findAll({
        where: { id_user: userId },
        order: [["position", "ASC"], ["id", "ASC"]],
      });

      // Bannière « espace créateur » (remplace la bannière rouge pour les partenaires)
      const socials = author.social_links || {};
      const handleMatch = String(socials.tiktok || socials.instagram || "").match(/\/@?([A-Za-z0-9._]+)\/?$/);
      const creatorPostsView = creatorPosts.map((p) => ({ ...p.toJSON(), publishedAt: tiktokPublishedAt(p.url) }));
      const _theme = isPartner ? resolveCreatorTheme(author) : null;
      const _frameGeom = _theme && _theme.frame ? await getFrameGeometry(_theme.frame) : null;
      const creatorBanner = isPartner
        ? {
            theme: _theme,
            frameGeom: _frameGeom,
            socials,
            handle: handleMatch ? handleMatch[1] : null,
            primaryUrl: socials.tiktok || socials.instagram || socials.youtube || socials.website || null,
            hasPosts: creatorPosts.length > 0,
          }
        : null;

      return res.render("author-page", {
        author,
        creatorPosts: creatorPostsView,
        creatorBanner,
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
        noticesCount:    allNotices.length,
        unlockedFramesCount: userFrames.filter((f) => f.unlocked).length,
        xpPct:           xpProg.pct,
        xpCurrent:       xpProg.current,
        xpNeeded:        xpProg.needed,
        ctaMovies,
        heroBannerUrl,
        frameBannerVariants,
        activeBannerVariant,
        activeUnivers,
        hasSceauDeMaitre,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
};

export default authorController;
