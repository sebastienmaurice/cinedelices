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
    ('pi', 'pou', 'pipou', 'pi@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$4E0hz9IgK5N70B3BlijyFQ$envgJnqFUewcMi7Zda10T85NXUpo6pUoBq9s2EURUQE', null, 'admin');
    


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
    ('Crocodile Dundee', 1986, 'aventure', '/images/movies/croco-dundee-2.jpg', TRUE),
    ('Kaamelott', 2005, 'comédie', '/images/movies/kaamelott-2.png', TRUE),
    ('Retour vers le futur', 1985, 'aventure', '/images/movies/doc-et-marty-2.jpg', TRUE),
    ('Harry Potter', 2001, 'fantastique', '/images/movies/harry-potter-1.png', TRUE),
    ('Commando', 2001, 'action', '/images/movies/commando-shwarzy-1.png', TRUE),
    ('John Wick', 2010, 'action', '/images/movies/johnwick.jpg', TRUE),
    ('Pirates des caraibes', 2008, 'fantastique', '/images/movies/sparrow-2.jpg', TRUE);
    


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
    ('Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'plat', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('Recette Kaamelott', 'Recette inspirée du film Kaamelott', '/images/recipes/kaamelott-2.png', 'entrée', 4, 'Ingrédients de Kaamelott', 'Préparation de Kaamelott', 30, 'Moyenne', TRUE, 2),
    ('Recette Retour vers le futur', 'Recette inspirée du film Retour vers le futur', '/images/recipes/doc-and-marty-peach-pie-1.jpg', 'dessert', 3, 'Ingrédients du futur', 'Préparation du futur', 45, 'Facile', TRUE, 3),
    ('2Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'entrée', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('3Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'dessert', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('4Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'plat', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('5Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'entrée', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('6Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'dessert', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1),
    ('7Recette Croco', 'Recette inspirée du film Crocodile Dundee', '/images/recipes/croco-dundee-2.jpg', 'plat', 5, 'Ingrédients du croco', 'Préparation du croco', 60, 'Difficile', TRUE, 1);
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