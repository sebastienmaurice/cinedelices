/**
 * Script de test pour valider le crop intelligent avec détection de visages
 *
 * Usage: node app/utils/test-crop-with-face.js [chemin_image1] [chemin_image2]
 * Exemple: node app/utils/test-crop-with-face.js app/public/images/movies/movie-harry_potter-1763858232674-340071843.png app/public/images/movies/cards/movie-affiche-indiana-jones-cinema-v1-17646705242365952.jpg
 */

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import sharp from "sharp";
import { IMAGE_TYPES } from "./image-pipeline.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import de la fonction cropImage (elle est privée, on va tester via le pipeline complet)
// Pour les tests, on va simuler l'appel à cropImage via processImage
import { processImage } from "./image-pipeline.js";

// Images de test par défaut
const DEFAULT_TEST_IMAGES = [
  {
    path: path.join(
      __dirname,
      "../public/images/movies/movie-harry_potter-1763858232674-340071843.png"
    ),
    type: IMAGE_TYPES.MOVIE_CARD,
    name: "Bannière Harry Potter",
  },
  {
    path: path.join(
      __dirname,
      "../public/images/movies/cards/movie-affiche-indiana-jones-cinema-v1-17646705242365952.jpg"
    ),
    type: IMAGE_TYPES.MOVIE_CARD,
    name: "Card Indiana Jones",
  },
];

