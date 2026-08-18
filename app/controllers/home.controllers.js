import { Sequelize, Op } from "sequelize";
import { Recipe, Movie, User } from "../models/index.model.js";
import { enrichMoviesWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

const homeController = {
  //page d'accueil
  async home(req, res) {
    try {
      // ── Vague 1 : requêtes indépendantes, lancées en parallèle ──
      // Aucune de ces requêtes ne dépend du résultat d'une autre — les
      // paralléliser réduit directement le TTFB (avant : ~14 étapes
      // séquentielles, chacune payant un aller-retour réseau vers PostgreSQL).
      const [
        recipes,
        topRecipe,
        moviesWithRecipes,
        heroMovieData,
        topContributors,
        totalUsers,
        totalRecipes,
        totalMovies,
      ] = await Promise.all([
        // les 3 recettes les mieux notées
        Recipe.findAll({
          where: { status: "approved" },
          include: [
            { model: Movie, attributes: ["title"], where: { status: "approved" } },
            { model: User, as: "contributor", attributes: ["pseudo", "picture", "role"] },
          ],
          order: [["quote", "DESC"]],
          limit: 3,
        }),
        // recette du jour en aléatoire
        Recipe.findOne({
          where: { status: "approved" },
          include: [
            { model: Movie, where: { status: "approved" } },
            { model: User, as: "contributor", attributes: ["id", "pseudo", "picture", "role"] },
          ],
          order: [Sequelize.literal("RANDOM()")], // PostgreSQL utilise RANDOM()
        }),
        // films ayant au moins une recette approuvée
        Recipe.findAll({
          where: { status: "approved" },
          attributes: ["id_movie"],
          group: ["id_movie"],
          raw: true,
        }),
        // stats réelles pour les slides hero (Breaking Bad, Ratatouille)
        Movie.findAll({
          where: { slug: { [Op.in]: ["breaking-bad", "ratatouille"] }, status: "approved" },
          attributes: ["id", "slug", "year"],
        }),
        // top 3 contributeurs (classés par nombre de recettes approuvées, admins exclus)
        User.findAll({
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
        }),
        // statistiques communauté (COUNT)
        User.count(),
        Recipe.count({ where: { status: "approved" } }),
        Movie.count({ where: { status: "approved" } }),
      ]);

      if (!recipes) {
        return renderNotFound(res, "Recettes");
      }

      const movieIdsWithApprovedRecipes = moviesWithRecipes.map((r) => r.id_movie).filter(Boolean);

      // ── Vague 2 : dépend des résultats de la vague 1 ──
      const [topMovies, genreStats, allMoviesForGenre, duoRecipeCount, heroStatsList] = await Promise.all([
        // 4 films aléatoires (avec au moins 1 recette approuvée)
        Movie.findAll({
          where: { status: "approved", id: { [Op.in]: movieIdsWithApprovedRecipes } },
          order: [Sequelize.literal("RANDOM()")],
          limit: 4,
        }),
        // statistiques par genre (pour la category-strip)
        Movie.findAll({
          where: { status: "approved", id: { [Op.in]: movieIdsWithApprovedRecipes } },
          attributes: ["genre", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
          group: ["genre"],
          order: [[Sequelize.fn("COUNT", Sequelize.col("id")), "DESC"]],
          raw: true,
        }),
        // tous les films avec recette approuvée (pour les tooltips du carrousel par genre)
        Movie.findAll({
          where: { status: "approved", id: { [Op.in]: movieIdsWithApprovedRecipes } },
          attributes: ["id", "genre", "title"],
          raw: true,
        }),
        // Duo du Jour : nb de recettes du film lié à topRecipe
        topRecipe && topRecipe.Movie
          ? Recipe.count({ where: { status: "approved", id_movie: topRecipe.Movie.id } })
          : Promise.resolve(0),
        // recipeCount + note moyenne pour chaque film hero (2 requêtes//film, déjà parallélisées)
        Promise.all(heroMovieData.map(async (movie) => {
          const [recipeCount, avgResult] = await Promise.all([
            Recipe.count({ where: { status: "approved", id_movie: movie.id } }),
            Recipe.findOne({
              where: { status: "approved", id_movie: movie.id },
              attributes: [[Sequelize.fn("AVG", Sequelize.col("quote")), "avg_quote"]],
              raw: true,
            }),
          ]);
          const avg = avgResult?.avg_quote ? parseFloat(avgResult.avg_quote).toFixed(1) : null;
          return { slug: movie.slug, recipes: recipeCount, note: avg, year: movie.year };
        })),
      ]);

      if (!topMovies || topMovies.length === 0) {
        return renderNotFound(res, "Films");
      }

      // Duo du Jour : enrichir le film lié à topRecipe (garantit film ↔ recette cohérents)
      let duoFilm = null;
      if (topRecipe && topRecipe.Movie) {
        const [enriched] = enrichMoviesWithImagePaths([topRecipe.Movie]);
        duoFilm = { ...enriched, recipeCount: duoRecipeCount };
      }

      const heroStats = {};
      heroStatsList.forEach((h) => {
        heroStats[h.slug] = { recipes: h.recipes, note: h.note, year: h.year };
      });

      // ── Vague 3 : compteur de recettes par film ──
      // Une seule requête sur TOUS les films avec recette approuvée (au lieu
      // de deux requêtes qui se recouvraient : une pour les 4 topMovies, une
      // pour tous les films) — le compteur des topMovies est ensuite dérivé
      // du même résultat, sans requête supplémentaire.
      const allMovieIds = allMoviesForGenre.map((m) => m.id);
      const allRecipeCounts = await Recipe.findAll({
        where: { status: "approved", id_movie: { [Op.in]: allMovieIds } },
        attributes: ["id_movie", [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]],
        group: ["id_movie"],
        raw: true,
      });
      const allCountMap = {};
      allRecipeCounts.forEach((r) => { allCountMap[r.id_movie] = parseInt(r.count, 10); });

      // Enrichir les topMovies avec les chemins d'images + le compteur de recettes
      const enrichedTopMovies = enrichMoviesWithImagePaths(topMovies).map((m) => ({
        ...m,
        recipeCount: allCountMap[m.id] || 0,
      }));

      // Top 3 films par genre pour les tooltips du carrousel
      const sortedMoviesForGenre = allMoviesForGenre.sort((a, b) => (allCountMap[b.id] || 0) - (allCountMap[a.id] || 0));
      const genreFilmsMap = {};
      for (const m of sortedMoviesForGenre) {
        if (!genreFilmsMap[m.genre]) genreFilmsMap[m.genre] = [];
        if (genreFilmsMap[m.genre].length < 3) {
          genreFilmsMap[m.genre].push({ t: m.title, n: String(allCountMap[m.id] || 0) });
        }
      }

      // Rendre la vue avec les recettes
      res.render("home", {
        recipes,
        topRecipe,
        duoFilm,
        topMovies: enrichedTopMovies,
        genreStats,
        genreFilmsMap,
        totalUsers,
        totalRecipes,
        totalMovies,
        topContributors: topContributors.map((u) => u.toJSON()),
        heroStats,
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

      const [movies, recipes] = await Promise.all([
        Movie.findAll({
          where: { status: "approved" },
          attributes: ["id", "slug", "updatedAt"],
        }),
        Recipe.findAll({
          where: { status: "approved" },
          attributes: ["id", "slug", "updatedAt"],
        }),
      ]);

      // Auteurs distincts ayant au moins une recette approuvée
      const recipeAuthors = await Recipe.findAll({
        where: { status: "approved" },
        attributes: ["id_user"],
      });
      const authorIds = [...new Set(recipeAuthors.map(r => r.id_user).filter(Boolean))];
      const authors = authorIds.length > 0
        ? await User.findAll({ where: { id: authorIds }, attributes: ["id"] })
        : [];

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
      console.error("[sitemap] Erreur :", error);
      res.status(500).send("Erreur génération sitemap");
    }
  },
};

export default homeController;
