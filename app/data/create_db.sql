-- Suppression des tables dans le bon ordre
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
    "role"  VARCHAR(50) DEFAULT 'user'
);

INSERT INTO users (first_name, last_name, pseudo, email, password, picture, role) VALUES
    ('Ludovic', 'Trichereau', 'Ludo', 'ludo.trich@gmail.com', '****', null, 'admin'),
    ('Richard', 'François', 'Riri', 'rich.franc@gmail.com', '***', null, 'admin'),
    ('Denis', 'Faucon', 'La malice', 'den.fau@gmail.com', '****', null, 'admin'),
    ('Sebastien', 'Maurice', 'Le fourbe', 'seb.mau@gmail.com', '****', null, 'admin'),
    ('admin2', 'test2', 'admin2_2025', 'admin2@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$z/u9bVWrzHucKTXQYsxXFQ$/pW7Z7KlCrsC1W/xW/NJ1bdeo+Ci5oFsHd+rtO8Fi5I', null, 'admin'),
    ('pi', 'pou', 'pipou', 'pi@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$4E0hz9IgK5N70B3BlijyFQ$envgJnqFUewcMi7Zda10T85NXUpo6pUoBq9s2EURUQE', null, 'admin'),
    ('Seb', 'Mauri', 'Semauri', 'semauri@cinedelices.com', '$argon2id$v=19$m=65536,t=3,p=4$3zh+6NKeKdSjoq2490C8DA$nMfhF31LKrJPIOtzlGoOzIHHKG3x867pWq/KTv/RUeU', null, 'admin');
    


-- =====================================================
-- TABLE MOVIES
-- =====================================================
CREATE TABLE IF NOT EXISTS "movies" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "year" INT NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "picture" VARCHAR(255),
    "status" BOOLEAN DEFAULT FALSE,
    "tmdb_id" INTEGER UNIQUE,
    "type" VARCHAR(10) DEFAULT 'film'
);

INSERT INTO movies (title, year, genre, picture, status, tmdb_id, type) VALUES
    ('Harry Potter', 2001, 'fantastique', '/images/movies/movie-harry_potter-1763858232674-340071843.png', TRUE, NULL, 'film'),
    ('American pie', 1999, 'comédie', '/images/movies/movie-american_pie-1764103560707-335098533.png', TRUE, NULL, 'film'),
    ('Bienvenue chez les Ch''tis', 2008, 'comédie', '/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png', TRUE, NULL, 'film'),
    ('Le silence des agneaux', 1991, 'thriller', '/images/movies/movie-Le silence des agneaux-1764145159444-648907832.png', true, NULL, 'film'),
    ('Indiana Jones et les Aventuriers de l'Arche perdue', 1981, 'aventure', '/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg', true, NULL, 'film');

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
    "description" VARCHAR(2000) NOT NULL,
    "picture" VARCHAR(255),
    "category" VARCHAR(100) NOT NULL,
    "quote" INT DEFAULT 0,
    "ingredients" VARCHAR(1000) NOT NULL,
    "preparation" VARCHAR(2000) NOT NULL,
    "time" INT NOT NULL,
    "difficulty" VARCHAR(50) NOT NULL,
    "status" BOOLEAN DEFAULT FALSE,
    "id_movie" INT REFERENCES "movies" ("id")
);

-- =====================================================
-- TABLE NOTICES
-- =====================================================
CREATE TABLE IF NOT EXISTS "notices" (
    "id" SERIAL PRIMARY KEY,
    "quote" INT NOT NULL,
    "content" TEXT NOT NULL,
    "status" BOOLEAN DEFAULT FALSE,
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
