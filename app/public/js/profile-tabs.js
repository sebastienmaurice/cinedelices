/**
 * profile-tabs.js — Navigation onglets premium Mon Compte
 * Vanilla JS — Hash URL — Transition opacity + translateY
 * Moodboard v2 : classes .ptab / .tab-pane / .active
 */
(function () {
  'use strict';

  var DEFAULT_TAB = 'overview';
  var VALID_TABS = ['overview', 'profil', 'favoris', 'creations', 'contributions'];

  function getActiveTab() {
    var hash = window.location.hash.replace('#', '');
    return VALID_TABS.indexOf(hash) !== -1 ? hash : DEFAULT_TAB;
  }

  function activateTab(tabId) {
    document.querySelectorAll('.ptab').forEach(function (link) {
      var isActive = link.dataset.tab === tabId;
      link.classList.toggle('active', isActive);
      link.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('.tab-pane').forEach(function (panel) {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  function init() {
    document.querySelectorAll('.ptab').forEach(function (link) {
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
  }

  /* exposer pour les liens inline type onclick="activateTab('creations')" */
  window.activateTab = activateTab;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
