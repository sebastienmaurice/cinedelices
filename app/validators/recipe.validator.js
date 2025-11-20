import Joi from "joi";

/**
 * description : Middleware de validation avec joi pour la création d'une recette.
 * dossier validators : recipe.validator.js
 */

function validateRecipeCreate(req, res, next) {
  const recipeSchema = Joi.object({
    name: Joi.string()
    .trim()
    .replace(/\s+/g, "_") // Remplace tous les espaces restants par des underscores
    .required()
    .messages({
      "string.empty": "Le nom de la recette est obligatoire.",
    }),

    description: Joi.string()
    .required()
    .messages({
      "string.empty": "La description est obligatoire.",
    }),

    picture: Joi.string()
    .max(255)
    .allow(null, "")
    .optional(),

    category: Joi.string()
      .valid("entrée", "plat", "dessert")
      .required()
      .messages({
        "string.empty": "La catégorie est obligatoire.",
        "any.only": 'La catégorie doit être "entrée", "plat" ou "dessert".',
      }),

    quote: Joi.number()
    .integer()
    .min(0)
    .max(5)
    .default(0)
    .optional()
    .messages({
      "number.min": "La note doit être entre 0 et 5.",
      "number.max": "La note doit être entre 0 et 5.",
    }),

    ingredients: Joi.string()
    .required()
    .messages({
      "string.empty": "Les ingrédients sont obligatoires.",
    }),

    preparation: Joi.string()
    .required()
    .messages({
      "string.empty": "La préparation est obligatoire.",
    }),

    time: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "Le temps doit être un nombre.",
      "number.min": "Le temps doit être au moins 1 minute.",
      "any.required": "Le temps de préparation est obligatoire.",
    }),

    difficulty: Joi.string()
      .valid("Facile", "Moyenne", "Difficile")
      .required()
      .messages({
        "string.empty": "La difficulté est obligatoire.",
        "any.only":'La difficulté doit être "Facile", "Moyenne" ou "Difficile".',
      }),

    status: Joi.boolean()
    .default(false)
    .optional(),

    id_movie: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .optional()
      .messages({
        "number.base": "L'ID du film doit être un nombre.",
        "number.positive": "L'ID du film doit être positif.",
      }),
  });

  const { error } = recipeSchema.validate(req.body);
  if (error) {
    return res.status(400).render("error", {
      error: "400",
      message: `${error.details[0].message}`,
      role: req.userRole,
    });
  }
  next();
}

/**
 * description : Middleware de validation avec joi pour la mise à jour d'une recette.
 * dossier validators : recipe.validator.js
 */

function validateRecipeUpdate(req, res, next) {
  const recipeSchema = Joi.object({
    name: Joi.string().optional(),

    description: Joi.string().max(2000).optional(),

    picture: Joi.string().max(255).allow(null, "").optional(),

    category: Joi.string().valid("entrée", "plat", "dessert").optional(),

    quote: Joi.number().integer().min(0).max(5).optional(),

    ingredients: Joi.string().max(1000).optional(),

    preparation: Joi.string().max(2000).optional(),

    time: Joi.number().integer().min(1).optional(),

    difficulty: Joi.string().valid("Facile", "Moyenne", "Difficile").optional(),

    status: Joi.boolean().optional(),

    id_movie: Joi.number().integer().positive().allow(null).optional(),
  }).min(1);

  const { error } = recipeSchema.validate(req.body);
  if (error) {
    return res.status(400).render("error", {
      error: "400",
      message: `${error.details[0].message}`,
      role: req.userRole,
    });
  }
  next();
}

export { validateRecipeCreate, validateRecipeUpdate };
