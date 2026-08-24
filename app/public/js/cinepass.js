/**
 * cinepass.js
 * ─────────────────────────────────────────────────────────────────────
 * Le CinéPass est une page de LECTURE de la progression déjà calculée
 * côté serveur (cinepass.controller.js → gamification.service.js).
 * L'équipement des cadres reste géré depuis l'onglet #contributions du
 * profil (POST /auth/equip-frame) — on ne duplique pas cette logique ici.
 *
 * Ce fichier ne contient QUE du motion design (reveal au scroll) — aucune
 * règle de gamification, aucun appel réseau.
 */
(function () {
  "use strict";

  // Les icônes Lucide sont initialisées par head-resources.ejs (script
  // global, déjà chargé sur toutes les pages) — rien à refaire ici.

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof IntersectionObserver === "undefined") return;

  // Apparition progressive des grandes sections au scroll — chaque bloc
  // raconte une étape du parcours (collection, progression, univers,
  // trophées, étapes, Page Auteur…).
  var targets = document.querySelectorAll(
    ".cp-page .cp-card, .cp-page .cp-showcase, .cp-page .ctb-invite"
  );
  if (!targets.length) return;

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("cp-reveal--in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  targets.forEach(function (el) {
    el.classList.add("cp-reveal");
    io.observe(el);
  });
})();
