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

 // test de la connexion entre sequelize et la bdd
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {console.log("Unable to connect to the database:", error);
  }

export default sequelize;