import "dotenv/config";
import { Sequelize } from "sequelize";

const sequelize = new Sequelize(process.env.PG_URL, {
  logging: false,
  define: {
    timestamps: false,
    underscored: true,
  },
  // Force le search_path sur public — nécessaire sur Render PostgreSQL
  dialectOptions: {
    options: "-c search_path=public",
  },
});

// Test de la connexion — process.exit(1) si la BDD est inaccessible
// Render détectera le crash et affichera les logs d'erreur
try {
  await sequelize.authenticate();
  console.log("✅ Connexion à la base de données établie avec succès.");
} catch (error) {
  console.error("❌ Impossible de se connecter à la base de données:", error);
  process.exit(1);
}

export default sequelize;
