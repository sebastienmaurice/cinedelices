/**
 * migrate-local-images-to-cloudinary.mjs
 *
 * Migre toutes les images locales (/images/...) vers Cloudinary
 * et met à jour les chemins en base de données.
 *
 * Usage : node scripts/migrate-local-images-to-cloudinary.mjs
 * À exécuter UNE SEULE FOIS depuis le PC local (les fichiers doivent exister).
 */

import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { createReadStream } from "fs";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, "../app/public");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { default: sequelize } = await import("../app/database/sequelize-client.js");
const { QueryTypes } = await import("sequelize");

let uploaded = 0;
let skipped  = 0;
let errors   = 0;

function isLocalPath(p) {
  return p && p.startsWith("/images/");
}

async function uploadToCloudinary(localPath, folder) {
  const absolutePath = path.join(PUBLIC_DIR, localPath);
  if (!existsSync(absolutePath)) {
    console.warn(`  ⚠️  Fichier introuvable : ${absolutePath}`);
    return null;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) reject(err);
        else resolve(result.secure_url);
      }
    );
    createReadStream(absolutePath).pipe(stream);
  });
}

async function migrate() {
  console.log("\n🚀 Démarrage de la migration images locales → Cloudinary\n");

  // ── 1. RECETTES (champ picture) ──────────────────────────────────────
  console.log("📸 Migration recettes (picture)...");
  const recipes = await sequelize.query(
    "SELECT id, name, picture FROM recipes WHERE picture LIKE '/images/%'",
    { type: QueryTypes.SELECT }
  );
  for (const r of recipes) {
    try {
      console.log(`  → Recette #${r.id} "${r.name}" : ${r.picture}`);
      const url = await uploadToCloudinary(r.picture, "cinedelices/recipes");
      if (!url) { skipped++; continue; }
      await sequelize.query(
        "UPDATE recipes SET picture = :url WHERE id = :id",
        { replacements: { url, id: r.id } }
      );
      console.log(`    ✅ ${url}`);
      uploaded++;
    } catch (e) {
      console.error(`    ❌ Erreur recette #${r.id}:`, e.message);
      errors++;
    }
  }

  // ── 2. RECIPE_PICTURES (photos secondaires) ───────────────────────────
  console.log("\n📸 Migration recipe_pictures (file_path)...");
  const recipePics = await sequelize.query(
    "SELECT id, recipe_id, file_path FROM recipe_pictures WHERE file_path LIKE '/images/%'",
    { type: QueryTypes.SELECT }
  );
  for (const p of recipePics) {
    try {
      console.log(`  → RecipePicture #${p.id} (recette ${p.recipe_id}) : ${p.file_path}`);
      const url = await uploadToCloudinary(p.file_path, "cinedelices/recipes");
      if (!url) { skipped++; continue; }
      await sequelize.query(
        "UPDATE recipe_pictures SET file_path = :url WHERE id = :id",
        { replacements: { url, id: p.id } }
      );
      console.log(`    ✅ ${url}`);
      uploaded++;
    } catch (e) {
      console.error(`    ❌ Erreur recipe_picture #${p.id}:`, e.message);
      errors++;
    }
  }

  // ── 3. FILMS (champ picture) ──────────────────────────────────────────
  console.log("\n🎬 Migration films (picture)...");
  const movies = await sequelize.query(
    "SELECT id, title, picture FROM movies WHERE picture LIKE '/images/%'",
    { type: QueryTypes.SELECT }
  );
  for (const m of movies) {
    try {
      console.log(`  → Film #${m.id} "${m.title}" : ${m.picture}`);
      const url = await uploadToCloudinary(m.picture, "cinedelices/movies");
      if (!url) { skipped++; continue; }
      await sequelize.query(
        "UPDATE movies SET picture = :url WHERE id = :id",
        { replacements: { url, id: m.id } }
      );
      console.log(`    ✅ ${url}`);
      uploaded++;
    } catch (e) {
      console.error(`    ❌ Erreur film #${m.id}:`, e.message);
      errors++;
    }
  }

  // ── 4. UTILISATEURS (picture + pending_picture + banner_image) ────────
  console.log("\n👤 Migration profils utilisateurs...");
  const users = await sequelize.query(
    `SELECT id, pseudo, picture, pending_picture, banner_image
     FROM users
     WHERE picture LIKE '/images/%'
        OR pending_picture LIKE '/images/%'
        OR banner_image LIKE '/images/%'`,
    { type: QueryTypes.SELECT }
  );
  for (const u of users) {
    const updates = {};
    for (const field of ["picture", "pending_picture", "banner_image"]) {
      if (!isLocalPath(u[field])) continue;
      try {
        console.log(`  → User #${u.id} "${u.pseudo}" [${field}] : ${u[field]}`);
        const url = await uploadToCloudinary(u[field], "cinedelices/profiles");
        if (!url) { skipped++; continue; }
        updates[field] = url;
        console.log(`    ✅ ${url}`);
        uploaded++;
      } catch (e) {
        console.error(`    ❌ Erreur user #${u.id} [${field}]:`, e.message);
        errors++;
      }
    }
    if (Object.keys(updates).length > 0) {
      const setClauses = Object.keys(updates).map(k => `${k} = :${k}`).join(", ");
      await sequelize.query(
        `UPDATE users SET ${setClauses} WHERE id = :id`,
        { replacements: { ...updates, id: u.id } }
      );
    }
  }

  // ── Résumé ────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────");
  console.log(`✅ Uploadées   : ${uploaded}`);
  console.log(`⚠️  Ignorées    : ${skipped} (fichier introuvable)`);
  console.log(`❌ Erreurs     : ${errors}`);
  console.log("─────────────────────────────────────");

  if (errors === 0 && skipped === 0) {
    console.log("\n🎉 Migration complète ! Tu peux maintenant retirer les dossiers d'images locales du git.");
  } else {
    console.log("\n⚠️  Migration partielle — corrige les erreurs avant de retirer les fichiers du git.");
  }

  await sequelize.close();
}

migrate().catch(async (e) => {
  console.error("Erreur fatale :", e);
  await sequelize.close();
  process.exit(1);
});
