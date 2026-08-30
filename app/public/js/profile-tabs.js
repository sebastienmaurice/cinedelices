/**
 * profile-tabs.js — Navigation onglets premium (classes .ptab / .tab-pane)
 * Vanilla JS — Hash URL — Transition opacity + translateY
 *
 * Générique : les onglets valides et l'onglet par défaut sont déduits du
 * DOM de la page (tous les data-tab présents), pas d'une liste figée —
 * ce script est partagé par Mon compte (4 onglets) et Ma Collection
 * (4 onglets différents) sans duplication (Phase 1, Ma Collection).
 */
(function () {
  'use strict';

  function getValidTabs() {
    return Array.prototype.map.call(document.querySelectorAll('.ptab[data-tab]'), function (el) {
      return el.dataset.tab;
    });
  }

  function getDefaultTab(validTabs) {
    var activeEl = document.querySelector('.ptab.active[data-tab]');
    if (activeEl) return activeEl.dataset.tab;
    return validTabs[0];
  }

  function getActiveTab() {
    var validTabs = getValidTabs();
    var hash = window.location.hash.replace('#', '');
    return validTabs.indexOf(hash) !== -1 ? hash : getDefaultTab(validTabs);
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
