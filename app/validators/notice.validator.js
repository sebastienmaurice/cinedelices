import Joi from 'joi';

/**
 * description : Middleware de validation avec joi pour la création d'un avis.
 * dossier validators : notice.validator.js
 */

function validateNoticeCreate (req, res, next) {
    const noticeSchema = Joi.object({

      quote: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .required()
        .messages({
          'number.base': 'La note doit être un nombre.',
          'number.min': 'La note doit être entre 1 et 5.',
          'number.max': 'La note doit être entre 1 et 5.',
          'any.required': 'La note est obligatoire.'
        }),

      content: Joi.string()
        .required()
        .messages({
          'string.empty': 'Le contenu de l\'avis est obligatoire.'
        }),

      id_user: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.base': 'L\'ID utilisateur doit être un nombre.',
          'number.positive': 'L\'ID utilisateur doit être positif.',
          'any.required': 'L\'ID utilisateur est obligatoire.'
        }),

      id_recipe: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
          'number.base': 'L\'ID recette doit être un nombre.',
          'number.positive': 'L\'ID recette doit être positif.',
          'any.required': 'L\'ID recette est obligatoire.'
        })
    });
  
    const { error } = noticeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };

  /**
    * description : Middleware de validation avec joi pour la mise à jour d'un avis.
    * dossier validators : notice.validator.js
   */
  
  function validateNoticeUpdate (req, res, next) {
    const noticeSchema = Joi.object({

      quote: Joi.number()
        .integer()
        .min(1)
        .max(5)
        .optional(),
        
      content: Joi.string().optional()
    }).min(1);
  
    const { error } = noticeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
  
  export default { validateNoticeCreate, validateNoticeUpdate};