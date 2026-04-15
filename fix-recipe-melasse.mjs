/**
 * fix-recipe-melasse.mjs
 * Corrige les ingrédients et la préparation de la recette "La tarte à la mélasse"
 * en les remettant avec mise en forme HTML (titres h3, gras, listes).
 *
 * Usage : node fix-recipe-melasse.mjs
 */

import sequelize from './app/database/sequelize-client.js';
import { QueryTypes } from 'sequelize';

const SLUG = 'la-tarte-a-la-melasse';

/* ── INGRÉDIENTS (avec titres de section) ────────────────────── */
const ingredients = JSON.stringify([
  '<h3 class="rd-ing-group-title">Pour la pâte sablée</h3>',
  '250 g de farine',
  '125 g de beurre froid',
  '80 g de sucre glace',
  '1 œuf',
  '1 pincée de sel',
  '<h3 class="rd-ing-group-title">Pour la garniture</h3>',
  '300 g de golden syrup ou sirop de sucre épais',
  '150 g de mie de pain ou chapelure fine',
  '1 citron (zeste et jus)',
  '1 œuf',
  '30 g de beurre fondu',
]);

/* ── PRÉPARATION (5 étapes avec mise en forme) ───────────────── */
const preparation = JSON.stringify([
  'Préparer la pâte sablée en mélangeant la farine, le sucre glace et le sel. Ajouter le beurre froid coupé en petits morceaux puis sabler la pâte du bout des doigts jusqu\'à obtenir une texture sableuse. Incorporer l\'œuf et former une boule homogène. Filmer la pâte et la placer au réfrigérateur pendant environ 30 minutes.',
  '<strong>Préchauffer le four à 180 degrés.</strong> Étaler la pâte et la déposer dans un moule à tarte d\'environ 24 centimètres de diamètre. Piquer le fond avec une fourchette puis cuire à blanc pendant environ 10 minutes.',
  '<strong>Préparer la garniture</strong> en mélangeant le golden syrup, la mie de pain, le zeste et le jus de citron. Ajouter l\'œuf et le beurre fondu puis mélanger jusqu\'à obtenir une texture épaisse et légèrement granuleuse.',
  '<strong>Verser la garniture</strong> sur le fond de tarte précuit puis enfourner pendant 20 à 25 minutes jusqu\'à ce que la surface soit dorée. Laisser tiédir avant de servir pour obtenir une texture fondante et caramélisée.',
  'Ambiance et goût attendu :<br><ul><li>Texture fondante et légèrement croustillante</li><li>Goût très sucré, citronné et caramélisé</li><li>Dessert réconfortant typique des repas festifs de Poudlard 🍮</li></ul>',
]);

try {
  const [recipe] = await sequelize.query(
    'SELECT id, name FROM recipes WHERE slug = :slug LIMIT 1',
    { replacements: { slug: SLUG }, type: QueryTypes.SELECT }
  );

  if (!recipe) {
    console.error(`❌ Recette "${SLUG}" introuvable en base.`);
    process.exit(1);
  }

  console.log(`✅ Recette trouvée : #${recipe.id} — ${recipe.name}`);

  await sequelize.query(
    'UPDATE recipes SET ingredients = :ingredients, preparation = :preparation WHERE id = :id',
    {
      replacements: { ingredients, preparation, id: recipe.id },
      type: QueryTypes.UPDATE,
    }
  );

  console.log('✅ Ingrédients et préparation mis à jour avec mise en forme HTML.');
  console.log('   → Vérifier sur /recipes-movie/details/' + SLUG);
} catch (err) {
  console.error('❌ Erreur :', err.message);
} finally {
  await sequelize.close();
}
