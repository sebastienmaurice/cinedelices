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

  // Photos de préparation (une par étape, optionnelles) — voir
  // app/database/migrations/20260819-add-recipe-step-pictures.sql
  try {
    await sequelize.query(`
      ALTER TABLE recipe_pictures ADD COLUMN IF NOT EXISTS step_number INT NULL;
    `);
    console.log("✅ Migration recipe_pictures.step_number OK");
  } catch (err) {
    console.error("⚠️  Migration recipe_pictures.step_number :", err.message);
  }

  // Données TMDB additionnelles (score, bande-annonce, réalisateur,
  // compositeur, casting) — voir
  // app/database/migrations/20260826-add-movie-tmdb-details.sql
  try {
    await sequelize.query(`
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_rating    NUMERIC(3,1) NULL;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS trailer_key    VARCHAR(50)  NULL;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS director       VARCHAR(255) NULL;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS composer       VARCHAR(255) NULL;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS main_cast      VARCHAR(500) NULL;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS tmdb_synced_at TIMESTAMP    NULL;
      ALTER TABLE movies ADD COLUMN IF NOT EXISTS runtime        INT          NULL;
    `);
    console.log("✅ Migration movies.tmdb_rating/trailer_key/director/composer/main_cast/runtime OK");
  } catch (err) {
    console.error("⚠️  Migration movies TMDB details :", err.message);
  }
}
