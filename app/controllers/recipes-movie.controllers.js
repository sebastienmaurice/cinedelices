import { Op, fn, col } from "sequelize";
import { Recipe, Movie, Notice, User, Favorite, Rating } from "../models/index.model.js";
import { enrichMovieWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

/**
 * Récupère les IDs des recettes favorites de l'utilisateur
 * @param {number|undefined} userId - ID de l'utilisateur connecté
 * @returns {Promise<number[]>} - Liste des IDs de recettes favorites
 */
async function getUserFavoriteRecipeIds(userId) {
  if (!userId) return [];

  const favorites = await Favorite.findAll({
    where: { id_user: userId, entity_type: "recipe" },
    attributes: ["entity_id"],
  });

  return favorites.map((f) => f.entity_id);
}

/**
 * Récupère les notes de l'utilisateur pour les recettes
 * @param {number|undefined} userId - ID de l'utilisateur connecté
 * @returns {Promise<Object>} - Map entityId -> score
 */
async function getUserRecipeRatings(userId) {
  if (!userId) return {};

  const ratings = await Rating.findAll({
    where: { id_user: userId, entity_type: "recipe" },
    attributes: ["entity_id", "score"],
  });

  return ratings.reduce((acc, r) => {
    acc[r.entity_id] = r.score;
    return acc;
  }, {});
}

/**
 * Récupère les moyennes des notes pour les recettes
 * @param {number[]} recipeIds - IDs des recettes
 * @returns {Promise<Object>} - Map entityId -> { average, count }
 */
async function getRecipeAverageRatings(recipeIds) {
  if (!recipeIds || recipeIds.length === 0) return {};

  const avgRatings = await Rating.findAll({
    where: { entity_type: "recipe", entity_id: { [Op.in]: recipeIds } },
    attributes: [
      "entity_id",
      [fn("AVG", col("score")), "average"],
      [fn("COUNT", col("id")), "count"],
    ],
    group: ["entity_id"],
    raw: true,
  });

  return avgRatings.reduce((acc, r) => {
    acc[r.entity_id] = {
      average: parseFloat(r.average).toFixed(1),
      count: parseInt(r.count),
    };
    return acc;
  }, {});
}

/**
 * Enrichit les recettes avec favoris et notes
 * @param {Array} recipes - Liste des recettes
 * @param {number[]} favoriteIds - IDs des recettes favorites
 * @param {Object} userRatingsMap - Notes de l'utilisateur
 * @param {Object} avgRatingsMap - Moyennes des notes
 * @returns {Array} - Recettes enrichies
 */
// isNew = état dérivé, jamais stocké : status approved + validated_at (ou createdAt) < 3 jours
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

function enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap) {
  const threeDaysAgo = new Date(Date.now() - THREE_DAYS_MS);
  return recipes.map((recipe) => {
    const plain = recipe.toJSON ? recipe.toJSON() : recipe;
    const avgData = avgRatingsMap[plain.id];
    // validated_at en priorité (date réelle de validation admin), sinon createdAt en fallback
    const refDate = plain.validated_at
      ? new Date(plain.validated_at)
      : plain.createdAt
        ? new Date(plain.createdAt)
        : null;

    return {
      ...plain,
      // plain.contributor est déjà peuplé par Sequelize grâce à l'alias "contributor"
      isFavorite: favoriteIds.includes(plain.id),
      userRating: userRatingsMap[plain.id] || null,
      avgRating: avgData ? avgData.average : null,
      ratingCount: avgData ? avgData.count : 0,
      // isNew : calculé dynamiquement, non persisté en base
      isNew: plain.status === "approved" && refDate ? refDate >= threeDaysAgo : false,
    };
  });
}

