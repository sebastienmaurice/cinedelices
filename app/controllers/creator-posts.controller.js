/**
 * creator-posts.controller.js — gestion (admin, super admin) des posts de la
 * bande carrousel d'un créateur partenaire. La couverture est redimensionnée
 * (9:16) puis envoyée sur Cloudinary : un lien d'image TikTok expire.
 */
import sharp from "sharp";
import { CreatorPost, User } from "../models/index.model.js";
import { cleanPostUrl } from "../services/social-links.service.js";
import { deleteAsset, uploadBufferToCloudinary } from "../utils/asset-manager.js";
import { logAdminAction } from "../utils/admin-logger.js";

const MAX_POSTS = 12;
const FETCH_TIMEOUT_MS = 7000;
const MAX_COVER_BYTES = 6 * 1024 * 1024;

// Domaines d'images TikTok acceptés pour la couverture récupérée via oEmbed
// (protège contre toute redirection vers un hôte arbitraire : pas de SSRF).
const TIKTOK_IMG_HOST = /(^|\.)(tiktokcdn(-[a-z]+)?\.com|tiktok\.com|ibyteimg\.com|byteimg\.com)$/i;

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: "follow", ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Récupère titre + couverture d'une vidéo TikTok via l'oEmbed public.
 * Retourne { title, buffer } ou null (l'admin peut alors envoyer une image).
 */
async function fetchTiktokCover(videoUrl) {
  try {
    const r = await fetchWithTimeout(`https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`);
    if (!r.ok) return null;
    const j = await r.json();
    const thumb = j.thumbnail_url;
    if (!thumb) return null;
    const u = new URL(thumb);
    if (u.protocol !== "https:" || !TIKTOK_IMG_HOST.test(u.hostname)) return null;
    const img = await fetchWithTimeout(u.toString(), { redirect: "error" });
    if (!img.ok) return null;
    const buf = Buffer.from(await img.arrayBuffer());
    if (!buf.length || buf.length > MAX_COVER_BYTES) return null;
    // Titre : on retire les hashtags, gardés seulement s'il reste du texte
    const raw = String(j.title || "");
    let title = raw.replace(/#\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!title) {
      // Légende faite uniquement de hashtags : le premier sert de titre (#bretagne -> Bretagne)
      const tag = (raw.match(/#([\p{L}\p{N}_]+)/u) || [])[1];
      if (tag) title = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
    }
    return { title: title || null, buffer: buf };
  } catch {
    return null;
  }
}

const creatorPostsController = {
  // GET /admin/users/:id/posts — JSON
  async list(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId) return res.json({ success: false, message: "ID invalide." });
      const posts = await CreatorPost.findAll({ where: { id_user: userId }, order: [["position", "ASC"], ["id", "ASC"]] });
      return res.json({ success: true, posts, max: MAX_POSTS });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/users/:id/posts — multipart (champ "cover"), JSON en retour
  async add(req, res) {
    try {
      const userId = parseInt(req.params.id, 10);
      if (!userId) return res.json({ success: false, message: "ID invalide." });
      const user = await User.findByPk(userId, { attributes: ["id"] });
      if (!user) return res.json({ success: false, message: "Utilisateur introuvable." });

      const parsed = cleanPostUrl(req.body.url);
      if (!parsed) return res.json({ success: false, message: "Lien invalide : URL https complète TikTok, Instagram ou YouTube attendue." });

      const dup = await CreatorPost.findOne({ where: { id_user: userId, url: parsed.url } });
      if (dup) return res.json({ success: false, message: "Ce post est déjà dans le carrousel." });

      const count = await CreatorPost.count({ where: { id_user: userId } });
      if (count >= MAX_POSTS) return res.json({ success: false, message: `Limite de ${MAX_POSTS} posts atteinte.` });

      // Couverture : image envoyée, sinon récupération automatique (TikTok)
      let source = req.file ? req.file.buffer : null;
      let autoTitle = null;
      if (!source && parsed.platform === "tiktok") {
        const auto = await fetchTiktokCover(parsed.url);
        if (auto) { source = auto.buffer; autoTitle = auto.title; }
      }
      if (!source) {
        return res.json({ success: false, message: "Couverture introuvable automatiquement : envoyez une image." });
      }

      // Couverture 9:16, WebP léger
      const buffer = await sharp(source)
        .rotate()
        .resize(540, 960, { fit: "cover", position: "attention" })
        .webp({ quality: 82 })
        .toBuffer();
      const up = await uploadBufferToCloudinary(buffer, { folder: "cinedelices/creator-posts" });

      const last = await CreatorPost.max("position", { where: { id_user: userId } });
      const post = await CreatorPost.create({
        id_user: userId,
        title: String(req.body.title || "").trim().slice(0, 120) || autoTitle || null,
        url: parsed.url,
        platform: parsed.platform,
        cover_url: up.secure_url,
        position: (last ?? -1) + 1,
      });
      logAdminAction({ adminId: req.userId, action: "add_creator_post", targetType: "user", targetId: userId, detail: parsed.url });
      return res.json({ success: true, post });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/creator-posts/:postId/delete — JSON
  async remove(req, res) {
    try {
      const post = await CreatorPost.findByPk(parseInt(req.params.postId, 10));
      if (!post) return res.json({ success: false, message: "Post introuvable." });
      await deleteAsset(post.cover_url);
      await post.destroy();
      logAdminAction({ adminId: req.userId, action: "delete_creator_post", targetType: "user", targetId: post.id_user });
      return res.json({ success: true });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },

  // POST /admin/creator-posts/:postId/move  { dir: "up" | "down" } — JSON
  async move(req, res) {
    try {
      const post = await CreatorPost.findByPk(parseInt(req.params.postId, 10));
      if (!post) return res.json({ success: false, message: "Post introuvable." });
      const all = await CreatorPost.findAll({ where: { id_user: post.id_user }, order: [["position", "ASC"], ["id", "ASC"]] });
      const i = all.findIndex((p) => p.id === post.id);
      const j = req.body.dir === "up" ? i - 1 : i + 1;
      if (j < 0 || j >= all.length) return res.json({ success: true });
      [all[i], all[j]] = [all[j], all[i]];
      await Promise.all(all.map((p, idx) => p.position === idx ? null : p.update({ position: idx })));
      return res.json({ success: true });
    } catch (error) {
      return res.json({ success: false, message: error.message });
    }
  },
};

export default creatorPostsController;
