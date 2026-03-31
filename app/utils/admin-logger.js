/**
 * admin-logger.js — Journalisation des actions administrateur
 * Insère dans la table admin_logs (créée par migration_phase2_admin.sql)
 * Fire & forget : les erreurs de log n'interrompent jamais l'action principale.
 */

import sequelize from "../database/sequelize-client.js";
import { QueryTypes } from "sequelize";

/**
 * @param {object} opts
 * @param {number|null} opts.adminId      — req.userId
 * @param {string}      opts.action       — ex: 'approve_recipe', 'hide_movie'
 * @param {string|null} opts.targetType   — ex: 'recipe', 'movie', 'user', 'notice', 'photo'
 * @param {number|null} opts.targetId     — ID de la ressource concernée
 * @param {string|null} opts.detail       — message libre
 */
export async function logAdminAction({ adminId = null, action, targetType = null, targetId = null, detail = null }) {
  try {
    await sequelize.query(
      `INSERT INTO admin_logs (admin_id, action, target_type, target_id, detail)
       VALUES (:adminId, :action, :targetType, :targetId, :detail)`,
      {
        replacements: {
          adminId: adminId || null,
          action,
          targetType: targetType || null,
          targetId: targetId || null,
          detail: detail || null,
        },
        type: QueryTypes.INSERT,
      }
    );
  } catch (err) {
    // Non-bloquant — une erreur de log ne doit jamais casser une action admin
    console.error("[adminLogger] Échec enregistrement log:", err.message);
  }
}
