import "dotenv/config";
import express from "express";
import { xss } from 'express-xss-sanitizer';
import router from "./app/routes/index.route.js";

const app = express();

app.set("view engine", "ejs");
app.set("views", "./app/views");

const PORT = process.env.PORT || 3000;

// Servir CSS, JS, images...
app.use(express.static("./app/public"));

app.use(express.json()); // permet de parser le JSON
app.use(xss()); // Middleware global : nettoie automatiquement req.body, req.query, req.params

// Routes
app.use(router);

app.listen(PORT, () => {
  console.log(`Le serveur est démarré sur http://localhost:${PORT}`);
});
