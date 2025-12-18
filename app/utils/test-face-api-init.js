/**
 * Script de test pour valider le chargement des modèles face-api.js
 *
 * Usage: node app/utils/test-face-api-init.js
 */

import {
  initializeFaceApiModels,
  ensureFaceApiModelsLoaded,
} from "./image-pipeline.js";

async function testFaceApiInitialization() {
  console.log("🧪 Test d'initialisation des modèles face-api.js\n");

  try {
    // Test 1: Initialisation directe
    console.log("📋 Test 1: Initialisation directe...");
    const result1 = await initializeFaceApiModels();

    if (result1) {
      console.log("✅ Test 1 réussi: Modèles chargés avec succès\n");
    } else {
      console.log("❌ Test 1 échoué: Échec du chargement des modèles\n");
      console.log("💡 Vérifiez que les modèles sont présents dans:");
      console.log("   node_modules/face-api.js/weights/\n");
      console.log("💡 Téléchargez-les depuis:");
      console.log(
        "   https://github.com/justadudewhohacks/face-api.js-models\n"
      );
      process.exit(1);
    }

    // Test 2: Vérification que les modèles sont accessibles
    console.log("📋 Test 2: Vérification de l'accessibilité des modèles...");
    const result2 = await ensureFaceApiModelsLoaded();

    if (result2) {
      console.log("✅ Test 2 réussi: Modèles accessibles\n");
    } else {
      console.log("❌ Test 2 échoué: Modèles non accessibles\n");
      process.exit(1);
    }

    // Test 3: Vérification que le chargement est idempotent (peut être appelé plusieurs fois)
    console.log(
      "📋 Test 3: Vérification de l'idempotence (appels multiples)..."
    );
    const results = await Promise.all([
      ensureFaceApiModelsLoaded(),
      ensureFaceApiModelsLoaded(),
      ensureFaceApiModelsLoaded(),
    ]);

    if (results.every((r) => r === true)) {
      console.log("✅ Test 3 réussi: Le chargement est idempotent\n");
    } else {
      console.log("❌ Test 3 échoué: Problème avec l'idempotence\n");
      process.exit(1);
    }

    console.log("🎉 Tous les tests sont passés avec succès!");
    console.log("✅ Les modèles face-api.js sont prêts à être utilisés\n");
  } catch (error) {
    console.error("❌ Erreur lors des tests:", error);
    process.exit(1);
  }
}

// Exécuter les tests
testFaceApiInitialization();
