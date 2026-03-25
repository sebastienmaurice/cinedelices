-- Suppression des tables dans le bon ordre
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS users_recipes;
DROP TABLE IF EXISTS notices;
DROP TABLE IF EXISTS recipes;
DROP TABLE IF EXISTS movies;
DROP TABLE IF EXISTS users;

-- =====================================================
-- TABLE USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "pseudo" TEXT NOT NULL UNIQUE,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "picture" VARCHAR(255),
    "picture_status" VARCHAR(20) DEFAULT 'approved',
    "banner_image" VARCHAR(255),
    "banner_status" VARCHAR(20) DEFAULT 'approved',
    "notify_recipes" BOOLEAN DEFAULT TRUE,
    "notify_cinema" BOOLEAN DEFAULT TRUE,
    "role"  VARCHAR(50) DEFAULT 'user'
);

INSERT INTO users (first_name, last_name, pseudo, email, password, picture, role) VALUES
    ('Ludovic', 'Trichereau', 'Ludo', 'ludo.trich@gmail.com', '****', null, 'admin'),
    ('Richard', 'François', 'Riri', 'rich.franc@gmail.com', '***', null, 'admin'),
    ('Denis', 'Faucon', 'La malice', 'den.fau@gmail.com', '****', null, 'admin'),
    ('admin2', 'test2', 'admin2_2025', 'admin2@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$z/u9bVWrzHucKTXQYsxXFQ$/pW7Z7KlCrsC1W/xW/NJ1bdeo+Ci5oFsHd+rtO8Fi5I', null, 'admin'),
    ('pi', 'pou', 'pipou', 'pi@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$4E0hz9IgK5N70B3BlijyFQ$envgJnqFUewcMi7Zda10T85NXUpo6pUoBq9s2EURUQE', null, 'admin'),
    ('Sébastien', 'Maurice', 'Seb le Fourbe', 'overseb75@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$3zh+6NKeKdSjoq2490C8DA$nMfhF31LKrJPIOtzlGoOzIHHKG3x867pWq/KTv/RUeU', null, 'super_admin');



-- =====================================================
-- TABLE MOVIES
-- =====================================================
CREATE TABLE IF NOT EXISTS "movies" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "year" INT NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "picture" VARCHAR(255),
    "synopsis" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "validated_at" TIMESTAMP,
    "edit_status" VARCHAR(20) DEFAULT 'none',
    "pending_title" TEXT,
    "pending_year" INT,
    "pending_genre" VARCHAR(100),
    "edit_requested_at" TIMESTAMP,
    "delete_request_status" VARCHAR(20) DEFAULT 'none',
    "delete_request_by" INT REFERENCES "users" ("id"),
    "delete_request_at" TIMESTAMP,
    "tmdb_id" INTEGER UNIQUE,
    "id_user" INT REFERENCES "users" ("id"),
    "type" VARCHAR(10) DEFAULT 'film'
);

INSERT INTO movies (title, year, genre, picture, status, tmdb_id, type) VALUES
    ('Harry Potter', 2001, 'fantastique', '/images/movies/originals/harry-potter.jpg', 'approved', 671, 'film'),
    ('American pie', 1999, 'comédie', '/images/movies/originals/american-pie.jpg', 'approved', 2105, 'film'),
    ('Bienvenue chez les Ch''tis', 2008, 'comédie', '/images/movies/originals/bienvenue-chez-les-ch-tis.jpg', 'approved', 8265, 'film'),
    ('Le silence des agneaux', 1991, 'thriller', '/images/movies/originals/le-silence-des-agneaux.jpg', 'approved', 274, 'film'),
    ('Indiana Jones et les Aventuriers de l''Arche perdue', 1981, 'aventure', '/images/movies/originals/indiana-jones-et-les-aventuriers-de-l-arche-perdue.jpg', 'approved', 85, 'film');

-- Créer un index pour améliorer les performances de recherche sur tmdb_id
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);

-- Créer un index pour améliorer les performances de recherche sur type
CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(type);

-- =====================================================
-- TABLE RECIPES
-- =====================================================
CREATE TABLE IF NOT EXISTS "recipes" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "picture" VARCHAR(255),
    "category" VARCHAR(100) NOT NULL,
    "quote" INT DEFAULT 0,
    "ingredients" TEXT NOT NULL,
    "preparation" TEXT NOT NULL,
    "time" INT NOT NULL,
    "servings" INT,
    "difficulty" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "validated_at" TIMESTAMP,
    "edit_status" VARCHAR(20) DEFAULT 'none',
    "pending_name" TEXT,
    "pending_description" TEXT,
    "pending_picture" VARCHAR(255),
    "pending_category" VARCHAR(100),
    "pending_ingredients" TEXT,
    "pending_preparation" TEXT,
    "pending_time" INT,
    "pending_difficulty" VARCHAR(50),
    "edit_requested_at" TIMESTAMP,
    "delete_request_status" VARCHAR(20) DEFAULT 'none',
    "delete_request_at" TIMESTAMP,
    "id_movie" INT REFERENCES "movies" ("id"),
    "id_user" INT REFERENCES "users" ("id")
);

-- =====================================================
-- TABLE NOTICES
-- =====================================================
CREATE TABLE IF NOT EXISTS "notices" (
    "id" SERIAL PRIMARY KEY,
    "quote" INT NOT NULL,
    "content" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "validated_at" TIMESTAMP,
    "edit_status" VARCHAR(20) DEFAULT 'none',
    "pending_content" TEXT,
    "pending_quote" INT,
    "edit_requested_at" TIMESTAMP,
    "delete_request_status" VARCHAR(20) DEFAULT 'none',
    "delete_request_at" TIMESTAMP,
    "id_user" INT REFERENCES "users" ("id"),
    "id_recipe" INT REFERENCES "recipes" ("id")
);


-- =====================================================
-- TABLE USERS_RECIPES
-- =====================================================

CREATE TABLE IF NOT EXISTS "users_recipes" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT REFERENCES "users" ("id"),
    "id_recipe" INT REFERENCES "recipes" ("id")
);

-- =====================================================
-- TABLE FAVORITES (polymorphique : films et recettes)
-- =====================================================
CREATE TABLE IF NOT EXISTS "favorites" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(20) NOT NULL DEFAULT 'movie',
    "entity_id" INT NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("id_user", "entity_type", "entity_id")
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(id_user);
CREATE INDEX IF NOT EXISTS idx_favorites_entity ON favorites(entity_type, entity_id);

-- =====================================================
-- TABLE RATINGS (polymorphique : films et recettes)
-- =====================================================
CREATE TABLE IF NOT EXISTS "ratings" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE,
    "entity_type" VARCHAR(20) NOT NULL DEFAULT 'movie',
    "entity_id" INT NOT NULL,
    "score" SMALLINT NOT NULL CHECK (score >= 1 AND score <= 5),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ratings_user_entity_idx ON ratings(id_user, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ratings_entity_idx ON ratings(entity_type, entity_id);
