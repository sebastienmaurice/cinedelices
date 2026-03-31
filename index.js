import "dotenv/config";
import express from "express";
import { xss } from "express-xss-sanitizer";
import cookieParser from "cookie-parser";
import router from "./app/routes/index.route.js";
import { verifyToken } from "./app/middlewares/is-authed.middleware.js";
import { injectLocals } from "./app/middlewares/inject-locals.middleware.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./app/views");

const PORT = process.env.PORT || 3000;

// Configuration de cookie-parser AVANT les middlewares/routes
app.use(cookieParser());
// Servir CSS, JS, images...
app.use(express.static("./app/public"));

app.use(express.urlencoded({ extended: true })); // pour parser les données des formulaires
app.use(express.json()); // permet de parser le JSON
app.use(verifyToken); // Middleware global pour vérifier le token et définir req.user si connecté
app.use(injectLocals); // Middleware global pour injecter les variables locales dans les vues
app.use(xss()); // Middleware global : nettoie automatiquement req.body, req.query, req.params

// Routes
app.use(router);

// middleware (404)
app.use((req, res) => {
  res
    .status(404)
    .render("error", { error: "404", message: "Page introuvable." });
});

// Global error handler pour attraper les erreurs non gérées et éviter un 500 générique
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  const acceptsJson =
    req.xhr || req.headers.accept?.includes("application/json");
  if (acceptsJson) {
    return res.status(500).json({ status: "fail", message: "Erreur serveur." });
  }
  return res
    .status(500)
    .render("error", { error: "500", message: "Erreur serveur." });
});

app.listen(PORT, () => {
  console.log(`Le serveur est démarré sur http://localhost:${PORT}`);
});
