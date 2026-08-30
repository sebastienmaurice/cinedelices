import { User } from "../models/index.model.js";
import { getMockCollectionData, getMockUniversDetail, MOCK_PRESET_NAMES } from "../utils/collection-mock.js";
import { MOCK_BADGES } from "../utils/cinepass-mock.js";
import { checkUserTrophies, getUserTrophyCodes, REAL_TROPHY_CODES } from "../services/trophy.service.js";
import { getUserUniverseProgress, equipUniversReward, setActiveUnivers } from "../services/universe.service.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

const collectionController = {
  /**
   * GET /collection/
   * "Ma Collection" — destination unique regroupant Univers cinématographiques,
   * Fonds, Cadres d'Univers et Trophées.
   *
   * Phase 10 : la progression Univers est désormais RÉELLE par défaut
   * (app/services/universe.service.js, calculée depuis les vraies
   * contributions de l'utilisateur connecté). `?mock=<preset>` reste
   * disponible pour le dev/QA — notamment pour visualiser des états
   * (Spécialisation/Maîtrise) qu'aucun compte réel n'atteint encore —
   * mais n'est jamais utilisé par défaut. Fonds/Cadres/statuts/seuils
   * proviennent, dans les deux cas, du même moteur pur de
   * collection-mock.js (computeUniversState/buildUnivers/summarize),
   * seule la source de `contributionsByGenre` change.
   */
  async collectionPage(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user) return renderNotFound(res, "Utilisateur");

      const hasMockParam = MOCK_PRESET_NAMES.includes(req.query.mock);
      const preset = hasMockParam ? req.query.mock : "default";
      const collection = hasMockParam
        ? getMockCollectionData(preset)
        : await getUserUniverseProgress(userId);

      // Phase 9 — Trophées : 9 des 18 sont désormais réels (Groupe A). On
      // revérifie les conditions à chaque chargement (idempotent, cf.
      // trophy.service.js) pour que la page reflète toujours l'état à
      // jour même sans passer par un des points de déclenchement dédiés.
      // Best-effort : une erreur ici ne doit jamais empêcher /collection/
      // de s'afficher (les 18 trophées restent visibles avec leur dernier
      // état connu si la vérification échoue).
      await checkUserTrophies(userId).catch(() => {});
      const unlockedCodes = await getUserTrophyCodes(userId).catch(() => new Set());

      // Référentiel MOCK_BADGES inchangé pour les 5 trophées hors périmètre
      // (Recette Culte, Premier Rôle, Superstar du Palais, Empreinte
      // Éternelle, Ticket d'Or) — seul `unlocked` des 13 réels est
      // remplacé par l'état réel, jamais recalculé ni dupliqué ailleurs.
      const trophies = MOCK_BADGES.map((badge) =>
        REAL_TROPHY_CODES.includes(badge.code)
          ? { ...badge, unlocked: unlockedCodes.has(badge.code) }
          : badge
      );

      res.render("collection", {
        user,
        collection,
        mockPreset: preset,
        isMockMode: hasMockParam,
        trophies,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },

  /**
   * GET /collection/univers/:genre
   * Fiche détaillée d'un Univers — Phase 3. Phase 10 : même bascule
   * réel/mock que collectionPage, pour rester cohérente avec la grille
   * (sinon la fiche d'un Univers afficherait des chiffres différents de
   * la carte qui y mène).
   */
  async universDetailPage(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findByPk(userId, {
        attributes: { exclude: ["password"] },
      });
      if (!user) return renderNotFound(res, "Utilisateur");

      const hasMockParam = MOCK_PRESET_NAMES.includes(req.query.mock);
      const preset = hasMockParam ? req.query.mock : "default";

      let univers;
      if (hasMockParam) {
        univers = getMockUniversDetail(req.params.genre, preset);
      } else {
        const { universList } = await getUserUniverseProgress(userId);
        univers = universList.find((u) => u.code === req.params.genre) || null;
      }
      if (!univers) return renderNotFound(res, "Univers");

      res.render("collection-univers", {
        user,
        univers,
        mockPreset: preset,
        isMockMode: hasMockParam,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },

  /**
   * POST /collection/univers/:genre/fond
   * Équipe un Fond débloqué pour cet Univers (Phase 15). Body: { index }.
   * Revalidation complète côté service — jamais de confiance dans
   * l'index envoyé par le client.
   */
  async equiperFond(req, res) {
    try {
      const index = parseInt(req.body?.index, 10);
      if (!Number.isInteger(index)) return res.status(400).json({ success: false, error: "index_invalide" });
      const result = await equipUniversReward(req.userId, "fond", req.params.genre, index);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: "server_error" });
    }
  },

  /**
   * POST /collection/univers/:genre/cadre
   * Équipe un Cadre débloqué pour cet Univers (Phase 15). Body: { index }.
   */
  async equiperCadre(req, res) {
    try {
      const index = parseInt(req.body?.index, 10);
      if (!Number.isInteger(index)) return res.status(400).json({ success: false, error: "index_invalide" });
      const result = await equipUniversReward(req.userId, "cadre", req.params.genre, index);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: "server_error" });
    }
  },

  /**
   * POST /collection/univers-actif
   * Définit l'Univers actif (Phase 15). Body: { code }. Un Univers exploré
   * (>=1 contribution) suffit — pas besoin d'attendre un palier.
   */
  async setUniversActif(req, res) {
    try {
      const code = req.body?.code ?? null;
      const result = await setActiveUnivers(req.userId, code);
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      return res.status(500).json({ success: false, error: "server_error" });
    }
  },
};

export default collectionController;
