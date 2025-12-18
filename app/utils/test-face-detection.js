/**
 * Script de test pour valider la détection de visages avec face-api.js
 *
 * Usage: node app/utils/test-face-detection.js [chemin_image1] [chemin_image2]
 * Exemple: node app/utils/test-face-detection.js app/public/images/movies/movie-harry_potter-1763858232674-340071843.png app/public/images/movies/cards/movie-affiche-indiana-jones-cinema-v1-17646705242365952.jpg
 */

import path from "path";
import { fileURLToPath } from "url";
import { detectFace } from "./image-pipeline.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Images de test par défaut
const DEFAULT_TEST_IMAGES = [
  path.join(
    __dirname,
    "../public/images/movies/movie-harry_potter-1763858232674-340071843.png"
  ),
  path.join(
    __dirname,
    "../public/images/movies/cards/movie-affiche-indiana-jones-cinema-v1-17646705242365952.jpg"
  ),
];

async function testFaceDetection() {
  console.log("🧪 Test de détection de visages avec face-api.js\n");
  console.log("=".repeat(60));

  // Récupérer les images à tester depuis les arguments ou utiliser les images par défaut
  const testImages =
    process.argv.length > 2
      ? process.argv.slice(2).map((imgPath) => path.resolve(imgPath))
      : DEFAULT_TEST_IMAGES;

  const results = [];

  for (let i = 0; i < testImages.length; i++) {
    const imagePath = testImages[i];
    console.log(`\n📸 Test ${i + 1}/${testImages.length}: ${imagePath}`);
    console.log("-".repeat(60));

    try {
      // Vérifier que le fichier existe
      const fs = await import("fs/promises");
      try {
        await fs.access(imagePath);
      } catch (error) {
        console.log(`❌ Fichier introuvable: ${imagePath}`);
        results.push({
          image: imagePath,
          success: false,
          error: "Fichier introuvable",
        });
        continue;
      }

      // Détecter le visage
      const faceCoords = await detectFace(imagePath);

      if (faceCoords) {
        console.log(`\n✅ RÉSULTAT - Visage détecté:`);
        console.log(`   📍 Position: (${faceCoords.left}, ${faceCoords.top})`);
        console.log(
          `   📐 Dimensions: ${faceCoords.width}x${faceCoords.height}px`
        );
        console.log(
          `   📊 Surface: ${faceCoords.width * faceCoords.height}px²`
        );

        results.push({
          image: imagePath,
          success: true,
          coords: faceCoords,
        });
      } else {
        console.log(`\n⚠️ RÉSULTAT - Aucun visage détecté`);
        results.push({
          image: imagePath,
          success: false,
          coords: null,
          message: "Aucun visage détecté",
        });
      }
    } catch (error) {
      console.error(`\n❌ ERREUR lors du test:`, error);
      results.push({
        image: imagePath,
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
  const failCount = results.filter((r) => !r.success).length;

  console.log(`\n✅ Visages détectés: ${successCount}/${results.length}`);
  console.log(`❌ Échecs: ${failCount}/${results.length}\n`);

  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${path.basename(result.image)}`);
    if (result.success) {
      console.log(
        `   ✅ Visage détecté: ${result.coords.width}x${result.coords.height}px à (${result.coords.left}, ${result.coords.top})`
      );
    } else {
      console.log(
        `   ❌ ${result.message || result.error || "Aucun visage détecté"}`
      );
    }
  });

  console.log("\n" + "=".repeat(60));

  if (successCount === results.length) {
    console.log("🎉 Tous les tests sont passés avec succès!");
    process.exit(0);
  } else if (successCount > 0) {
    console.log(
      "⚠️ Certains tests ont échoué, mais au moins un visage a été détecté."
    );
    process.exit(0);
  } else {
    console.log("❌ Aucun visage n'a été détecté dans les images testées.");
    console.log("💡 Vérifiez que:");
    console.log("   1. Les modèles face-api.js sont bien téléchargés");
    console.log("   2. Les images contiennent des visages");
    console.log("   3. Les images sont accessibles");
    process.exit(1);
  }
}

// Exécuter les tests
testFaceDetection().catch((error) => {
  console.error("❌ Erreur fatale lors des tests:", error);
  process.exit(1);
});
