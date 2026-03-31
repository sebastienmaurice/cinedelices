/**
 * isSuperAdmin — middleware de contrôle d'accès superadmin
 *
 * Réserve la route aux utilisateurs ayant le rôle "superadmin".
 * Les admins classiques reçoivent un 403 JSON.
 * Toute tentative refusée est consignée dans admin_logs.
 *
 * Note : le projet utilise JWT (req.userRole, req.userId) et non req.session.
 */

import { logAdminAction } from "../utils/admin-logger.js";

export function isSuperAdmin(req, res, next) {
  const userRole = req.userRole;

  if (userRole === "superadmin") {
    return next();
  }

  // Log de la tentative non autorisée (fire-and-forget)
  logAdminAction({
    adminId:    req.userId ?? null,
    action:     "unauthorized_access_attempt",
    targetType: "route",
    targetId:   null,
    detail:     `role=${userRole ?? "unknown"} route=${req.method} ${req.originalUrl} at=${new Date().toISOString()}`,
  });

  return res.status(403).json({ error: "Accès réservé au super administrateur" });
}
