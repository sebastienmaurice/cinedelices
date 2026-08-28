import { UserPoints } from "../models/index.model.js";
import { computeLevel, FRAME_UNLOCKS, isSuperAdminRole } from "../utils/gamification.utils.js";
import { FRAME_BANNERS } from "../utils/frame-banners.js";
import { clearNavCache } from "../middlewares/inject-locals.middleware.js";
import { StatusCodes } from "http-status-codes";

const VALID_FRAME_CODES = FRAME_UNLOCKS.map((f) => f.code);

const gamificationController = {
  /**
   * POST /auth/equip-frame
   * Body : { frameCode: 'matrix' }
   * Équipe le cadre choisi si l'utilisateur a le niveau requis.
   */
  async equipFrame(req, res) {
    try {
      const { frameCode } = req.body;
      const userId = req.userId;

      if (!frameCode || !VALID_FRAME_CODES.includes(frameCode)) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Code de cadre invalide." });
      }

      const row = await UserPoints.findOne({ where: { id_user: userId } });
      if (!row) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "Profil XP introuvable." });
      }

      const level = computeLevel(row.points);
      const frame = FRAME_UNLOCKS.find((f) => f.code === frameCode);

      if (level < frame.minLvl && !isSuperAdminRole(req.userRole)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          error: `Niveau ${frame.minLvl} requis pour ce cadre (vous êtes niveau ${level}).`,
        });
      }

      await row.update({ active_frame_code: frameCode });

      // Invalider le cache nav pour que la prochaine page affiche le nouveau cadre
      clearNavCache(userId);

      return res.json({
        success: true,
        activeFrameCode: frameCode,
        activeFrameUrl:  frame.pngUrl,
      });
    } catch (error) {
      console.error("[equipFrame]", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erreur serveur." });
    }
  },

  /**
   * POST /auth/set-banner-variant
   * Body : { variant: 3 }
   * Choisit quelle variante du fond officiel du cadre équipé utiliser
   * (aucune règle XP/niveau/cadre — juste une préférence d'affichage,
   * voir app/utils/frame-banners.js). N'affecte jamais une bannière
   * personnelle uploadée, qui reste toujours prioritaire.
   */
  async setBannerVariant(req, res) {
    try {
      const variant = parseInt(req.body.variant, 10);
      const userId = req.userId;

      if (!Number.isInteger(variant) || variant < 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({ error: "Variante invalide." });
      }

      const row = await UserPoints.findOne({ where: { id_user: userId } });
      if (!row) {
        return res.status(StatusCodes.NOT_FOUND).json({ error: "Profil XP introuvable." });
      }

      const list = FRAME_BANNERS[row.active_frame_code] || [];
      if (variant > list.length) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: `Le cadre équipé ne propose que ${list.length} fond(s).`,
        });
      }

      await row.update({ active_banner_variant: variant });

      return res.json({ success: true, variant, bannerUrl: list[variant - 1] });
    } catch (error) {
      console.error("[setBannerVariant]", error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Erreur serveur." });
    }
  },
};

export default gamificationController;
