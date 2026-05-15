import { Sequelize, Op } from "sequelize";
import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const homeController = {
  //page d'accueil
  async home(req, res) {
    // les 3 recettes les mieux notées
    try {
      const recipes = await Recipe.findAll({
        where: { status: "approved" },
        include: [
          {
            model: Movie,
            attributes: ["title"], // on récupère uniquement le nom du film
            where: { status: "approved" },
          },
          {
            model: User,
            as: "contributor",
            attributes: ["pseudo", "picture", "role"],
          },
        ],
        order: [["quote", "DESC"]], // tri par note décroissante
        limit: 3, // limite à 3 résultats pour avoir les 3 meilleures recettes
      });

      if (!recipes) {
        return renderNotFound(res, "Recettes");
      }

      // recette du jour en aléatoire
      const topRecipe = await Recipe.findOne({
        where: { status: "approved" },
        include: [
          { model: Movie, where: { status: "approved" } },
          { model: User, as: "contributor", attributes: ["id", "pseudo", "picture", "role"] },
        ],
        order: [Sequelize.literal("RANDOM()")], // PostgreSQL utilise RANDOM()
      });

      // Duo du Jour : enrichir le film lié à topRecipe (garantit film ↔ recette cohérents)
      let duoFilm = null;
      if (topRecipe && topRecipe.Movie) {
        const [enriched] = enrichMoviesWithImagePaths([topRecipe.Movie]);
        const duoRecipeCount = await Recipe.count({
          where: { status: "approved", id_movie: topRecipe.Movie.id },
        });
        duoFilm = { ...enriched, recipeCount: duoRecipeCount };
      }

      // afficher 4 films aléatoirement sur la page d'accueil (avec au moins 1 recette approuvée)
      const moviesWithRecipes = await Recipe.findAll({
        where: { status: "approved" },
        attributes: ["id_movie"],
        group: ["id_movie"],
        raw: true,
      });
      const movieIdsWithApprovedRecipes = moviesWithRecipes.map((r) => r.id_movie).filter(Boolean);

      const topMovies = await Movie.findAll({
        where: {
          status: "approved",
          id: { [Op.in]: movieIdsWithApprovedRecipes },
        },
        order: [Sequelize.literal("RANDOM()")],
        limit: 4,
      });
      if (!topMovies || topMovies.length === 0) {
        return renderNotFound(res, "Films");
      }

      // Lister les images du dossier recipes
      let recipeImages = []; // création d'un tableau vide
      try {
        const imagesDir = path.join(__dirname, "../public/images/event"); // Chemin vers le dossier des images
        const files = await fs.readdir(imagesDir);

        // Filtrer uniquement les fichiers images
        recipeImages = files
          .filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
          })
          .map((file) => `/images/event/${file}`); // Créer le chemin relatif pour l'affichage dans la vue. map rempli le tableau recipeImages.
      } catch (error) {
        console.error("Erreur lors de la lecture du dossier recipes:", error);
        // Si le dossier n'existe pas ou erreur, on continue avec un tableau vide
      }

      // Compter les recettes approuvées par film (pour les film-cards)
      const movieIds = topMovies.map(m => m.id);
      const recipeCounts = await Recipe.findAll({
        where: { status: "approved", id_movie: movieIds },
        attributes: ["id_movie", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
        group: ["id_movie"],
        raw: true,
      });
      const countMap = {};
      recipeCounts.forEach(r => { countMap[r.id_movie] = parseInt(r.count, 10); });

      // Enrichir les topMovies avec les chemins d'images + le compteur de recettes
      const enrichedTopMovies = enrichMoviesWithImagePaths(topMovies).map(m => ({
        ...m,
        recipeCount: countMap[m.id] || 0,
      }));

      // Statistiques par genre (pour la category-strip) — uniquement films avec recettes approuvées
      const genreStats = await Movie.findAll({
        where: {
          status: "approved",
          id: { [Op.in]: movieIdsWithApprovedRecipes },
        },
        attributes: ["genre", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
        group: ["genre"],
        order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
        raw: true,
      });

      // Top 3 films par genre pour les tooltips du carrousel
      const genreTopMoviesRaw = await Movie.findAll({
        where: { status: "approved", id: { [Op.in]: movieIdsWithApprovedRecipes } },
        include: [{ model: Recipe, where: { status: "approved" }, attributes: [] }],
        attributes: ["genre", "title", [Sequelize.fn("COUNT", Sequelize.col("Recipes.id")), "recipeCount"]],
        group: ["Movie.id"],
        order: [["genre", "ASC"], [Sequelize.fn("COUNT", Sequelize.col("Recipes.id")), "DESC"]],
        subQuery: false,
        raw: true,
      });
      // Grouper par genre, garder max 3 films par genre
      const genreFilmsMap = {};
      for (const m of genreTopMoviesRaw) {
        if (!genreFilmsMap[m.genre]) genreFilmsMap[m.genre] = [];
        if (genreFilmsMap[m.genre].length < 3) {
          genreFilmsMap[m.genre].push({ t: m.title, n: String(m.recipeCount) });
        }
      }

      // Statistiques communauté (COUNT)
      const [totalUsers, totalRecipes, totalMovies] = await Promise.all([
        User.count(),
        Recipe.count({ where: { status: "approved" } }),
        Movie.count({ where: { status: "approved" } }),
      ]);

      // Top 3 contributeurs (classés par nombre de recettes approuvées, admins exclus)
      const topContributors = await User.findAll({
        attributes: [
          "id",
          "pseudo",
          "picture",
          [Sequelize.fn("COUNT", Sequelize.col("recipes.id")), "recipe_count"],
        ],
        where: { role: "user" },
        include: [{
          model: Recipe,
          as: "recipes",
          where: { status: "approved" },
          attributes: [],
          required: true,
        }],
        group: ["User.id"],
        order: [[Sequelize.fn("COUNT", Sequelize.col("recipes.id")), "DESC"]],
        limit: 3,
        subQuery: false,
      });

      // Rendre la vue avec les recettes
      res.render("home", {
        recipes,
        topRecipe,
        duoFilm,
        topMovies: enrichedTopMovies,
        recipeImages,
        genreStats,
        genreFilmsMap,
        totalUsers,
        totalRecipes,
        totalMovies,
        topContributors: topContributors.map((u) => u.toJSON()),
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
    }
  },

  async sitemap(req, res) {
    try {
      const BASE = process.env.BASE_URL || "https://cinedelices.com";
      const now  = new Date().toISOString().split("T")[0];

      const [movies, recipes, authors] = await Promise.all([
        Movie.findAll({
          where: { status: "approved" },
          attributes: ["id", "slug", "updatedAt"],
        }),
        Recipe.findAll({
          where: { status: "approved" },
          attributes: ["id", "slug", "updatedAt"],
          include: [{ model: Movie, attributes: ["id"], required: true }],
        }),
        // Auteurs : membres avec au moins une recette approuvée
        User.findAll({
          attributes: ["id", "updatedAt"],
          include: [{
            model: Recipe,
            as: "recipes",
            where: { status: "approved" },
            attributes: [],
            required: true,
          }],
        }),
      ]);

      const url = (loc, freq, priority, lastmod = now) =>
        `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

      const staticUrls = [
        url(`${BASE}/`,               "daily",   "1.0"),
        url(`${BASE}/movies`,          "daily",   "0.9"),
        url(`${BASE}/recipes-movie`,   "daily",   "0.9"),
        url(`${BASE}/contact-about`,   "monthly", "0.5"),
        url(`${BASE}/mentions-legales`, "yearly", "0.3"),
      ].join("\n");

      const movieUrls  = movies.map(m => url(`${BASE}/recipes-movie/${m.slug || m.id}`, "weekly", "0.8", m.updatedAt ? new Date(m.updatedAt).toISOString().split("T")[0] : now)).join("\n");
      const recipeUrls = recipes.map(r => url(`${BASE}/recipes-movie/details/${r.slug || r.id}`, "weekly", "0.7", r.updatedAt ? new Date(r.updatedAt).toISOString().split("T")[0] : now)).join("\n");
      const authorUrls = authors.map(a => url(`${BASE}/auteur/${a.id}`, "monthly", "0.5", a.updatedAt ? new Date(a.updatedAt).toISOString().split("T")[0] : now)).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${movieUrls}
${recipeUrls}
${authorUrls}
</urlset>`;

      res.header("Content-Type", "application/xml");
      res.header("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (error) {
      res.status(500).send("Erreur génération sitemap");
    }
  },
};

export default homeController;
