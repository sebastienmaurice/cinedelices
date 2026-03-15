import Joi from "joi";

// Validation pour l'inscription d'un utilisateur

/**
 * description : Middleware de validation avec joi pour l'inscription d'un utilisateur.
 * dossier validators : user.validator.js
 */

function validateUserRegister(req, res, next) {
  const registerSchema = Joi.object({
    first_name: Joi.string().max(100).trim().required().messages({
      "string.empty": "Le prénom est obligatoire.",
      "string.max": "Le prénom ne peut pas dépasser 100 caractères.",
    }),

    last_name: Joi.string().max(100).trim().required().messages({
      "string.empty": "Le nom est obligatoire.",
      "string.max": "Le nom ne peut pas dépasser 100 caractères.",
    }),

    pseudo: Joi.string()
      .trim()
      .replace(/\s+/g, "_") // Remplace tous les espaces restants par des underscores
      .pattern(/^[a-zA-Z0-9_]+$/) // Autorise uniquement lettres, chiffres et underscores
      .lowercase()
      .optional()
      .messages({
        "string.pattern.base":
          "Le pseudo ne peut contenir que des lettres, des chiffres et des underscores.",
      }),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(255)
      .optional()
      .messages({
        "string.email": "L'email doit être valide.",
        "string.max": "L'email ne peut pas dépasser 255 caractères.",
      }),

    password: Joi.string()
      .allow("")
      .min(8)
      .max(255)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/
      )
      .optional()
      .messages({
        "string.min": "Le mot de passe doit contenir au moins 8 caractères.",
        "string.max": "Le mot de passe ne peut pas dépasser 255 caractères.",
        "string.pattern.base":
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.",
      }),

    notify_recipes: Joi.boolean().optional(),
    notify_cinema: Joi.boolean().optional(),

    picture: Joi.string().max(255).allow(null, "").optional(),

    role: Joi.string().valid("user", "admin").default("user").optional(),
  }).unknown(true); // autorise les autres champs sans validation;

  const { error } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res.status(400).render("error", {
      error: "400",
      message: `${errorMessages.join("<br>")}`,
    });
  }
  next();
}

// Validation pour la mise à jour d'un utilisateur
/**
 * description : Middleware de validation avec joi pour la mise à jour d'un utilisateur.
 * dossier validators : user.validator.js
 */

function validateUserUpdate(req, res, next) {
  const updateSchema = Joi.object({
    first_name: Joi.string().max(100).trim().optional(),

    last_name: Joi.string().max(100).trim().optional(),

    pseudo: Joi.string()
      .trim()
      .replace(/\s+/g, "_") // Remplace tous les espaces restants par des underscores
      .pattern(/^[a-zA-Z0-9_]+$/) // Autorise uniquement lettres, chiffres et underscores
      .lowercase()
      .optional()
      .messages({
        "string.pattern.base":
          "Le pseudo ne peut contenir que des lettres, des chiffres et des underscores.",
      }),

    email: Joi.string()
      .trim()
      .lowercase()
      .email()
      .max(255)
      .optional()
      .messages({
        "string.email": "L'email doit être valide.",
        "string.max": "L'email ne peut pas dépasser 255 caractères.",
      }),

    password: Joi.string()
      .allow("")
      .min(8)
      .max(255)
      .pattern(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/
      ) // (ex: exigence de majuscules, chiffres, caractères spéciaux)
      .optional()
      .messages({
        "string.min": "Le mot de passe doit contenir au moins 8 caractères.",
        "string.max": "Le mot de passe ne peut pas dépasser 255 caractères.",
        "string.pattern.base":
          "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.",
      }),

    picture: Joi.string().max(255).allow(null, "").optional(),

    notify_recipes: Joi.boolean().truthy("true").falsy("false").optional(),
    notify_cinema: Joi.boolean().truthy("true").falsy("false").optional(),
    remove_avatar: Joi.string().valid("true").optional(),

    role: Joi.string().valid("user", "admin").optional(),
  })
    .unknown(true)
    .min(1); // Au moins un champ doit être fourni

  const { error } = updateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message,
    });
  }
  next();
}

// Validation pour la connexion d'un utilisateur

/**
 * description : Middleware de validation avec joi pour la connexion d'un utilisateur.
 * dossier validators : user.validator.js
 */

function validateUserLogin(req, res, next) {
  // Le champ "pseudo" accepte un pseudo OU un email
  // La validation stricte du format se fait dans le contrôleur
  const loginSchema = Joi.object({
    pseudo: Joi.string()
      .trim()
      .max(255)
      .required()
      .messages({
        "string.empty": "L'identifiant est obligatoire.",
        "string.max": "L'identifiant ne peut pas dépasser 255 caractères.",
      }),

    password: Joi.string()
      .min(8)
      .max(255)
      .required()
      .messages({
        "string.empty": "Le mot de passe est obligatoire.",
        "string.min": "Le mot de passe doit contenir au moins 8 caractères.",
        "string.max": "Le mot de passe ne peut pas dépasser 255 caractères.",
      }),
  });

  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).render("error", {
      error: "400",
      message: `${error.details[0].message}`,
    });
  }
  next();
}

export { validateUserRegister, validateUserUpdate, validateUserLogin };
