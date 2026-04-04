import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const { sequelize } = await import('./models/index.model.js');

const [movies] = await sequelize.query("SELECT id, title, year, picture, tmdb_id, status FROM movies WHERE title ILIKE '%harry%' ORDER BY id");
console.log('=== FILMS HARRY POTTER ===');
console.log(JSON.stringify(movies, null, 2));

const [recipes] = await sequelize.query("SELECT r.id, r.name, r.slug, r.picture, r.id_movie, m.title as movie_title FROM recipes r LEFT JOIN movies m ON r.id_movie = m.id ORDER BY r.id");
console.log('\n=== TOUTES LES RECETTES ===');
console.log(JSON.stringify(recipes, null, 2));

const [pics] = await sequelize.query("SELECT rp.* FROM recipe_pictures rp ORDER BY rp.recipe_id, rp.position");
console.log('\n=== GALLERY PHOTOS ===');
console.log(JSON.stringify(pics, null, 2));

await sequelize.close();