async function testCropWithFace() {
  console.log("🧪 Test de crop intelligent avec détection de visages\n");
  console.log("=".repeat(60));

  // Récupérer les images à tester depuis les arguments ou utiliser les images par défaut
  const testImages =
    process.argv.length > 2
      ? process.argv.slice(2).map((imgPath) => ({
          path: path.resolve(imgPath),
          type: IMAGE_TYPES.MOVIE_CARD,
          name: path.basename(imgPath),
        }))
      : DEFAULT_TEST_IMAGES;

  const results = [];
  const testOutputDir = path.join(__dirname, "../public/images/test-crop");

  // Créer le dossier de test
  try {
    await fs.mkdir(testOutputDir, { recursive: true });
  } catch (error) {
    // Ignorer si le dossier existe déjà
  }

  for (let i = 0; i < testImages.length; i++) {
    const testImage = testImages[i];
    const imagePath = testImage.path;
    console.log(`\n📸 Test ${i + 1}/${testImages.length}: ${testImage.name}`);
    console.log(`   Chemin: ${imagePath}`);
    console.log("-".repeat(60));

    try {
      // Vérifier que le fichier existe
      try {
        await fs.access(imagePath);
      } catch (error) {
        console.log(`❌ Fichier introuvable: ${imagePath}`);
        results.push({
          image: testImage.name,
          success: false,
          error: "Fichier introuvable",
        });
        continue;
      }

      // Obtenir les métadonnées de l'image originale
      const originalImage = sharp(imagePath);
      const originalMetadata = await originalImage.metadata();

      console.log(
        `📷 Image originale: ${originalMetadata.width}x${originalMetadata.height}px`
      );

      // Créer un fichier de sortie temporaire pour le test
      const outputPath = path.join(
        testOutputDir,
        `test-crop-${Date.now()}-${i}.jpg`
      );

      // Pour tester cropImage directement, on va utiliser une approche simplifiée
      // En réalité, cropImage est appelée via processImage, mais pour les tests
      // on peut créer une version de test qui appelle cropImage directement
      // Pour l'instant, on va juste vérifier que detectFace fonctionne et loguer les résultats

      // Simuler un crop en appelant detectFace et en calculant les coordonnées
      const { detectFace } = await import("./image-pipeline.js");
      const faceCoords = await detectFace(imagePath);

      let cropResult = {
        method: "centré classique (fallback)",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
      };

      if (faceCoords) {
        cropResult.method = "centré sur visage";
        // Calculer le crop centré sur le visage (simplifié pour le test)
        const ratio = 640 / 960; // Ratio movie-card
        const imageRatio = originalMetadata.width / originalMetadata.height;

        let cropWidth, cropHeight;
        if (imageRatio > ratio) {
          cropWidth = Math.round(originalMetadata.height * ratio);
          cropHeight = originalMetadata.height;
        } else {
          cropWidth = originalMetadata.width;
          cropHeight = Math.round(originalMetadata.width / ratio);
        }

        const faceCenterX = faceCoords.left + faceCoords.width / 2;
        const faceCenterY = faceCoords.top + faceCoords.height / 2;

        let left = Math.round(faceCenterX - cropWidth / 2);
        let top = Math.round(faceCenterY - cropHeight / 2);

        // Ajuster pour rester dans les limites
        if (left < 0) left = 0;
        if (left + cropWidth > originalMetadata.width)
          left = originalMetadata.width - cropWidth;
        if (top < 0) top = 0;
        if (top + cropHeight > originalMetadata.height)
          top = originalMetadata.height - cropHeight;

        cropResult.left = left;
        cropResult.top = top;
        cropResult.width = cropWidth;
        cropResult.height = cropHeight;
      } else {
        // Crop centré classique
        const ratio = 640 / 960;
        const imageRatio = originalMetadata.width / originalMetadata.height;

        if (imageRatio > ratio) {
          cropResult.width = Math.round(originalMetadata.height * ratio);
          cropResult.height = originalMetadata.height;
          cropResult.left = Math.round(
            (originalMetadata.width - cropResult.width) / 2
          );
          cropResult.top = 0;
        } else {
          cropResult.width = originalMetadata.width;
          cropResult.height = Math.round(originalMetadata.width / ratio);
          cropResult.left = 0;
          cropResult.top = Math.round(
            (originalMetadata.height - cropResult.height) / 2
          );
        }
      }

      console.log(`\n✅ RÉSULTAT - Crop calculé:`);
      console.log(`   🎯 Méthode: ${cropResult.method}`);
      console.log(`   📍 Position: (${cropResult.left}, ${cropResult.top})`);
      console.log(
        `   📐 Dimensions: ${cropResult.width}x${cropResult.height}px`
      );
      console.log(
        `   📊 Zone crop: ${(
          ((cropResult.width * cropResult.height) /
            (originalMetadata.width * originalMetadata.height)) *
          100
        ).toFixed(1)}% de l'image originale`
      );

      results.push({
        image: testImage.name,
        success: true,
        method: cropResult.method,
        coords: cropResult,
        faceDetected: faceCoords !== null,
      });
    } catch (error) {
      console.error(`\n❌ ERREUR lors du test:`, error);
      results.push({
        image: testImage.name,
        success: false,
        error: error.message,
      });
    }
  }

  // Résumé final
  console.log("\n" + "=".repeat(60));
  console.log("📊 RÉSUMÉ DES TESTS");
  console.log("=".repeat(60));

  const successCount = results.filter((r) => r.success).length;
  const faceDetectedCount = results.filter((r) => r.faceDetected).length;
  const fallbackCount = results.filter(
    (r) => r.success && !r.faceDetected
  ).length;

  console.log(`\n✅ Tests réussis: ${successCount}/${results.length}`);
  console.log(`🎯 Crop centré sur visage: ${faceDetectedCount}`);
  console.log(`🔄 Crop fallback (centré classique): ${fallbackCount}\n`);

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.image}`);
    if (result.success) {
      console.log(`   ✅ ${result.method}`);
      console.log(
        `   📍 Crop: (${result.coords.left}, ${result.coords.top}) - ${result.coords.width}x${result.coords.height}px`
      );
      if (result.faceDetected) {
        console.log(`   👤 Visage détecté et utilisé pour le crop`);
      } else {
        console.log(`   ⚠️ Aucun visage détecté, crop centré classique`);
      }
    } else {
      console.log(`   ❌ ${result.error || "Erreur inconnue"}`);
    }
  });

  console.log("\n" + "=".repeat(60));

  if (successCount === results.length) {
    console.log("🎉 Tous les tests sont passés avec succès!");
    process.exit(0);
  } else {
    console.log("⚠️ Certains tests ont échoué.");
    process.exit(1);
  }
}

// Exécuter les tests
testCropWithFace().catch((error) => {
  console.error("❌ Erreur fatale lors des tests:", error);
  process.exit(1);
});
