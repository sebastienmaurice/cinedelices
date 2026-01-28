--
-- PostgreSQL database dump
--

\restrict 1n9zhbkZg9NtZjU0RPd7o9F77GILxWZKpOAgEFOQWYbQfdNMhdU3850lTegSReD

-- Dumped from database version 17.6 (Ubuntu 17.6-2.pgdg24.04+1)
-- Dumped by pg_dump version 17.6 (Ubuntu 17.6-2.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.users_recipes DROP CONSTRAINT users_recipes_id_user_fkey;
ALTER TABLE ONLY public.users_recipes DROP CONSTRAINT users_recipes_id_recipe_fkey;
ALTER TABLE ONLY public.recipes DROP CONSTRAINT recipes_id_user_fkey;
ALTER TABLE ONLY public.recipes DROP CONSTRAINT recipes_id_movie_fkey;
ALTER TABLE ONLY public.notices DROP CONSTRAINT notices_id_user_fkey;
ALTER TABLE ONLY public.notices DROP CONSTRAINT notices_id_recipe_fkey;
ALTER TABLE ONLY public.movies DROP CONSTRAINT movies_id_user_fkey;
ALTER TABLE ONLY public.movies DROP CONSTRAINT movies_delete_request_by_fkey;
DROP INDEX public.idx_movies_type;
DROP INDEX public.idx_movies_tmdb_id;
ALTER TABLE ONLY public.users_recipes DROP CONSTRAINT users_recipes_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pseudo_key;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.recipes DROP CONSTRAINT recipes_pkey;
ALTER TABLE ONLY public.notices DROP CONSTRAINT notices_pkey;
ALTER TABLE ONLY public.movies DROP CONSTRAINT movies_tmdb_id_key;
ALTER TABLE ONLY public.movies DROP CONSTRAINT movies_pkey;
ALTER TABLE public.users_recipes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.recipes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.notices ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.movies ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.users_recipes_id_seq;
DROP TABLE public.users_recipes;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP SEQUENCE public.recipes_id_seq;
DROP TABLE public.recipes;
DROP SEQUENCE public.notices_id_seq;
DROP TABLE public.notices;
DROP SEQUENCE public.movies_id_seq;
DROP TABLE public.movies;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: movies; Type: TABLE; Schema: public; Owner: cinedelices
--

CREATE TABLE public.movies (
    id integer NOT NULL,
    title text NOT NULL,
    year integer NOT NULL,
    genre character varying(100) NOT NULL,
    picture character varying(255),
    status boolean DEFAULT false,
    tmdb_id integer,
    type character varying(10) DEFAULT 'film'::character varying,
    id_user integer,
    delete_request_status character varying(20) DEFAULT 'none'::character varying,
    delete_request_by integer,
    delete_request_at timestamp without time zone,
    edit_status character varying(20) DEFAULT 'none'::character varying,
    pending_title text,
    pending_year integer,
    pending_genre character varying(100),
    edit_requested_at timestamp without time zone
);


ALTER TABLE public.movies OWNER TO cinedelices;

--
-- Name: COLUMN movies.type; Type: COMMENT; Schema: public; Owner: cinedelices
--

COMMENT ON COLUMN public.movies.type IS 'Type de contenu : film ou serie';


--
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: cinedelices
--

CREATE SEQUENCE public.movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movies_id_seq OWNER TO cinedelices;

--
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cinedelices
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- Name: notices; Type: TABLE; Schema: public; Owner: cinedelices
--

CREATE TABLE public.notices (
    id integer NOT NULL,
    quote integer NOT NULL,
    content text NOT NULL,
    status boolean DEFAULT false,
    id_user integer,
    id_recipe integer,
    edit_status character varying(20) DEFAULT 'none'::character varying,
    pending_content text,
    pending_quote integer,
    edit_requested_at timestamp without time zone,
    delete_request_status character varying(20) DEFAULT 'none'::character varying,
    delete_request_at timestamp without time zone
);


ALTER TABLE public.notices OWNER TO cinedelices;

--
-- Name: notices_id_seq; Type: SEQUENCE; Schema: public; Owner: cinedelices
--

CREATE SEQUENCE public.notices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notices_id_seq OWNER TO cinedelices;

--
-- Name: notices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cinedelices
--

ALTER SEQUENCE public.notices_id_seq OWNED BY public.notices.id;


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: cinedelices
--

CREATE TABLE public.recipes (
    id integer NOT NULL,
    name text NOT NULL,
    description character varying(2000) NOT NULL,
    picture character varying(255),
    category character varying(100) NOT NULL,
    quote integer DEFAULT 0,
    ingredients character varying(1000) NOT NULL,
    preparation character varying(2000) NOT NULL,
    "time" integer NOT NULL,
    difficulty character varying(50) NOT NULL,
    status boolean DEFAULT false,
    id_movie integer,
    id_user integer,
    edit_status character varying(20) DEFAULT 'none'::character varying,
    pending_name text,
    pending_description text,
    pending_picture character varying(255),
    pending_category character varying(100),
    pending_ingredients text,
    pending_preparation text,
    pending_time integer,
    pending_difficulty character varying(50),
    edit_requested_at timestamp without time zone,
    servings integer
);


ALTER TABLE public.recipes OWNER TO cinedelices;

--
-- Name: recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: cinedelices
--

CREATE SEQUENCE public.recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recipes_id_seq OWNER TO cinedelices;

--
-- Name: recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cinedelices
--

ALTER SEQUENCE public.recipes_id_seq OWNED BY public.recipes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: cinedelices
--

CREATE TABLE public.users (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    pseudo text NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    picture character varying(255),
    role character varying(50) DEFAULT 'user'::character varying,
    notify_recipes boolean DEFAULT true,
    notify_cinema boolean DEFAULT true,
    picture_status character varying(20) DEFAULT 'approved'::character varying
);


ALTER TABLE public.users OWNER TO cinedelices;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: cinedelices
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO cinedelices;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cinedelices
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_recipes; Type: TABLE; Schema: public; Owner: cinedelices
--

CREATE TABLE public.users_recipes (
    id integer NOT NULL,
    id_user integer,
    id_recipe integer
);


ALTER TABLE public.users_recipes OWNER TO cinedelices;

--
-- Name: users_recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: cinedelices
--

CREATE SEQUENCE public.users_recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_recipes_id_seq OWNER TO cinedelices;

--
-- Name: users_recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: cinedelices
--

ALTER SEQUENCE public.users_recipes_id_seq OWNED BY public.users_recipes.id;


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Name: notices id; Type: DEFAULT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.notices ALTER COLUMN id SET DEFAULT nextval('public.notices_id_seq'::regclass);


--
-- Name: recipes id; Type: DEFAULT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.recipes ALTER COLUMN id SET DEFAULT nextval('public.recipes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: users_recipes id; Type: DEFAULT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users_recipes ALTER COLUMN id SET DEFAULT nextval('public.users_recipes_id_seq'::regclass);


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.movies (id, title, year, genre, picture, status, tmdb_id, type, id_user, delete_request_status, delete_request_by, delete_request_at, edit_status, pending_title, pending_year, pending_genre, edit_requested_at) VALUES (2, 'American pie', 1999, 'comédie', '/images/movies/movie-american_pie-1764103560707-335098533.png', true, NULL, 'film', NULL, 'none', NULL, NULL, 'none', NULL, NULL, NULL, NULL);
INSERT INTO public.movies (id, title, year, genre, picture, status, tmdb_id, type, id_user, delete_request_status, delete_request_by, delete_request_at, edit_status, pending_title, pending_year, pending_genre, edit_requested_at) VALUES (4, 'Le silence des agneaux', 1991, 'thriller', '/images/movies/movie-Le-silence-des-agneaux-1764145159444-648907832.png', true, NULL, 'film', NULL, 'none', NULL, NULL, 'none', NULL, NULL, NULL, NULL);
INSERT INTO public.movies (id, title, year, genre, picture, status, tmdb_id, type, id_user, delete_request_status, delete_request_by, delete_request_at, edit_status, pending_title, pending_year, pending_genre, edit_requested_at) VALUES (3, 'Bienvenue chez les Ch''tis', 2008, 'comédie', '/images/movies/movie-bienvenue_chtis-1764103577240-542365048.png', true, NULL, 'film', NULL, 'none', NULL, NULL, 'none', NULL, NULL, NULL, NULL);
INSERT INTO public.movies (id, title, year, genre, picture, status, tmdb_id, type, id_user, delete_request_status, delete_request_by, delete_request_at, edit_status, pending_title, pending_year, pending_genre, edit_requested_at) VALUES (11, 'La Belle et le Clochard', 1955, 'familial', NULL, false, NULL, 'film', 3, 'none', NULL, NULL, 'none', NULL, NULL, NULL, NULL);
INSERT INTO public.movies (id, title, year, genre, picture, status, tmdb_id, type, id_user, delete_request_status, delete_request_by, delete_request_at, edit_status, pending_title, pending_year, pending_genre, edit_requested_at) VALUES (1, 'Harry Potter', 2001, 'fantastique', '/images/movies/movie-harry_potter-1763858232674-340071843.png', true, NULL, 'film', 3, 'none', NULL, NULL, 'none', NULL, NULL, NULL, NULL);
INSERT INTO public.movies (id, title, year, genre, picture, status, tmdb_id, type, id_user, delete_request_status, delete_request_by, delete_request_at, edit_status, pending_title, pending_year, pending_genre, edit_requested_at) VALUES (5, 'Indiana Jones et les Aventuriers de l’Arche perdue', 1981, 'aventure', '/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg', true, NULL, 'film', 3, 'none', NULL, NULL, 'none', NULL, NULL, NULL, NULL);


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.notices (id, quote, content, status, id_user, id_recipe, edit_status, pending_content, pending_quote, edit_requested_at, delete_request_status, delete_request_at) VALUES (3, 4, 'Recette moyenne', false, 3, 1, 'none', NULL, NULL, NULL, 'none', NULL);
INSERT INTO public.notices (id, quote, content, status, id_user, id_recipe, edit_status, pending_content, pending_quote, edit_requested_at, delete_request_status, delete_request_at) VALUES (18, 5, 'J''adore cette recette', true, 3, 6, 'none', NULL, NULL, NULL, 'none', NULL);
INSERT INTO public.notices (id, quote, content, status, id_user, id_recipe, edit_status, pending_content, pending_quote, edit_requested_at, delete_request_status, delete_request_at) VALUES (17, 5, 'un delice', true, 2, 6, 'none', NULL, NULL, NULL, 'none', NULL);
INSERT INTO public.notices (id, quote, content, status, id_user, id_recipe, edit_status, pending_content, pending_quote, edit_requested_at, delete_request_status, delete_request_at) VALUES (12, 5, 'Une merveille', true, 3, 4, 'none', NULL, NULL, NULL, 'none', NULL);
INSERT INTO public.notices (id, quote, content, status, id_user, id_recipe, edit_status, pending_content, pending_quote, edit_requested_at, delete_request_status, delete_request_at) VALUES (11, 5, 'A partager en famille', true, 2, 4, 'none', NULL, NULL, NULL, 'none', NULL);


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (2, 'Apple pie', 'Dans le film American Pie, la scène où Jim se retrouve en tête à tête avec la tarte aux pommes se produit lorsqu''il est surpris par ses parents. Cette scène est considérée comme mythique et est l''une des plus célèbres du film. Elle a marqué la mémoire des spectateurs et est devenue un moment emblématique de la saga', '/images/recipes/applepie-1764137966385-745300976.jpg', 'dessert', 0, '- Farine 300g,
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
', 75, 'Facile', true, 2, NULL, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (4, 'carbonnade flamande', 'À l’minche chez Antoine, quand qu’Philippe y’est invité à goûter les spécialités du Nord. Ch’est là qu’on l’y sert l’fameuse carbonnade flamande.
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
6. Servez la carbonade avec des petites pommes de terre vapeur et les cubes de pain d’épices grillés.', 220, 'Facile', true, 3, NULL, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (1, 'La tarte à la Mélasse', 'Lors du banquet de bienvenue, Hermione refuse de manger en apprenant que ce sont des elfes de maison qui ont préparé le repas. Avec une tarte à la mélasse, Ron tente de convaincre Hermione de manger', '/images/recipes/tarte_melasse-1764137492266-726416795.jpeg', 'dessert', 0, '- 1 pâte brisée (faite maison ou achetée)
- 300 g de mélasse (liquide issu d’un raffinage de sucre et de betterave ou canne à sucre)
- 190 g de lait
- 160 g de sucre
- 1 cuillère à soupe de farine
- 1 œuf
', '1. Préchauffer le four à 220°C.
2. Dans un saladier, mélanger l’œuf avec le lait et la farine, puis ajouter le sucre.
3. Dans un moule à tarte beurré ou recouvert d’un papier sulfurisé, déposer la pâte brisée.
4. Verser la précédente préparation sur le fond de tarte.
5. S’il reste un surplus de pâte, réaliser des bandes fines et les disposer au-dessus de la tarte (facultatif)', 50, 'Moyenne', true, 1, 3, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (5, 'le foie et ses fèves au beurre', 'Dans le film Le Silence des Agneaux, lors d''un entretien en tête à tête avec l''agent Clarice Starling, le Docteur Hannibal Lecter, psychopathe cannibale, dans un thriller policier, et esthète culinaire s’il en est, mentionne ceci :

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
', 60, 'Facile', true, 4, NULL, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (12, 'Spaghettis à la Boulette de Lady & le Clochard', 'Scène culte du cinéma d’animation : Lady et le Clochard partagent un plat de spaghettis dans une ruelle italienne, sous une lumière tamisée, au son d’une mandoline. Ce moment tendre et intemporel transforme un simple repas en symbole d’amour et de partage.', '/images/recipes/recipe-belle et clochard-1768929837489-4693451.jpeg', 'plat', 0, '250 g de spaghettis  
300 g de viande hachée (bœuf ou bœuf/porc)  
1 œuf  
30 g de chapelure  
40 g de parmesan râpé  
1 gousse d’ail  
1 petit oignon  
400 g de sauce tomate  
Quelques feuilles de basilic frais  
Huile d’olive  
Sel, poivre  ', 'Mélanger la viande hachée, l’œuf, la chapelure, la moitié du parmesan, le sel et le poivre.  
Former des boulettes et les faire dorer dans une poêle avec un peu d’huile d’olive. Réserver.  
Dans la même poêle, faire revenir l’oignon et l’ail finement hachés.  
Ajouter la sauce tomate et laisser mijoter 10 minutes.  
Remettre les boulettes dans la sauce et laisser cuire encore 15 minutes à feu doux.  
Cuire les spaghettis al dente dans une grande casserole d’eau salée.  
Égoutter les pâtes, les mélanger à la sauce et servir avec le reste de parmesan et du basilic.', 15, 'Moyenne', false, 11, 3, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (3, 'bièraubeurre', 'La Bièraubeurre, souvent confondue avec un soda par ceux qui n’ont jamais eu le privilège d’y goûter, est une boisson emblématique de l’univers d’Harry Potter. En dépit de sa popularité dans la cuisine des sorciers, elle trouve aussi sa place parmi les cocktails moldus inspirés par la magie. À la fois pétillante et envoûtante, cette boisson est souvent agrémentée de sirops pour rehausser son goût unique.', '/images/recipes/biereaubeurre-1764137132022-745397718.jpeg', 'dessert', 0, '- Bière sans alcool 33 cls
- 1 cuillère à café de sucre roux
- 1 noisette de beurre
- Crème  (chantilly, ou 20cl de creme liquide et 1 pincee de sucre)
- Epices au choix  (cannelle, gingembre, clou de girofle en poudre)', '1. Commencez par verser le sucre roux dans une casserole, puis ajoutez les 2 cuillères à soupe d’eau. Chauffez à feu moyen et patientez jusqu’à l’apparition de bulles dorées signalant que le mélange commence à caraméliser. Tout en remuant délicatement, incorporez le beurre dans ce doux mélange jusqu’à sa parfaite fusion. N’oubliez pas d’ajouter quelques gouttes de vinaigre de cidre, pour ajouter une subtile touche acidulée.

2. Versez progressivement la crème liquide tout en continuant à remuer jusqu’à obtenir une préparation homogène. Pour une note épicée, ajoutez une pincée de cannelle selon vos goûts et remuez bien.

3. Une fois votre concoction prête, laissez-la refroidir directement dans des verres à bière. À l’heure de la dégustation, versez un peu de bière dans le verre contenant votre préparation refroidie, et remuez avec grâce. Selon votre palais, vous pouvez choisir un panaché, une bière sans alcool ou même une bière classique. Pour couronner le tout, n’oubliez pas de garnir d’une onctueuse couche de crème chantilly."', 15, 'Facile', true, 1, 3, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie, id_user, edit_status, pending_name, pending_description, pending_picture, pending_category, pending_ingredients, pending_preparation, pending_time, pending_difficulty, edit_requested_at, servings) VALUES (6, 'Le Bol du Temple Perdu', 'Après avoir exploré des temples et traversé la jungle, Indiana Jones fait une pause sur un campement improvisé. Il savoure un bol rustique de riz, légumes et viande avant de reprendre son aventure pleine de dangers et de mystères.', '/images/recipes/recette-indiana-jones-bol-expedition-v1-1764166522021-433994479.png', 'plat', 0, '200 g de riz parfumé (basmati ou jasmin)
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
Carnet en cuir, boussole, lanterne, herbes sauvages, planche en bois ou toile de jute', 'Préparer le riz : cuire selon les indications du paquet. Égoutter et réserver au chaud.
Cuisson des légumes : faire revenir oignon et ail dans l’huile jusqu’à transparence. Ajouter carotte, poivron, maïs, cuire 5–7 min.
Cuisson de la viande : griller ou poêler les morceaux, ajouter curry/paprika et sauce soja.
Assemblage : riz en base, légumes et viande par-dessus, verser un filet de bouillon pour humidifier légèrement.
Finition / mise en scène : décorer de coriandre, disposer accessoires autour du bol pour l’ambiance expédition. Servir chaud, angle légèrement plongeant pour le visuel Indiana Jones.', 25, 'Moyenne', true, 5, 3, 'none', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role, notify_recipes, notify_cinema, picture_status) VALUES (2, 'pi', 'pou', 'pipou', 'pi@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$4E0hz9IgK5N70B3BlijyFQ$envgJnqFUewcMi7Zda10T85NXUpo6pUoBq9s2EURUQE', NULL, 'admin', true, true, 'approved');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role, notify_recipes, notify_cinema, picture_status) VALUES (3, 'Sébastien', 'Maurice', 'Seb le Fourbe', 'overseb75@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$rm31npIsOj9mvy61SHjxPA$urAdMO1JfJlVZ4pMngGZ8lkxSpWZttEOGE1CSIvMTPs', '/images/profiles/profile-2-1769084289299-21651021.png', 'admin', true, true, 'pending');


--
-- Data for Name: users_recipes; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.users_recipes (id, id_user, id_recipe) VALUES (5, 2, 5);
INSERT INTO public.users_recipes (id, id_user, id_recipe) VALUES (6, 3, 6);


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.movies_id_seq', 11, true);


--
-- Name: notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.notices_id_seq', 18, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.recipes_id_seq', 12, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: users_recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.users_recipes_id_seq', 6, true);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- Name: movies movies_tmdb_id_key; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_tmdb_id_key UNIQUE (tmdb_id);


--
-- Name: notices notices_pkey; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_pseudo_key; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pseudo_key UNIQUE (pseudo);


--
-- Name: users_recipes users_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users_recipes
    ADD CONSTRAINT users_recipes_pkey PRIMARY KEY (id);


--
-- Name: idx_movies_tmdb_id; Type: INDEX; Schema: public; Owner: cinedelices
--

CREATE INDEX idx_movies_tmdb_id ON public.movies USING btree (tmdb_id);


--
-- Name: idx_movies_type; Type: INDEX; Schema: public; Owner: cinedelices
--

CREATE INDEX idx_movies_type ON public.movies USING btree (type);


--
-- Name: movies movies_delete_request_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_delete_request_by_fkey FOREIGN KEY (delete_request_by) REFERENCES public.users(id);


--
-- Name: movies movies_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: notices notices_id_recipe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipes(id);


--
-- Name: notices notices_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.notices
    ADD CONSTRAINT notices_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: recipes recipes_id_movie_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_id_movie_fkey FOREIGN KEY (id_movie) REFERENCES public.movies(id);


--
-- Name: recipes recipes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- Name: users_recipes users_recipes_id_recipe_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users_recipes
    ADD CONSTRAINT users_recipes_id_recipe_fkey FOREIGN KEY (id_recipe) REFERENCES public.recipes(id);


--
-- Name: users_recipes users_recipes_id_user_fkey; Type: FK CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.users_recipes
    ADD CONSTRAINT users_recipes_id_user_fkey FOREIGN KEY (id_user) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 1n9zhbkZg9NtZjU0RPd7o9F77GILxWZKpOAgEFOQWYbQfdNMhdU3850lTegSReD

