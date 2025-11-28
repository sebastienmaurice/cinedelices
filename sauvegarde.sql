--
-- PostgreSQL database dump
--

\restrict TQUjRupEA9VhYre7jMM73ES5yEEX9XjnXlg3yjLco2lw4GaeqvVDjySMxG538Fa

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
ALTER TABLE ONLY public.recipes DROP CONSTRAINT recipes_id_movie_fkey;
ALTER TABLE ONLY public.notices DROP CONSTRAINT notices_id_user_fkey;
ALTER TABLE ONLY public.notices DROP CONSTRAINT notices_id_recipe_fkey;
ALTER TABLE ONLY public.users_recipes DROP CONSTRAINT users_recipes_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pseudo_key;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
ALTER TABLE ONLY public.recipes DROP CONSTRAINT recipes_pkey;
ALTER TABLE ONLY public.notices DROP CONSTRAINT notices_pkey;
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
    status boolean DEFAULT false,
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

INSERT INTO public.movies (id, title, year, genre, picture, status) VALUES (1, 'Indiana Jones et les Aventuriers de l’Arche perdue', 1981, 'aventure', '/images/movies/movie-affiche-indiana-jones-cinema-v1-1764166572172-810980920.jpg', true);


--
-- Data for Name: notices; Type: TABLE DATA; Schema: public; Owner: cinedelices
--



--
-- Data for Name: recipes; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.recipes (id, name, description, picture, category, quote, ingredients, preparation, "time", difficulty, status, id_movie) VALUES (1, 'Le Bol du Temple Perdu', 'Après avoir exploré des temples et traversé la jungle, Indiana Jones fait une pause sur un campement improvisé. Il savoure un bol rustique de riz, légumes et viande avant de reprendre son aventure pleine de dangers et de mystères.', '/images/recipes/recette-indiana-jones-bol-expedition-v1-1764166522021-433994479.png', 'plat', 0, '200 g de riz parfumé (basmati ou jasmin)
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
Finition / mise en scène : décorer de coriandre, disposer accessoires autour du bol pour l’ambiance expédition. Servir chaud, angle légèrement plongeant pour le visuel Indiana Jones.', 25, 'Moyenne', true, 1);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: cinedelices
--

INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (1, 'Ludovic', 'Trichereau', 'Ludo', 'ludo.trich@gmail.com', '****', NULL, 'admin');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (2, 'Richard', 'François', 'Riri', 'rich.franc@gmail.com', '***', NULL, 'admin');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (3, 'Denis', 'Faucon', 'La malice', 'den.fau@gmail.com', '****', NULL, 'admin');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (4, 'Sebastien', 'Maurice', 'Le fourbe', 'seb.mau@gmail.com', '****', NULL, 'admin');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (5, 'admin2', 'test2', 'admin2_2025', 'admin2@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$z/u9bVWrzHucKTXQYsxXFQ$/pW7Z7KlCrsC1W/xW/NJ1bdeo+Ci5oFsHd+rtO8Fi5I', NULL, 'admin');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (6, 'pi', 'pou', 'pipou', 'pi@gmail.com', '$argon2id$v=19$m=65536,t=3,p=4$4E0hz9IgK5N70B3BlijyFQ$envgJnqFUewcMi7Zda10T85NXUpo6pUoBq9s2EURUQE', NULL, 'admin');
INSERT INTO public.users (id, first_name, last_name, pseudo, email, password, picture, role) VALUES (7, 'Seb', 'Mauri', 'Semauri', 'semauri@cinedelices.com', '$argon2id$v=19$m=65536,t=3,p=4$3zh+6NKeKdSjoq2490C8DA$nMfhF31LKrJPIOtzlGoOzIHHKG3x867pWq/KTv/RUeU', NULL, 'admin');


--
-- Data for Name: users_recipes; Type: TABLE DATA; Schema: public; Owner: cinedelices
--



--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.movies_id_seq', 1, true);


--
-- Name: notices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.notices_id_seq', 1, false);


--
-- Name: recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.recipes_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: users_recipes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cinedelices
--

SELECT pg_catalog.setval('public.users_recipes_id_seq', 1, false);


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

\unrestrict TQUjRupEA9VhYre7jMM73ES5yEEX9XjnXlg3yjLco2lw4GaeqvVDjySMxG538Fa

