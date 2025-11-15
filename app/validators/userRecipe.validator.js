import Joi from "joi";

/**
 * description: Valide les données pour la création d'une association entre un utilisateur et une recette.
 * dossier: validators : userRecipe.validator.js
 */

function validateUserRecipeCreate(req, res, next) {
  const userRecipeSchema = Joi.object({
    id_user: Joi.number().integer().positive().required().messages({
      "number.base": "L'ID utilisateur doit être un nombre.",
      "number.positive": "L'ID utilisateur doit être positif.",
      "any.required": "L'ID utilisateur est obligatoire.",
    }),

    id_recipe: Joi.number().integer().positive().required().messages({
      "number.base": "L'ID recette doit être un nombre.",
      "number.positive": "L'ID recette doit être positif.",
      "any.required": "L'ID recette est obligatoire.",
    }),
  });

  const { error } = userRecipeSchema.validate(req.body);
  if (error) {
    return res.status(400).render("error", {
      error: "400",
      message: `${error.details[0].message}`,
      role: req.userRole,
    }); //json({ message: error.details[0].message });
  }
  next();
}

export default { validateUserRecipeCreate };
