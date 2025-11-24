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
    ('Steak d''Outback Australien', 'Cette recette trouve son origine dans les scènes emblématiques de Crocodile Dundee où Mick Dundee, le héros australien, savoure les saveurs authentiques de l''Outback. On peut notamment voir cette scène lors de son passage dans un restaurant local où il déguste un steak épais et juteux, grillé à la manière australienne, accompagné d''une sauce à la bière locale et de légumes rôtis. Cette scène illustre parfaitement la culture culinaire australienne et l''authenticité des saveurs de l''Outback.', '/images/recipes/croco-dundee-2.jpg', 'plat', 5, '• 4 steaks de bœuf épais (environ 200g chacun)\n• 2 cuillères à soupe d''huile d''olive\n• 4 gousses d''ail, hachées\n• 1 cuillère à café de poivre noir moulu\n• 1 cuillère à café de sel de mer\n• 1 cuillère à café de paprika\n• 1 cuillère à café de thym séché\n• 2 oignons rouges, coupés en rondelles\n• 500ml de bière blonde australienne\n• 2 cuillères à soupe de miel\n• 2 cuillères à soupe de vinaigre balsamique\n• 4 pommes de terre moyennes\n• 2 courgettes\n• 2 poivrons rouges\n• Beurre\n• Persil frais pour la garniture', '1. Préparez la marinade : Dans un bol, mélangez l''huile d''olive, l''ail haché, le poivre, le sel, le paprika et le thym. Badigeonnez les steaks avec ce mélange et laissez mariner au moins 30 minutes au réfrigérateur.\n\n2. Préparez la sauce à la bière : Dans une casserole, faites revenir les oignons dans un peu d''huile jusqu''à ce qu''ils soient translucides. Ajoutez la bière, le miel et le vinaigre balsamique. Laissez mijoter à feu moyen-doux pendant 15-20 minutes jusqu''à ce que la sauce épaississe. Réservez au chaud.\n\n3. Préparez les légumes : Coupez les pommes de terre en quartiers, les courgettes en rondelles et les poivrons en lanières. Mélangez-les avec de l''huile d''olive, du sel et du poivre. Faites-les rôtir au four à 200°C pendant 25-30 minutes jusqu''à ce qu''ils soient dorés et tendres.\n\n4. Cuisez les steaks : Dans une poêle très chaude ou sur un grill, faites cuire les steaks 4-5 minutes de chaque côté pour une cuisson à point (ajustez selon vos préférences). Ajoutez une noix de beurre sur chaque steak en fin de cuisson.\n\n5. Servez : Disposez les steaks sur les assiettes, nappez avec la sauce à la bière, ajoutez les légumes rôtis et parsemez de persil frais. Accompagnez d''une bière australienne pour une expérience authentique !', 75, 'Moyenne', TRUE, 1),
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