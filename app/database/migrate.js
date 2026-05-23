/**
 * Migration légère au démarrage — idempotente (IF NOT EXISTS).
 * Ajoute les colonnes manquantes à user_points sans toucher aux données existantes.
 */
import sequelize from "./sequelize-client.js";

export async function runStartupMigration() {
  try {
    await sequelize.query(`
      ALTER TABLE user_points
        ADD COLUMN IF NOT EXISTS login_streak            INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_daily_login_at     DATE,
        ADD COLUMN IF NOT EXISTS last_monthly_recipe_at  DATE;
    `);
    console.log("✅ Migration user_points : colonnes streak/monthly OK");
  } catch (err) {
    console.error("⚠️  Migration user_points :", err.message);
  }
}
