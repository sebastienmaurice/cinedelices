/**
 * cinepass.js
 * ─────────────────────────────────────────────────────────────────────
 * Le CinéPass est une page de LECTURE de la progression déjà calculée
 * côté serveur (cinepass.controller.js → gamification.service.js).
 * L'équipement des cadres reste géré depuis l'onglet #contributions du
 * profil (POST /auth/equip-frame) — on ne duplique pas cette logique ici.
 *
 * Fichier volontairement minimal pour l'instant : réservé aux futures
 * micro-interactions (hover, scroll-reveal…) qui n'impliquent aucune
 * nouvelle règle de gamification.
 */
(function () {
  "use strict";
  // Rien à faire pour la V1 — les icônes Lucide sont initialisées par
  // head-resources.ejs (script global, déjà chargé sur toutes les pages).
})();
