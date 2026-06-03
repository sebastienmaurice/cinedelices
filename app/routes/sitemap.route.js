import { Router } from "express";
import { Recipe } from "../models/index.model.js";
import { Movie } from "../models/index.model.js";
import { Op } from "sequelize";

const router = Router();

const BASE_URL = "https://cinedelices.com";

const STATIC_PAGES = [
  { url: "/",               priority: "1.0", changefreq: "weekly"  },
  { url: "/movies",         priority: "0.9", changefreq: "weekly"  },
  { url: "/contact-about",  priority: "0.5", changefreq: "monthly" },
  { url: "/mentions-legales", priority: "0.3", changefreq: "yearly" },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod   ? `    <lastmod>${lastmod}</lastmod>` : "",
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : "",
    priority   ? `    <priority>${priority}</priority>` : "",
    "  </url>",
  ].filter(Boolean).join("\n");
}

router.get("/sitemap.xml", async (req, res) => {
  try {
    // Recettes approuvées
    const recipes = await Recipe.findAll({
      where: { status: "approved", slug: { [Op.not]: null } },
      attributes: ["slug", "validated_at", "updatedAt"],
      raw: true,
    });

    // Genres distincts des films approuvés (≥1 recette approuvée)
    const movies = await Movie.findAll({
      where: { status: "approved" },
      attributes: ["genre"],
    });
    const genres = [...new Set(
      movies.map(m => (m.genre || "").toLowerCase().trim()).filter(Boolean)
    )];

    const entries = [];

    // Pages statiques
    for (const page of STATIC_PAGES) {
      entries.push(urlEntry({
        loc: BASE_URL + page.url,
        changefreq: page.changefreq,
        priority: page.priority,
      }));
    }

    // Pages genres
    for (const genre of genres) {
      entries.push(urlEntry({
        loc: BASE_URL + "/movies/" + encodeURIComponent(genre),
        changefreq: "weekly",
        priority: "0.7",
      }));
    }

    // Pages recettes
    for (const recipe of recipes) {
      const lastmod = (recipe.validated_at || recipe.updatedAt)
        ? new Date(recipe.validated_at || recipe.updatedAt).toISOString().split("T")[0]
        : undefined;
      entries.push(urlEntry({
        loc: BASE_URL + "/recipes-movie/details/" + recipe.slug,
        lastmod,
        changefreq: "monthly",
        priority: "0.8",
      }));
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...entries,
      "</urlset>",
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(xml);

  } catch (err) {
    console.error("[sitemap] erreur :", err);
    res.status(500).send("Erreur génération sitemap");
  }
});

export default router;
