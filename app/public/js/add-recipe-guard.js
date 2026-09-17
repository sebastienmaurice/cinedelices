/**
 * add-recipe-guard.js
 * ─────────────────────────────────────────────────────────────────────
 * Empêche un visiteur non connecté d'atterrir sur la page 403 brute en
 * cliquant "Ajouter ce film"/"Ajouter ma recette" (route protégée
 * /add-recipes-movies/, voir app/routes/index.route.js). Avant : clic →
 * navigation → 403 serveur ("Vous n'avez pas accès à cette salle") —
 * une redirection franche vers un mur, pas une invitation à se connecter.
 *
 * Un seul écouteur délégué au niveau du document couvre TOUS les points
 * d'entrée (liens statiques dans 9 templates + résultats de recherche
 * générés dynamiquement par movie-search-advanced.js) sans avoir à
 * patcher chaque template un par un.
 *
 * Même pattern que favorites.js (openModal('login') si non connecté) —
 * pas de nouveau mécanisme inventé.
 */
(function () {
  'use strict';

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href^="/add-recipes-movies"]');
    if (!link) return;

    const isLoggedIn = window.CINEDELICES?.isLoggedIn || false;
    if (isLoggedIn) return; // navigation normale, rien à faire

    e.preventDefault();
    if (typeof window.openModal === 'function') {
      window.openModal('login');
    } else {
      window.location.href = '/auth/login';
    }
  });
})();
