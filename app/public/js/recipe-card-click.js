/**
 * Délégation de clic pour .recipe-card (fallback CSS stretched-link).
 * Si un clic sur la card ne cible ni .btn-fav ni un autre <a>, on navigue
 * via le href de .recipe-card__link. Évite les conflits de stacking/pointer-events.
 */
(function () {
  'use strict';

  document.querySelectorAll('.recipe-card').forEach((card) => {
    card.style.cursor = 'pointer';
  });

  document.addEventListener('click', function (e) {
    const card = e.target.closest('.recipe-card');
    if (!card) return;

    // Ignorer les clics sur éléments interactifs (favori, liens internes, boutons)
    if (e.target.closest('.btn-fav, button, input, select, textarea')) return;
    const innerAnchor = e.target.closest('a');
    if (innerAnchor && !innerAnchor.classList.contains('recipe-card__link')) return;

    // Si le clic est déjà sur le link natif, laisser passer
    if (innerAnchor && innerAnchor.classList.contains('recipe-card__link')) return;

    const link = card.querySelector('.recipe-card__link');
    if (!link || !link.href) return;

    // Ctrl/Cmd-click ou middle-click → nouvel onglet
    if (e.ctrlKey || e.metaKey || e.button === 1) {
      window.open(link.href, '_blank', 'noopener');
    } else {
      window.location.href = link.href;
    }
  });
})();
