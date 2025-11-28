--
-- PostgreSQL database dump
--

\restrict QbJD1VOJMJhg8A4eBR3oc5jUyS16kaP0ioz4J3Jg1QqNyU9k8XmNg8EjJ5WBRPW

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
    status boolean DEFAULT false
);


ALTER TABLE public.movies OWNER TO cinedelices;

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
    id_user integer,
    id_recipe integer
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
    id_movie integer
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
    role character varying(50) DEFAULT 'user'::character varying
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

COPY public.movies (id, title, year, genre, picture, status) FROM stdin;
1	Crocodile Dundee	1986	aventure	/images/movies/croco-dundee-2.jpg	t
2	Kaamelott	2005	comédie	/images/movies/kaamelott-2.png	t
3	Retour vers le futur	1985	aventure	/images/movies/doc-et-marty-2.jpg	t
4	Harry Potter	2001	fantastique	/images/movies/harry-potter-1.png	t
5	Commando	2001	action	/images/movies/commando-shwarzy-1.png	t
6	John Wick	2010	action	/images/movies/johnwick.jpg	t
7	Pirates des caraibes	2008	fantastique	/images/movies/sparrow-2.jpg	t
\.


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

COPY public.notices (id, quote, content, id_user, id_recipe) FROM stdin;
1	5	Excellent recette	1	1
2	4	Très bonne recette	2	1
3	3	Recette correcte	3	2
4	2	Recette moyenne	4	2
5	1	Mauvaise recette	5	3
\.


--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

COPY public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie) FROM stdin;
1	Recette Croco	Recette inspirée du film Crocodile Dundee	/images/recipes/croco-dundee-2.jpg	plat	5	Ingrédients du croco	Préparation du croco	60	Difficile	t	1
2	Recette Kaamelott	Recette inspirée du film Kaamelott	/images/recipes/kaamelott-2.png	entrée	4	Ingrédients de Kaamelott	Préparation de Kaamelott	30	Moyenne	t	2
3	Recette Retour vers le futur	Recette inspirée du film Retour vers le futur	/images/recipes/doc-and-marty-peach-pie-1.jpg	dessert	3	Ingrédients du futur	Préparation du futur	45	Facile	t	3
4	2Recette Croco	Recette inspirée du film Crocodile Dundee	/images/recipes/croco-dundee-2.jpg	entrée	5	Ingrédients du croco	Préparation du croco	60	Difficile	t	1
5	3Recette Croco	Recette inspirée du film Crocodile Dundee	/images/recipes/croco-dundee-2.jpg	dessert	5	Ingrédients du croco	Préparation du croco	60	Difficile	t	1
7	5Recette Croco	Recette inspirée du film Crocodile Dundee	/images/recipes/croco-dundee-2.jpg	entrée	5	Ingrédients du croco	Préparation du croco	60	Difficile	t	1
8	6Recette Croco	Recette inspirée du film Crocodile Dundee	/images/recipes/croco-dundee-2.jpg	dessert	5	Ingrédients du croco	Préparation du croco	60	Difficile	t	1
9	7Recette Croco	Recette inspirée du film Crocodile Dundee	/images/recipes/croco-dundee-2.jpg	plat	5	Ingrédients du croco	Préparation du croco	60	Difficile	t	1
6	Steak d'Outback Australien	Cette recette trouve son origine dans les scènes emblématiques de Crocodile Dundee où Mick Dundee, le héros australien, savoure les saveurs authentiques de l'Outback. On peut notamment voir cette scène lors de son passage dans un restaurant local où il déguste un steak épais et juteux, grillé à la manière australienne, accompagné d'une sauce à la bière locale et de légumes rôtis. Cette scène illustre parfaitement la culture culinaire australienne et l'authenticité des saveurs de l'Outback.	/images/recipes/croco-dundee-2.jpg	plat	5	• 4 steaks de bœuf épais (environ 200g chacun)\\n• 2 cuillères à soupe d'huile d'olive\\n• 4 gousses d'ail, hachées\\n• 1 cuillère à café de poivre noir moulu\\n• 1 cuillère à café de sel de mer\\n• 1 cuillère à café de paprika\\n• 1 cuillère à café de thym séché\\n• 2 oignons rouges, coupés en rondelles\\n• 500ml de bière blonde australienne\\n• 2 cuillères à soupe de miel\\n• 2 cuillères à soupe de vinaigre balsamique\\n• 4 pommes de terre moyennes\\n• 2 courgettes\\n• 2 poivrons rouges\\n• Beurre\\n• Persil frais pour la garniture	1. Préparez la marinade : Dans un bol, mélangez l'huile d'olive, l'ail haché, le poivre, le sel, le paprika et le thym. Badigeonnez les steaks avec ce mélange et laissez mariner au moins 30 minutes au réfrigérateur.\\n\\n2. Préparez la sauce à la bière : Dans une casserole, faites revenir les oignons dans un peu d'huile jusqu'à ce qu'ils soient translucides. Ajoutez la bière, le miel et le vinaigre balsamique. Laissez mijoter à feu moyen-doux pendant 15-20 minutes jusqu'à ce que la sauce épaississe. Réservez au chaud.\\n\\n3. Préparez les légumes : Coupez les pommes de terre en quartiers, les courgettes en rondelles et les poivrons en lanières. Mélangez-les avec de l'huile d'olive, du sel et du poivre. Faites-les rôtir au four à 200°C pendant 25-30 minutes jusqu'à ce qu'ils soient dorés et tendres.\\n\\n4. Cuisez les steaks : Dans une poêle très chaude ou sur un grill, faites cuire les steaks 4-5 minutes de chaque côté pour une cuisson à point (ajustez selon vos préférences). Ajoutez une noix de beurre sur chaque steak en fin de cuisson.\\n\\n5. Servez : Disposez les steaks sur les assiettes, nappez avec la sauce à la bière, ajoutez les légumes rôtis et parsemez de persil frais. Accompagnez d'une bière australienne pour une expérience authentique !	75	Moyenne	t	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

