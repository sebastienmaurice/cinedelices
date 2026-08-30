/**
 * collection-univers.js — Fiche détaillée d'un Univers (Phase 3, Ma Collection)
 * Action "Utiliser ce Fond" / "Équiper" un Cadre — Phase 3 reste 100% mock,
 * donc AUCUN appel réseau ici : bascule purement visuelle côté client (ne
 * persiste pas au rechargement) + toast via le système existant _cdToast.
 * Le jour où le backend réel existera, cette fonction sera remplacée par
 * un vrai appel API — la structure des boutons (data-kind/data-index) est
 * déjà prête pour ça.
 */
(function () {
  'use strict';

  function equip(kind, index) {
    var group = document.querySelectorAll('.uf-equip-btn[data-kind="' + kind + '"]');
    group.forEach(function (btn) {
      var isTarget = parseInt(btn.dataset.index, 10) === index;
      btn.disabled = isTarget;
      btn.textContent = isTarget ? 'ACTIF' : (kind === 'cadre' ? 'Équiper' : 'Utiliser ce Fond');
    });
  }

  function init() {
    document.querySelectorAll('.uf-equip-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        var kind = btn.dataset.kind;
        var index = parseInt(btn.dataset.index, 10);
        equip(kind, index);
        if (typeof window._cdToast === 'function') {
          window._cdToast(kind === 'cadre' ? 'Cadre équipé ✓' : 'Fond équipé ✓', 'success');
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
