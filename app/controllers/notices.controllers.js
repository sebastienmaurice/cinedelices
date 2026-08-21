import { Notice, NoticeLike } from "../models/index.model.js";

const noticesController = {};

/**
 * POST /api/notices/:id/like
 * Bascule le like de l'utilisateur connecté sur l'avis :id (approved
 * uniquement — on ne like pas un avis en attente de modération ou un avis
 * qui n'existe plus). Met à jour le compteur dénormalisé likes_count.
 */
noticesController.toggleLike = async function toggleLike(req, res) {
  try {
    const noticeId = parseInt(req.params.id, 10);
    if (!noticeId || Number.isNaN(noticeId)) {
      return res.status(400).json({ success: false, message: "Avis invalide." });
    }

    const notice = await Notice.findOne({ where: { id: noticeId, status: "approved" } });
    if (!notice) {
      return res.status(404).json({ success: false, message: "Avis introuvable." });
    }

    const existing = await NoticeLike.findOne({
      where: { id_notice: noticeId, id_user: req.userId },
    });

    let liked;
    if (existing) {
      await existing.destroy();
      notice.likes_count = Math.max(0, notice.likes_count - 1);
      liked = false;
    } else {
      await NoticeLike.create({ id_notice: noticeId, id_user: req.userId });
      notice.likes_count += 1;
      liked = true;
    }
    await notice.save();

    return res.json({ success: true, liked, likesCount: notice.likes_count });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

export default noticesController;
