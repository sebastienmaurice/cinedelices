import "dotenv/config";
import { Sequelize } from "sequelize";

 const sequelize = new Sequelize(
  process.env.PG_URL,
  {
    logging: false, // ne pas afficher les requete sql en console
    define: {
      timestamps: false, // ajouter les champs timestamps (par défaut à true)
      underscored: true, // les noms de champs seront en snake_case
    }
  });

// Test de la connexion entre Sequelize et la base de données
try {
  await sequelize.authenticate();
  console.log("✅ Connexion à la base de données établie avec succès.");
} catch (error) {
  console.error("❌ Impossible de se connecter à la base de données:", error);
}

export default sequelize;