COPY public.users (id, first_name, last_name, pseudo, email, password, picture, role) FROM stdin;
1	Ludovic	Trichereau	Ludo	ludo.trich@gmail.com	****	\N	admin
2	Richard	François	Riri	rich.franc@gmail.com	***	\N	admin
3	Denis	Faucon	La malice	den.fau@gmail.com	****	\N	admin
4	Sebastien	Maurice	Le fourbe	seb.mau@gmail.com	****	\N	admin
5	admin2	test2	admin2_2025	admin2@gmail.com	$argon2id$v=19$m=65536,t=3,p=4$z/u9bVWrzHucKTXQYsxXFQ$/pW7Z7KlCrsC1W/xW/NJ1bdeo+Ci5oFsHd+rtO8Fi5I	\N	admin
7	Seb	Mauri	Semauri	semauri@cinedelices.com	$argon2id$v=19$m=65536,t=3,p=4$3zh+6NKeKdSjoq2490C8DA$nMfhF31LKrJPIOtzlGoOzIHHKG3x867pWq/KTv/RUeU	\N	admin
\.


--
-- Data for Name: users_recipes; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

COPY public.users_recipes (id, id_user, id_recipe) FROM stdin;
1	1	1
2	\N	2
3	3	2
4	4	3
5	\N	3
\.


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.movies_id_seq', 7, true);


--
-- Name: notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.notices_id_seq', 5, true);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.recipes_id_seq', 9, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: users_recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.users_recipes_id_seq', 5, true);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: cinedelices
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


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

\unrestrict QbJD1VOJMJhg8A4eBR3oc5jUyS16kaP0ioz4J3Jg1QqNyU9k8XmNg8EjJ5WBRPW