const recipesController = {
  // Afficher toutes les recettes (filtre catégorie + recherche)
  async allRecipes(req, res) {
    try {
      const category = (req.query.category || "all").trim().toLowerCase();
      const q = (req.query.q || "").trim();
      const sort = req.query.sort || "recent";

      const whereClause = { status: "approved" };
      if (category !== "all") whereClause.category = category;
      if (q) whereClause.name = { [Op.iLike]: `%${q}%` };

      // Tri Sequelize (sauf "rating" calculé après enrichissement)
      let order;
      if (sort === "oldest") order = [["validated_at", "ASC"]];
      else if (sort === "duration") order = [["duration", "ASC"]];
      else order = [["validated_at", "DESC"]]; // "recent" par défaut

      const recipes = await Recipe.findAll({
        where: whereClause,
        include: [
          { model: User, as: "contributor", attributes: ["id", "pseudo", "picture"] },
          { model: Movie, attributes: ["id", "title", "slug"], required: false },
        ],
        order,
      });

      const recipeIds = recipes.map((r) => r.id);
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings(recipeIds);
      let enrichedRecipes = enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap);

      // Tri par note (en mémoire, avgRating calculé après enrichissement)
      if (sort === "rating") {
        enrichedRecipes = enrichedRecipes.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
      }

      const distinctMovies = new Set(recipes.filter((r) => r.Movie).map((r) => r.Movie.id));

      res.render("all-recipes", {
        recipes: enrichedRecipes,
        totalCount: enrichedRecipes.length,
        movieCount: distinctMovies.size,
        categoryFilter: category,
        searchQuery: q,
        sortBy: sort,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
  // Afficher le film et ses recettes
  async movieRecipes(req, res) {
    try {
      const param = req.params.id;
      let movie;

      if (/^\d+$/.test(param)) {
        // Ancienne URL numérique → redirect 301 vers slug
        movie = await Movie.findOne({ where: { id: param, status: "approved" } });
        if (movie?.slug) return res.redirect(301, `/recipes-movie/${movie.slug}`);
        if (movie) return res.redirect(301, `/recipes-movie/${movie.id}`);
      } else {
        movie = await Movie.findOne({ where: { slug: param, status: "approved" } });
      }

      // Utilisation du helper centralisé pour les erreurs 404
      if (!movie) {
        return renderNotFound(res, "Film");
      }

      // Toutes les recettes du film — jointure User via alias "contributor"
      const recipes = await Recipe.findAll({
        where: { id_movie: movie.id, status: "approved" },
        include: [
          {
            model: User,
            as: "contributor",
            attributes: ["id", "pseudo", "picture"],
          },
        ],
      });

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      // Récupérer les favoris et notes de l'utilisateur connecté
      const recipeIds = recipes.map((r) => r.id);
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings(recipeIds);
      const enrichedRecipes = enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap);
      res.render("recipes-movie", {
        movie: enrichedMovie,
        recipes: enrichedRecipes,
        authorDisplayName: "",
        isAuthorFiltered: false,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
  /*
    movieRecipes :
    - Récupère un film par son id avec Movie.findByPk
    - Si aucun film trouvé => 404
    - Charge toutes les recettes associées (Recipe.findAll avec id_movie)
    - Rend la vue "recipes-movie" avec le film, les recettes et le rôle utilisateur
  */

  // Filtrage des recettes du film par catégorie
  async filtredRecipes(req, res) {
    try {
      const { id: param, category } = req.params;
      let movie;

      if (/^\d+$/.test(param)) {
        // Ancienne URL numérique → redirect 301 vers slug
        movie = await Movie.findOne({ where: { id: param, status: "approved" } });
        if (movie?.slug) return res.redirect(301, `/recipes-movie/category/${movie.slug}/${category}`);
        if (movie) return res.redirect(301, `/recipes-movie/category/${movie.id}/${category}`);
      } else {
        movie = await Movie.findOne({ where: { slug: param, status: "approved" } });
      }

      if (!movie) {
        return renderNotFound(res, "Film");
      }

      // Jointure User via alias "contributor" — même include dans les 2 cas
      const userInclude = [{ model: User, as: "contributor", attributes: ["id", "pseudo", "picture"] }];

      let recipes;
      if (!category || category === "all") {
        recipes = await Recipe.findAll({
          where: { id_movie: movie.id, status: "approved" },
          include: userInclude,
        });
      } else {
        recipes = await Recipe.findAll({
          where: {
            id_movie: movie.id,
            category: category,
            status: "approved",
          },
          include: userInclude,
        });
      }

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      // Récupérer les favoris et notes de l'utilisateur connecté
      const recipeIds = recipes.map((r) => r.id);
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings(recipeIds);
      const enrichedRecipes = enrichRecipesWithData(recipes, favoriteIds, userRatingsMap, avgRatingsMap);

      res.render("recipes-movie", {
        movie: enrichedMovie,
        recipes: enrichedRecipes,
        authorDisplayName: "",
        isAuthorFiltered: false,
      });
    } catch (error) {
      return renderServerError(res, error);
    }
  },
  /*
    filtredRecipes :
    - Récupère les paramètres id du film et la catégorie
    - Vérifie que le film existe sinon 404
    - Charge les recettes du film :
        * toutes si category absent ou "all"
        * sinon filtre sur la colonne category
    - Rend la vue "recipes-movie" avec la liste filtrée
  */

  // Afficher le détail d'une recette spécifique
  async detailRecipes(req, res) {
    try {
      const param = req.params.id;
      let recipe;

      if (/^\d+$/.test(param)) {
        // Ancienne URL numérique → redirect 301 vers slug
        recipe = await Recipe.findOne({ where: { id: param, status: "approved" } });
        if (recipe?.slug) return res.redirect(301, `/recipes-movie/details/${recipe.slug}`);
        if (recipe) return res.redirect(301, `/recipes-movie/details/${recipe.id}`);
      } else {
        recipe = await Recipe.findOne({ where: { slug: param, status: "approved" } });
      }

      // Refactoring : utilisation du helper centralisé renderNotFound()
      if (!recipe) {
        return renderNotFound(res, "Recette");
      }

      const plainRecipe = recipe.get({ plain: true });

      const movie = await Movie.findOne({
        where: { id: plainRecipe.id_movie, status: "approved" },
      });
      const enrichedMovie = movie ? enrichMovieWithImagePaths(movie) : null;

      // Auteur obligatoire (id_user NOT NULL) — récupération directe sans fallback
      const contributor = await User.findByPk(plainRecipe.id_user, {
        attributes: ["id", "pseudo", "picture", "first_name", "last_name", "role"],
      });

      // Formatage du texte pour l'affichage
      // Ces fonctions extraient les blocs de texte pour faciliter l'affichage dans la vue
      const descriptionBlocks = formatDescriptionBlocks(
        plainRecipe.description
      );
      const ingredientsBlocks = formatIngredientsBlocks(
        plainRecipe.ingredients
      );
      const preparationBlocks = formatPreparationBlocks(
        plainRecipe.preparation
      );

      // Récupérer les avis associés à la recette avec les infos utilisateur SEB le 21 Nov à 14h07
      const notices = await Notice.findAll({
        where: { id_recipe: plainRecipe.id, status: "approved" },
        include: [
          {
            model: User,
            attributes: ["id", "pseudo", "first_name", "last_name", "picture", "role"],
          },
        ],
        order: [["id", "DESC"]], // Plus récents en premier
      });

      const plainNotices = notices.map((notice) => notice.get({ plain: true }));

      //! Calcul de la moyenne des notes

      let averageQuote = 0; // Valeur par défaut si pas d'avis
      if (plainNotices.length > 0) {
        const sum = plainNotices.reduce((acc, n) => acc + (n.quote || 0), 0); // Somme des notes
        averageQuote = Math.round(sum / plainNotices.length); // Moyenne arrondie a l'entier le plus proche
      }
      // Refactoring : suppression du console.log de debug

      // Vérifier si cette recette est en favori et récupérer les notes
      const favoriteIds = await getUserFavoriteRecipeIds(req.userId);
      const isFavorite = favoriteIds.includes(plainRecipe.id);
      const userRatingsMap = await getUserRecipeRatings(req.userId);
      const avgRatingsMap = await getRecipeAverageRatings([plainRecipe.id]);
      const userRating = userRatingsMap[plainRecipe.id] || null;
      const avgData = avgRatingsMap[plainRecipe.id];

      res.render("recipe-detail", {
        recipe: {
          ...plainRecipe,
          isFavorite,
          userRating,
          avgRating: avgData ? avgData.average : null,
          ratingCount: avgData ? avgData.count : 0,
        },
        movie: enrichedMovie,
        descriptionBlocks,
        ingredientsBlocks,
        preparationBlocks,
        averageQuote,
        notices: plainNotices,
        // Auteur toujours présent (id_user NOT NULL)
        contributor: {
          ...(contributor.get ? contributor.get({ plain: true }) : contributor),
          pseudo:
            contributor.pseudo ||
            [contributor.first_name, contributor.last_name].filter(Boolean).join(" "),
        },
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error);
    }
  },
  /*
    detailRecipes :
    - Trouve une recette par son id
    - Si introuvable => 404
    - Convertit la recette en objet simple (plain)
    - Formate description, ingrédients, préparation en tableaux prêts à afficher
    - Rend la vue "recipe-detail" avec la recette et les blocs formatés
  */
};

/**
 * Fonctions utilitaires internes pour le formatage du texte
 * Simplification Étape 3.2 : Extraction des fonctions de formatage pour améliorer la lisibilité
 */

/**
 * Formate la description en paragraphes (séparés par des retours à la ligne doubles)
 * @param {string} description - Texte de description
 * @returns {Array<string>} - Tableau de paragraphes formatés
 */
function formatDescriptionBlocks(description) {
  return (description || "")
    .replace(/\r\n/g, "\n") // Normaliser les retours à la ligne
    .split(/\n{2,}/) // Séparer par retours à la ligne doubles (paragraphes)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean); // Retirer les chaînes vides
}

/**
 * Formate les ingrédients en liste (un ingrédient par ligne)
 * @param {string} ingredients - Texte des ingrédients
 * @returns {Array<string>} - Tableau d'ingrédients formatés
 */
function formatIngredientsBlocks(ingredients) {
  return (ingredients || "")
    .replace(/\r\n/g, "\n") // Normaliser les retours à la ligne
    .split(/\n+/) // Séparer par retours à la ligne (un ingrédient par ligne)
    .map((item) => item.trim())
    .filter(Boolean); // Retirer les chaînes vides
}

/**
 * Formate la préparation en étapes (paragraphes puis lignes)
 * @param {string} preparation - Texte de préparation
 * @returns {Array<string>} - Tableau d'étapes formatées
 */
function formatPreparationBlocks(preparation) {
  return (preparation || "")
    .replace(/\r\n/g, "\n") // Normaliser les retours à la ligne
    .split(/\n{2,}/) // Séparer par retours à la ligne doubles (paragraphes)
    .flatMap((chunk) => chunk.split(/\n/)) // Diviser chaque paragraphe en lignes
    .map((step) => step.trim())
    .filter(Boolean); // Retirer les chaînes vides
}

// Ajouter submitNotice dans l'objet recipesController
recipesController.submitNotice = async function submitNotice(req, res) {
  try {
    const param = req.params.id;
    const { comment, quote } = req.body;
    const parsedQuote = parseInt(quote, 10);

    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: "Le contenu de l'avis est obligatoire." });
    }
    if (!parsedQuote || parsedQuote < 1 || parsedQuote > 5) {
      return res.status(400).json({ success: false, message: "La note doit être comprise entre 1 et 5." });
    }

    let recipe;
    if (/^\d+$/.test(param)) {
      recipe = await Recipe.findOne({ where: { id: param, status: "approved" } });
    } else {
      recipe = await Recipe.findOne({ where: { slug: param, status: "approved" } });
    }
    if (!recipe) return res.status(404).json({ success: false, message: "Recette introuvable." });

    await Notice.create({
      content: comment.trim(),
      quote: parsedQuote,
      id_user: req.userId,
      id_recipe: recipe.id,
      status: "pending",
    });

    return res.json({ success: true, message: "Votre avis a été envoyé et sera publié après modération." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Erreur serveur." });
  }
};

export default recipesController;
