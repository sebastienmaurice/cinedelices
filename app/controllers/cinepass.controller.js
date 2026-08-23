import { User, Recipe, Movie, Notice } from "../models/index.model.js";
import { getUserGamificationData } from "../services/gamification.service.js";
import { xpProgress, RANK_TITLES } from "../utils/gamification.utils.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import { MOCK_BADGES, MOCK_UNIVERS, MOCK_BADGES_TOTAL } from "../utils/cinepass-mock.js";

const cinepassController = {
  /**
   * GET /cinepass/
   * Nouvel espace UX dédié à la gamification — consomme exclusivement les
   * données/services déjà existants (gamification.utils.js /
   * gamification.service.js), n'introduit AUCUNE nouvelle règle XP/niveau/
   * cadre. Les Badges et Univers affichés viennent de cinepass-mock.js
   * (isolés, remplaçables plus tard par de vraies données).
   */
  async cinepassPage(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user) return renderNotFound(res, "Utilisateur");

      const [userRecipes, userMovies, userNotices] = await Promise.all([
        Recipe.findAll({ where: { id_user: userId } }),
        Movie.findAll({ where: { id_user: userId } }),
        Notice.findAll({ where: { id_user: userId } }),
      ]);

      // Source de vérité unique — même fonction que le profil et la Page Auteur.
      const gamif = await getUserGamificationData(userId, {
        recipes: userRecipes,
        movies: userMovies,
        notices: userNotices,
        userRole: req.userRole,
      });

      const xpProg = xpProgress(gamif.xp, gamif.level);
      const nextRank = RANK_TITLES[gamif.level + 1] || null;

      // Cadres — collection réelle (déjà enrichie par le service : unlocked/isActive)
      const frames = gamif.frames.filter((f) => f.code !== "none");
      const unlockedFrames = frames.filter((f) => f.unlocked);
      const nextFrame = frames
        .filter((f) => !f.unlocked)
        .sort((a, b) => a.minLvl - b.minLvl)[0] || null;

      // Dernières contributions — résumé (les mêmes données que l'onglet
      // #contributions du profil, pas une 2ᵉ logique de calcul).
      const recentActivity = gamif.activity.slice(0, 4);

      res.render("cinepass", {
        user,
        xp: gamif.xp,
        level: gamif.level,
        rank: gamif.rank,
        nextRank,
        xpProg,
        frames,
        unlockedFrames,
        nextFrame,
        activeFrameCode: gamif.activeFrameCode,
        activeFrameUrl: gamif.activeFrameUrl,
        recentActivity,
        recipesCount: userRecipes.length,
        notices: userNotices,
        // Mocks isolés — voir app/utils/cinepass-mock.js
        mockBadges: MOCK_BADGES,
        mockBadgesTotal: MOCK_BADGES_TOTAL,
        mockUnivers: MOCK_UNIVERS,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
};

export default cinepassController;
