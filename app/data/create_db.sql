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
    ('ludo', 'lamesombre', 'ludo', 'ludo.t@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$To2UdTS6eOxxY/G7qQ3HPA$968z2vrAA4bgW+gBn/2zt4WBYlXZPVSdtOVOFmIQOqc', null, 'admin'),
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
    ('Harry Potter', 2001, 'fantastique', '/images/movies/movie-harry_potter-1763858232674-340071843.png', TRUE),
    ('American pie', 1999, 'comédie', '/images/movies/movie-american_pie-1764103560707-335098533.png', TRUE),
    ('Bienvenue chez les Ch''tis', 2008, 'comédie', '/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png', TRUE),
    ('Le silence des agneaux', 1991, 'thriller', '/images/movies/movie-Le silence des agneaux-1764145159444-648907832.png', true),
    ('Indiana Jones et les Aventuriers de l’Arche perdue', 1981, 'aventure', '/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg', true);



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
    ('La tarte à la Mélasse', 'Lors du banquet de bienvenue, Hermione refuse de manger en apprenant que ce sont des elfes de maison qui ont préparé le repas. Avec une tarte à la mélasse, Ron tente de convaincre Hermione de manger', '/images/recipes/tarte_melasse-1764137492266-726416795.jpeg', 'dessert', 0, '- 1 pâte brisée (faite maison ou achetée)
- 300 g de mélasse (liquide issu d’un raffinage de sucre et de betterave ou canne à sucre)
- 190 g de lait
- 160 g de sucre
- 1 cuillère à soupe de farine
- 1 œuf
', '1. Préchauffer le four à 220°C.
2. Dans un saladier, mélanger l’œuf avec le lait et la farine, puis ajouter le sucre.
3. Dans un moule à tarte beurré ou recouvert d’un papier sulfurisé, déposer la pâte brisée.
4. Verser la précédente préparation sur le fond de tarte.
5. S’il reste un surplus de pâte, réaliser des bandes fines et les disposer au-dessus de la tarte (facultatif)', 50, 'Moyenne', true, 1),
    ('Apple pie', 'Dans le film American Pie, la scène où Jim se retrouve en tête à tête avec la tarte aux pommes se produit lorsqu''il est surpris par ses parents. Cette scène est considérée comme mythique et est l''une des plus célèbres du film. Elle a marqué la mémoire des spectateurs et est devenue un moment emblématique de la saga', '/images/recipes/applepie-1764137966385-745300976.jpg', 'dessert', 0, '- Farine 300g,
- Beurre mou 190g,
- Eau 5cl,
- Bicarbonate de soude 1 demi cuillère à café,
- Sel 1 pincée
- Pomme Reinette 1 kg,
- Cassonade 25 g,
- Cannelle en poudre 5 g,
- Citron(s) jaune(s) 1.', '1- Préparez la pâte. Coupez le beurre ramolli en dés. Dans un saladier, versez la farine et creusez-y un puits. Versez-y le beurre, le sel et le bicarbonate. Pétrissez grossièrement, puis incorporez progressivement l’eau. Pétrissez à nouveau jusqu’à former une boule. Couvrez le saladier et laissez reposer 30 min au frais.
2- Préchauffez le four th.6 (180°C). Épluchez et épépinez les pommes, puis coupez-les en morceaux. Arrosez-les du jus du citron jaune dans un saladier, ajoutez la cannelle et mélangez pour enrober les pommes.
3- Sortez la pâte et étalez-la sur un plan de travail fariné, assez pour y découper deux disques plus grands que votre moule. Placez le premier au fond du moule. Tapissez-le de morceaux de pommes. Recouvrez avec le second disque de pâte. Scellez les bords en pinçant avec les doigts, puis découpez des incisions en étoile sur le dessus, afin que la vapeur s’échappe. 
4- Saupoudrez de cassonade et enfournez pour 55 min.
', 75, 'Facile', true, 2),
    ('bièraubeurre', 'La Bièraubeurre, souvent confondue avec un soda par ceux qui n’ont jamais eu le privilège d’y goûter, est une boisson emblématique de l’univers d’Harry Potter. En dépit de sa popularité dans la cuisine des sorciers, elle trouve aussi sa place parmi les cocktails moldus inspirés par la magie. À la fois pétillante et envoûtante, cette boisson est souvent agrémentée de sirops pour rehausser son goût unique.', '/images/recipes/biereaubeurre-1764137132022-745397718.jpeg', 'dessert', 0, '- Bière sans alcool 33 cls
- 1 cuillère à café de sucre roux
- 1 noisette de beurre
- Crème  (chantilly, ou 20cl de creme liquide et 1 pincee de sucre)
- Epices au choix  (cannelle, gingembre, clou de girofle en poudre)', '1. Commencez par verser le sucre roux dans une casserole, puis ajoutez les 2 cuillères à soupe d’eau. Chauffez à feu moyen et patientez jusqu’à l’apparition de bulles dorées signalant que le mélange commence à caraméliser. Tout en remuant délicatement, incorporez le beurre dans ce doux mélange jusqu’à sa parfaite fusion. N’oubliez pas d’ajouter quelques gouttes de vinaigre de cidre, pour ajouter une subtile touche acidulée.

2. Versez progressivement la crème liquide tout en continuant à remuer jusqu’à obtenir une préparation homogène. Pour une note épicée, ajoutez une pincée de cannelle selon vos goûts et remuez bien.

3. Une fois votre concoction prête, laissez-la refroidir directement dans des verres à bière. À l’heure de la dégustation, versez un peu de bière dans le verre contenant votre préparation refroidie, et remuez avec grâce. Selon votre palais, vous pouvez choisir un panaché, une bière sans alcool ou même une bière classique. Pour couronner le tout, n’oubliez pas de garnir d’une onctueuse couche de crème chantilly."', 15, 'Facile', true, 1),
    ('carbonnade flamande', 'À l’minche chez Antoine, quand qu’Philippe y’est invité à goûter les spécialités du Nord. Ch’est là qu’on l’y sert l’fameuse carbonnade flamande.
Oups!!
Au repas chez Antoine, quand Philippe  est invité à découvrir les spécialités du Nord. C’est à ce moment qu’on lui sert la fameuse carbonnade flamande.', '/images/recipes/carbonnade_chtis-1764138416283-708167994.jpeg', 'plat', 0, '(pour 6 personnes)
- 1,5 kg de viande de boeuf à braiser (gîte, paleron, jumeau...)
- 6 oignons
- 20 g de beurre doux
- 3 cuillerées à soupe de farine
- 3 cuillerées à soupe de vinaigre de vin rouge
- 1 litre de bière brune
- 3 cuillerées à soupe de vergeoise brune (ou cassonade)
- 2 feuilles de laurier
- 4 branches de thym séché
- 3 clous de girofle
- 8 tranches (160g) de pain d''épices
- 5 cuillerées à soupe de moutarde
- Sel, poivre
', '1. Découpez la viande en tranches épaisses. Epluchez les oignons et coupez-les en rondelles.
2. Dans une cocotte, faites dorer les tranches de viande dans le beurre fondu. (Faites-le en deux fois si la cocotte est petite). Assaisonnez. Ajoutez la farine et les oignons. Mélangez bien et laissez cuire 5 min tout en remuant, pour attendrir les oignons sans les colorer.
3. Ajoutez le vinaigre et laissez cuire 2 min. Puis ajoutez la bière, 50 cl d’eau, la vergeoise, le thym, le laurier, les clous de girofle et 5 tranches de pain d’épices tartinées de moutarde. Portez à ébullition, couvrez puis baissez le feu pour laisser mijoter 2h45.
4. Retirez le couvercle, augmentez le feu et faites cuire à découvert en remuant, jusqu’à ce que la sauce ait réduit de moitié.
5. Faites griller les tranches de pain d’épices restantes et coupez-les en cubes.
6. Servez la carbonade avec des petites pommes de terre vapeur et les cubes de pain d’épices grillés.', 220, 'Facile', true, 3),
    ('le foie et ses fèves au beurre', 'Dans le film Le Silence des Agneaux, lors d''un entretien en tête à tête avec l''agent Clarice Starling, le Docteur Hannibal Lecter, psychopathe cannibale, dans un thriller policier, et esthète culinaire s’il en est, mentionne ceci :

« J’ai été interrogé par un employé du recensement. J’ai dégusté son foie avec des fèves au beurre, et un excellent chianti »
', NULL, 'plat', 0, '- 800 g de fèves fraîches.
- Beurre
- 1 échalote
- 2 pincées de sucre
- Vinaigre de vin
- 1/2 verre de vin rouge
- 1 verre de bouillon
- 2 c. à s. de ciboulette hachée
- 2 tranches de foie de veau surtout pas trop fines
- Sel et poivre', '1- Les fèves
Plongez-les 15-20 secondes dans de l’eau bouillante puis dans de l’eau froide. Egouttez et ôtez la peau entourant les fèves, mettez de côté. Epluchez et hachez l’échalote.

2- Le foie
Salez, poivrez les tranches de foie et, dans une poêle chauffée à feu moyen, couchez-les dans une ou deux noix de beurre moussant. Comptez 2-3 minutes de cuisson, retournez les tranches, laissez cuire  2-3 minutes puis conservez au chaud entre deux assiettes.

3- Le foie et les fèves
Dans le jus de cuisson des tranches de foie, ajoutez les échalotes, ajoutez un petit trait de vinaigre, laissez évaporer, versez le vin. Faites-le s’évaporer (ou presque) puis videz le bouillon. Faites bouillir et réduire de moitié. Ajoutez les fèves et le sucre, salez, poivrez et laissez mijoter 2 à 3 minutes puis ajoutez la ciboulette. Servez les tranches de foie nappées de cette superbe sauce.

4- Servez-vous un excellent Chianti pour dégustez et savourez ce foie accompagné de ses fèves.
', 60, 'Facile', true, 4),
    ('Le Bol du Temple Perdu', 'Après avoir exploré des temples et traversé la jungle, Indiana Jones fait une pause sur un campement improvisé. Il savoure un bol rustique de riz, légumes et viande avant de reprendre son aventure pleine de dangers et de mystères.', '/images/recipes/recette-indiana-jones-bol-expedition-v1-1764166522021-433994479.png', 'plat', 0, '200 g de riz parfumé (basmati ou jasmin)
250 g de morceaux de poulet ou bœuf grillé
1 poivron rouge, coupé en dés
1 carotte, coupée en fines rondelles
50 g de maïs en grains
1 oignon moyen, émincé
2 gousses d’ail, hachées
1 c. à soupe d’huile de coco ou d’olive
100 ml de bouillon de volaille ou légumes
1 c. à café de curry doux ou paprika fumé
1 c. à soupe de sauce soja
Sel et poivre au goût
Quelques feuilles de coriandre pour la déco

- Accessoires pour créer l’ambiance Indiana Jones : 
Carnet en cuir, boussole, lanterne, herbes sauvages, planche en bois ou toile de jute', 
'Préparer le riz : cuire selon les indications du paquet. Égoutter et réserver au chaud.
Cuisson des légumes : faire revenir oignon et ail dans l’huile jusqu’à transparence. Ajouter carotte, poivron, maïs, cuire 5–7 min.
Cuisson de la viande : griller ou poêler les morceaux, ajouter curry/paprika et sauce soja.
Assemblage : riz en base, légumes et viande par-dessus, verser un filet de bouillon pour humidifier légèrement.
Finition / mise en scène : décorer de coriandre, disposer accessoires autour du bol pour l’ambiance expédition. Servir chaud, angle légèrement plongeant pour le visuel Indiana Jones.', 
25, 'Moyenne', true, 5);

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

INSERT INTO notices (quote, content, id_user, id_recipe) VALUES
    (5, 'Excellent recette', 1, 1),
    (4, 'Très bonne recette', 2, 1),
    (4, 'Recette moyenne', 3, 1),
    (4, 'Recette correcte', 1, 2),
    (4, 'Recette moyenne', 2, 2),
    (1, 'j''aime pas du tout', 3, 2),
    (2, 'pas terrible la biere et le beurre', 1, 3),
    (4, 'Recette cool', 2, 3),
    (5, 'Recette cool', 3, 3),
    (5, 'Une merveille', 1, 4),
    (5, 'A partager en famille', 2, 4),
    (5, 'Une merveille', 3, 4),
    (3, 'C''est pas mon delire, le foie', 1, 5),
    (5, 'J''adore cette recette', 2, 5),
    (5, 'Une tuerie', 3, 5),
    (5, 'Recette cool', 1, 6),
    (5, 'un delice', 2, 6),
    (5, 'J''adore cette recette', 3, 6);



-- =====================================================
-- TABLE USERS_RECIPES
-- =====================================================

CREATE TABLE IF NOT EXISTS "users_recipes" (
    "id" SERIAL PRIMARY KEY,
    "id_user" INT REFERENCES "users" ("id"),
    "id_recipe" INT REFERENCES "recipes" ("id")
);

INSERT INTO users_recipes (id_user, id_recipe) VALUES
((SELECT id FROM users WHERE pseudo = 'ludo'), (SELECT id FROM recipes WHERE name = 'Apple pie')),
((SELECT id FROM users WHERE pseudo = 'ludo'), (SELECT id FROM recipes WHERE name = 'bièraubeurre')),
((SELECT id FROM users WHERE pseudo = 'ludo'), (SELECT id FROM recipes WHERE name = 'carbonnade flamande')),
((SELECT id FROM users WHERE pseudo = 'ludo'), (SELECT id FROM recipes WHERE name = 'La tarte à la Mélasse')),
((SELECT id FROM users WHERE pseudo = 'pipou'), (SELECT id FROM recipes WHERE name = 'le foie et ses fèves au beurre')),
((SELECT id FROM users WHERE pseudo = 'Semauri'), (SELECT id FROM recipes WHERE name = 'Le Bol du Temple Perdu'));