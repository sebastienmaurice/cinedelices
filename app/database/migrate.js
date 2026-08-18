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

  // Index de performance (audit technique 18/08/2026) — voir
  // app/database/migrations/20260818-add-perf-indexes.sql
  try {
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_recipes_status       ON recipes(status);
      CREATE INDEX IF NOT EXISTS idx_recipes_id_movie     ON recipes(id_movie);
      CREATE INDEX IF NOT EXISTS idx_recipes_movie_status ON recipes(id_movie, status);
      CREATE INDEX IF NOT EXISTS idx_movies_status        ON movies(status);
    `);
    console.log("✅ Migration index perf : recipes/movies OK");
  } catch (err) {
    console.error("⚠️  Migration index perf :", err.message);
  }
}
