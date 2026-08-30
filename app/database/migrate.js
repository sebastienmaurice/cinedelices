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

  // Avis enrichis : réponses, likes, photos jointes, anonymat, badge éditorial
  // — voir app/database/migrations/20260828-add-notice-social-features.sql
  try {
    await sequelize.query(`
      ALTER TABLE notices ADD COLUMN IF NOT EXISTS parent_id    INT     NULL REFERENCES notices(id) ON DELETE CASCADE;
      ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE notices ADD COLUMN IF NOT EXISTS highlight    VARCHAR(20) NULL;
      ALTER TABLE notices ADD COLUMN IF NOT EXISTS likes_count  INT     NOT NULL DEFAULT 0;
      CREATE INDEX IF NOT EXISTS idx_notices_parent_id ON notices(parent_id);

      CREATE TABLE IF NOT EXISTS notice_likes (
        id         SERIAL PRIMARY KEY,
        id_notice  INT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
        id_user    INT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (id_notice, id_user)
      );

      CREATE TABLE IF NOT EXISTS notice_pictures (
        id         SERIAL PRIMARY KEY,
        id_notice  INT NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
        file_path  VARCHAR(255) NOT NULL,
        position   INT NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notice_pictures_notice_id ON notice_pictures(id_notice);
    `);
    console.log("✅ Migration notices (réponses/likes/photos/anonymat/badge) OK");
  } catch (err) {
    console.error("⚠️  Migration notices social features :", err.message);
  }

  // Trophées obtenus par utilisateur (Phase 9, Ma Collection) — table
  // additive, ne modifie aucun schéma existant (notamment pas `users`).
  // Le référentiel des 18 trophées reste MOCK_BADGES ; cette table ne
  // persiste que l'obtention réelle pour 9 d'entre eux — voir
  // app/database/migrations/20260830-add-user-trophies.sql
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_trophies (
        id          SERIAL PRIMARY KEY,
        id_user     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        trophy_code VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (id_user, trophy_code)
      );
      CREATE INDEX IF NOT EXISTS idx_user_trophies_user_id ON user_trophies(id_user);
    `);
    console.log("✅ Migration user_trophies OK");
  } catch (err) {
    console.error("⚠️  Migration user_trophies :", err.message);
  }

  // Phase 15 — Mécanique réelle des Univers cinématographiques : Fond/Cadre
  // équipés par Univers (table dédiée, Option B validée) + Univers actif
  // (même pattern que active_frame_code, sur user_points). Ne touche à
  // aucun schéma existant — voir
  // app/database/migrations/20260830-add-user-univers-equipements.sql
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_univers_equipements (
        id           SERIAL PRIMARY KEY,
        id_user      INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_univers VARCHAR(30) NOT NULL,
        fond_equipe  INT NULL,
        cadre_equipe INT NULL,
        created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE (id_user, code_univers)
      );
      CREATE INDEX IF NOT EXISTS idx_user_univers_equipements_user_id ON user_univers_equipements(id_user);

      ALTER TABLE user_points ADD COLUMN IF NOT EXISTS active_univers_code VARCHAR(30) NULL;
    `);
    console.log("✅ Migration user_univers_equipements + user_points.active_univers_code OK");
  } catch (err) {
    console.error("⚠️  Migration user_univers_equipements :", err.message);
  }
}
