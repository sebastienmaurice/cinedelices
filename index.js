import "dotenv/config";
import express from "express";
import router from "./app/routes/index.route.js";
import userProfileRouter from "./app/routes/user-profile.route.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./app/views");

const PORT = process.env.PORT || 3000;

// Servir CSS, JS, images...
app.use(express.static("./app/public"));

// Routes
app.use(router);
app.use(userProfileRouter); // <-- Ajout de ta route user-profile

app.listen(PORT, () => {
  console.log(`Le serveur est démarré sur http://localhost:${PORT}`);
});
