/**
 * cookie-banner.js
 * Gestion de la bannière de consentement cookies.
 * Stockage : localStorage key "cd_cookies_consent" = "accepted" | "refused"
 * CNIL : bouton Refuser aussi accessible qu'Accepter.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cd_cookies_consent';
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  // Déjà choisi → ne pas afficher
  if (localStorage.getItem(STORAGE_KEY)) return;

  // Afficher avec un léger délai (laisse la page se charger d'abord)
  requestAnimationFrame(function () {
    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 600);
  });

  function dismiss(choice) {
    localStorage.setItem(STORAGE_KEY, choice);
    banner.classList.remove('is-visible');
    // Retirer du DOM après la transition
    banner.addEventListener('transitionend', function () {
      banner.remove();
    }, { once: true });
  }

  var btnAccept = document.getElementById('ck-accept');
  var btnRefuse = document.getElementById('ck-refuse');

  if (btnAccept) btnAccept.addEventListener('click', function () { dismiss('accepted'); });
  if (btnRefuse) btnRefuse.addEventListener('click', function () { dismiss('refused'); });
})();
