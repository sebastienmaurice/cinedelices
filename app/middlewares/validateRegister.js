import Joi from 'joi';
import { StatusCodes } from 'http-status-codes';

/**
 * Middleware de validation des données d'inscription
 * Nettoyage XSS déjà effectué automatiquement par express-xss-sanitizer
 */

export function validateRegister(req, res, next) {
  // Schéma Joi pour validation
  const registerSchema = Joi.object({
  
    pseudo: Joi.string()
      .min(3)
      .max(30)
      .trim()
      .required()
      .messages({
        'string.empty': 'Le pseudo est obligatoire.',
        'string.min': 'Le pseudo doit contenir au moins 3 caractères.',
        'string.max': 'Le pseudo ne peut pas dépasser 30 caractères.'
      }),

    email: Joi.string()
      .email({ tlds: { allow: false } })
      .lowercase()
      .trim()
      .required()
      .messages({
        'string.email': 'Adresse email invalide.',
        'string.empty': 'L’email est obligatoire.'
      }),

    password: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.empty': 'Le mot de passe est obligatoire.',
        'string.min': 'Le mot de passe doit contenir au moins 8 caractères.'
      })
  });

  // Validation
  const { error, value } = registerSchema.validate(req.body, {
    abortEarly: false, // affiche toutes les erreurs
    stripUnknown: true // supprime les champs non attendus
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      errors: error.details.map((err) => err.message)
    });
  }

  req.body = value;
  next();
}