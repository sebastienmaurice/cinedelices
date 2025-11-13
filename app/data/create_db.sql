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
    ('Richard', 'François', 'Richie', 'rich.franc@gmail.com', '***', null, 'admin'),
    ('Denis', 'Faucon', 'La malice', 'den.fau@gmail.com', '****', null, 'admin'),
    ('Sebastien', 'Maurice', 'Le fourbe', 'seb.mau@gmail.com', '****', null, 'admin'),
    ('John', 'Doe', 'Toto', 'john.doe@gmail.com', 'azerty', null, 'user');


-- =====================================================
-- TABLE MOVIES
-- =====================================================
CREATE TABLE IF NOT EXISTS "movies" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "year" INT NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "picture" VARCHAR(255),
    "status" BOOLEAN DEFAULT FALSE
);

INSERT INTO movies (title, year, genre, picture, status) VALUES
    ('Crocodile Dundee', 1986, 'aventure', 'croco-dundee-2.jpg', TRUE),
    ('Kaamelott', 2005, 'comédie', 'kaamelott-2.png', TRUE),
    ('Retour vers le futur', 1985, 'aventure', 'doc-et-marty-2.jpg', TRUE),
    ('Harry Potter', 2001, 'fantastique', 'harry-potter-1.png', TRUE);


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

INSERT INTO recipes (name, description, picture, category, quote, ingredients, preparation, time, difficulty, status, id_movie) VALUES
    ('Recette Croco', 'Recette inspirée du film Crocodile Dundee', 'croco-dundee-2.jpg', 'plat', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('Recette Kaamelott', 'Recette inspirée du film Kaamelott', 'kaamelott-2.png', 'entrée', 4, 'Ingrédients de Kaamelott', 'Préparation de Kaamelott', 30, 'Moyenne', TRUE, 2),
    ('Recette Retour vers le futur', 'Recette inspirée du film Retour vers le futur', 'doc-and-marty-peach-pie-1.jpg', 'dessert', 3, 'Ingrédients du futur', 'Préparation du futur', 45, 'Facile', TRUE, 3),
    ('2Recette Croco', 'Recette inspirée du film Crocodile Dundee', 'croco-dundee-2.jpg', 'entrée', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('3Recette Croco', 'Recette inspirée du film Crocodile Dundee', 'croco-dundee-2.jpg', 'dessert', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1);
-- =====================================================
-- TABLE NOTICES
-- =====================================================
CREATE TABLE IF NOT EXISTS "notices" (
    "id" SERIAL PRIMARY KEY,
    "quote" INT NOT NULL,
    "content" TEXT NOT NULL,
    "id_user" INT REFERENCES "users" ("id"),
    "id_recipe" INT REFERENCES "recipes" ("id")
);

INSERT INTO notices (quote, content, id_user, id_recipe) VALUES
    (5, 'Excellent recette', 1, 1),
    (4, 'Très bonne recette', 2, 1),
    (3, 'Recette correcte', 3, 2),
    (2, 'Recette moyenne', 4, 2),
    (1, 'Mauvaise recette', 5, 3);


-- =====================================================
-- TABLE USERS_RECIPES
-- =====================================================

CREATE TABLE IF NOT EXISTS "users_recipes" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT REFERENCES "users" ("id"),
    "id_recipe" INT REFERENCES "recipes" ("id")
);

INSERT INTO users_recipes (id_user, id_recipe) VALUES
((SELECT id FROM users WHERE pseudo = 'Ludo'), (SELECT id FROM recipes WHERE name = 'Recette Croco')),
((SELECT id FROM users WHERE pseudo = 'Richie'), (SELECT id FROM recipes WHERE name = 'Recette Kaamelott')),
((SELECT id FROM users WHERE pseudo = 'La malice'), (SELECT id FROM recipes WHERE name = 'Recette Kaamelott')),
((SELECT id FROM users WHERE pseudo = 'Le fourbe'), (SELECT id FROM recipes WHERE name = 'Recette Retour vers le futur')),
((SELECT id FROM users WHERE pseudo = 'Toto'), (SELECT id FROM recipes WHERE name = 'Recette Retour vers le futur'));