import "dotenv/config";

// Validation des variables d'environnement requises au démarrage
const REQUIRED_ENV = [
  "JWT_SECRET",
  "PG_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "RESEND_API_KEY",
];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`❌ Variables d'environnement manquantes : ${missingEnv.join(", ")}`);
  process.exit(1);
}

import { runStartupMigration } from "./app/database/migrate.js";
await runStartupMigration();

import express from "express";
import helmet from "helmet";
import { xss } from "express-xss-sanitizer";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import router from "./app/routes/index.route.js";
import { verifyToken } from "./app/middlewares/is-authed.middleware.js";
import { injectLocals } from "./app/middlewares/inject-locals.middleware.js";

const app = express();

// Render est derrière un reverse proxy — nécessaire pour express-rate-limit et IP réelle
app.set('trust proxy', 1);

// Sécurité HTTP — headers de protection (X-Frame-Options, CSP, HSTS, etc.)
app.use(helmet({
  // CSP souple pour autoriser les ressources Cloudinary, Google Fonts, TMDB
  contentSecurityPolicy: false,
}));

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

// Healthcheck — utilisé par Render pour vérifier que le service est opérationnel
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Page de maintenance — activer via MAINTENANCE=true dans les variables d'environnement Render
// Les admins/superadmins passent toujours. Les routes d'auth restent accessibles pour connexion.
if (process.env.MAINTENANCE === "true") {
  app.use((req, res, next) => {
    // Vérification directe du JWT — plus fiable que req.userRole
    try {
      const token = req.cookies?.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (["admin","superadmin","super_admin"].includes(decoded.role)) return next();
      }
    } catch {}
    // Routes toujours accessibles pendant la maintenance
    const allowed = ["/admin", "/auth", "/health"];
    if (allowed.some(r => req.path.startsWith(r))) return next();
    // Fichiers statiques (CSS, JS, images) — toujours servis
    if (req.path.match(/\.(css|js|png|jpg|jpeg|webp|svg|ico|woff|woff2|ttf)$/)) return next();
    res.status(503).render("maintenance");
  });
}

// Routes normales
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
