/**
 * cookie-banner.js
 * Consentement cookies granulaire — conforme RGPD / CNIL.
 * Stockage : localStorage "cd_cookies_consent" = JSON {necessary, analytics}
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'cd_cookies_consent';
  var banner = document.getElementById('cookie-banner');
  if (!banner) return;

  // Déjà choisi → ne pas afficher
  if (localStorage.getItem(STORAGE_KEY)) return;

  // Afficher avec léger délai
  requestAnimationFrame(function () {
    setTimeout(function () {
      banner.classList.add('is-visible');
    }, 600);
  });

  function dismiss(consent) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    banner.classList.remove('is-visible');
    banner.addEventListener('transitionend', function () {
      banner.remove();
    }, { once: true });
  }

  var btnAccept  = document.getElementById('ck-accept');
  var btnSave    = document.getElementById('ck-save');
  var btnRefuse  = document.getElementById('ck-refuse');
  var chkAnalytics = document.getElementById('ck-analytics');

  // Tout accepter
  if (btnAccept) btnAccept.addEventListener('click', function () {
    if (chkAnalytics) chkAnalytics.checked = true;
    dismiss({ necessary: true, analytics: true });
  });

  // Enregistrer mes choix
  if (btnSave) btnSave.addEventListener('click', function () {
    dismiss({
      necessary: true,
      analytics: chkAnalytics ? chkAnalytics.checked : false
    });
  });

  // Tout refuser
  if (btnRefuse) btnRefuse.addEventListener('click', function () {
    if (chkAnalytics) chkAnalytics.checked = false;
    dismiss({ necessary: true, analytics: false });
  });

  // Clic sur overlay (ferme sans enregistrer → redemandera plus tard)
  banner.addEventListener('click', function (e) {
    if (e.target === banner) dismiss({ necessary: true, analytics: false });
  });
})();

/**
 * Utilitaire global : vérifier le consentement depuis d'autres scripts
 * Usage : window.CookieConsent.has('analytics')
 */
window.CookieConsent = {
  get: function () {
    try { return JSON.parse(localStorage.getItem('cd_cookies_consent')) || {}; }
    catch (_) { return {}; }
  },
  has: function (type) {
    return !!this.get()[type];
  }
};
