import { Recipe, Movie, Notice, User } from "../models/index.model.js";
import { enrichMovieWithImagePaths } from "../utils/movie-image-helper.js";
import { renderNotFound, renderServerError } from "../utils/error-handler.js";

const recipesController = {
  // Afficher le film et ses recettes
  async movieRecipes(req, res) {
    try {
      const movie = await Movie.findByPk(req.params.id);

      // Utilisation du helper centralisé pour les erreurs 404
      // Refactoring : remplace le bloc dupliqué par un appel à renderNotFound()
      if (!movie) {
        return renderNotFound(res, "Film", req.userRole);
      }

      // Toutes les recettes du film
      const recipes = await Recipe.findAll({ where: { id_movie: movie.id } });

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      res.render("recipes-movie", {
        movie: enrichedMovie,
        recipes,
        role: req.userRole,
      });
    } catch (error) {
      // Utilisation du helper centralisé pour les erreurs 500
      // Refactoring : remplace le bloc dupliqué par un appel à renderServerError()
      return renderServerError(res, error, req.userRole);
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
      // Refactoring : suppression du console.log de debug
      const { id, category } = req.params;

      const movie = await Movie.findByPk(id);
      // Refactoring : utilisation du helper centralisé renderNotFound()
      if (!movie) {
        return renderNotFound(res, "Film", req.userRole);
      }

      let recipes;
      if (!category || category === "all") {
        recipes = await Recipe.findAll({ where: { id_movie: movie.id } });
      } else {
        recipes = await Recipe.findAll({
          where: {
            id_movie: movie.id,
            category: category,
          },
        });
      }

      // Enrichir le movie avec les chemins d'images
      const enrichedMovie = enrichMovieWithImagePaths(movie);

      // Rendu de la vue avec les recettes filtrées
      // Refactoring : suppression du console.log de debug
      res.render("recipes-movie", {
        movie: enrichedMovie,
        recipes,
        role: req.userRole,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
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

  // Afficher le détail d'une recette spécifique ajouté par SEB le 14 Nov à 18h30
  async detailRecipes(req, res) {
    try {
      const recipe = await Recipe.findByPk(req.params.id);

      // Refactoring : utilisation du helper centralisé renderNotFound()
      if (!recipe) {
        return renderNotFound(res, "Recette", req.userRole);
      }

      const plainRecipe = recipe.get({ plain: true });

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
        where: { id_recipe: req.params.id },
        include: [
          {
            model: User,
            attributes: ["id", "first_name", "last_name"],
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

      res.render("recipe-detail", {
        role: req.userRole,
        recipe: plainRecipe,
        descriptionBlocks,
        ingredientsBlocks,
        preparationBlocks,
        averageQuote, // Note moyenne à passer à la vue
        notices: plainNotices,
      });
    } catch (error) {
      // Refactoring : utilisation du helper centralisé renderServerError()
      return renderServerError(res, error, req.userRole);
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

export default recipesController;
