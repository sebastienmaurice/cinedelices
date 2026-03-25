import { UserPoints } from "../models/index.model.js";
import { computeLevel, FRAME_UNLOCKS } from "../utils/xp.js";
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

      if (level < frame.minLvl && req.userRole !== "super_admin") {
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
};

export default gamificationController;
