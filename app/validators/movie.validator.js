import Joi from "joi";

/**
 * description : Middleware de validation avec joi pour la création d'un film.
 * dossier validators : movie.validator.js
 */

function validateMovieCreate(req, res, next) {
  const movieSchema = Joi.object({
    title: Joi.string()
    .trim()
    .replace(/\s+/g, "_") // Remplace tous les espaces restants par des underscores
    .required()
    .messages({
      "string.empty": "Le titre est obligatoire.",
    }),

    year: Joi.number()
      .integer()
      .min(1888) // Première année du cinéma
      .max(new Date().getFullYear()) // Films à venir
      .required()
      .messages({
        "number.base": "L'année doit être un nombre.",
        "number.min": "L'année doit être supérieure ou égale à 1888.",
        "number.max": "L'année renseignée n'existe pas encore",
        "any.required": "L'année est obligatoire.",
      }),

    genre: Joi.string()
    .valid("action","animé", "aventure", "comédie", "drame", "fantastique", "horreur", "romantique", "science-fiction", "thriller")
    .required()
    .messages({
      "string.empty": "Le genre est obligatoire.",
      "string.max": "Le genre ne peut pas dépasser 100 caractères.",
      "any.only": "Le genre doit correspondre au sélecteur",
    }),

    picture: Joi.string()
    .max(255).allow(null, "")
    .optional(),

    status: Joi.boolean()
    .default(false)
    .optional(),
  });

  const { error } = movieSchema.validate(req.body);
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
 * description : Middleware de validation avec joi pour la mise à jour d'un film.
 * dossier validators : movie.validator.js
 */

function validateMovieUpdate(req, res, next) {
  const movieSchema = Joi.object({
    title: Joi.string().optional(),

    year: Joi.number()
      .integer()
      .min(1888)
      .max(new Date().getFullYear() + 5)
      .optional(),

    genre: Joi.string().max(100).optional(),

    picture: Joi.string().max(255).allow(null, "").optional(),

    status: Joi.boolean().optional(),
  }).min(1);

  const { error } = movieSchema.validate(req.body);
  if (error) {
    return res.status(400).render("error", {
      error: "400",
      message: `${error.details[0].message}`,
      role: req.userRole,
    });
  }
  next();
}

export { validateMovieCreate, validateMovieUpdate };
