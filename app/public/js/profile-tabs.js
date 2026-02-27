/**
 * profile-tabs.js — Navigation onglets premium Mon Compte
 * Vanilla JS — Hash URL — Transition opacity + translateY
 */
(function () {
  'use strict';

  var DEFAULT_TAB = 'overview';
  var VALID_TABS = ['overview', 'profil', 'palmares', 'favoris', 'creations'];

  function getActiveTab() {
    var hash = window.location.hash.replace('#', '');
    return VALID_TABS.indexOf(hash) !== -1 ? hash : DEFAULT_TAB;
  }

  function activateTab(tabId) {
    document.querySelectorAll('.profile-tabs__link').forEach(function (link) {
      var isActive = link.dataset.tab === tabId;
      link.classList.toggle('is-active', isActive);
      link.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.profile-tab-panel').forEach(function (panel) {
      panel.classList.toggle('is-active', panel.id === tabId);
    });
  }

  function initBadgeZoom() {
    var badge = document.querySelector('.palmares-badge--current .palmares-badge__img');
    if (!badge) return;

    var overlay = document.createElement('div');
    overlay.className = 'badge-zoom-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', badge.alt || 'Badge débloqué');

    var img = document.createElement('img');
    img.className = 'badge-zoom-overlay__img';
    img.src = badge.src;
    img.alt = badge.alt;
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    badge.addEventListener('click', function () {
      overlay.classList.add('is-open');
    });

    overlay.addEventListener('click', function () {
      overlay.classList.remove('is-open');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') overlay.classList.remove('is-open');
    });
  }

  function init() {
    document.querySelectorAll('.profile-tabs__link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var tabId = this.dataset.tab;
        history.pushState(null, '', '#' + tabId);
        activateTab(tabId);
      });
    });

    window.addEventListener('hashchange', function () {
      activateTab(getActiveTab());
    });

    activateTab(getActiveTab());
    initBadgeZoom();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
