/**
 * collection.js — Ma Collection : filtres de l'onglet Univers (Phase 2)
 * Vanilla JS — filtrage pur front, sans rechargement de page. Ne touche
 * à aucune autre logique (tabs = profile-tabs.js, inchangé).
 */
(function () {
  'use strict';

  var STATUS_BY_FILTER = {
    all: null,
    'en-cours': ['exploration', 'specialisation'],
    maitrise: ['maitrise'],
    'non-explore': ['non-explore'],
  };

  function applyFilter(filter) {
    var grid = document.getElementById('collUniversGrid');
    var empty = document.getElementById('collEmptyFilter');
    if (!grid) return;

    var allowed = STATUS_BY_FILTER[filter] || null;
    var visibleCount = 0;

    grid.querySelectorAll('.cp-univers__card[data-filter-status]').forEach(function (card) {
      var status = card.dataset.filterStatus;
      var show = !allowed || allowed.indexOf(status) !== -1;
      card.hidden = !show;
      if (show) visibleCount++;
    });

    if (empty) empty.hidden = visibleCount !== 0;
  }

  /* Phase 3 : la carte entière mène à la fiche détaillée (le lien texte
     "Voir l'Univers →" du survol reste le lien "officiel" pour le clavier/
     lecteurs d'écran — ceci n'est qu'un raccourci pratique en plus). */
  function initCardNav() {
    var grid = document.getElementById('collUniversGrid');
    if (!grid) return;
    grid.addEventListener('click', function (e) {
      if (e.target.closest('a')) return; // laisse le vrai lien faire son travail
      var card = e.target.closest('.cp-univers__card[data-href]');
      if (card) window.location.href = card.dataset.href;
    });
  }

  /* Phase 4 — onglet Fonds : filtre Tous/Obtenus/À débloquer. Filtre les
     puces Fonds individuellement (pas les groupes) et masque un groupe
     Univers entier s'il ne lui reste plus aucune puce visible — évite une
     carte vide avec juste un en-tête quand on filtre "Obtenus" sur un
     Univers jamais exploré. */
  function applyFondsFilter(filter) {
    var groupsWrap = document.getElementById('fondsGroups');
    var empty = document.getElementById('fondsEmptyFilter');
    if (!groupsWrap) return;

    var visibleGroups = 0;

    groupsWrap.querySelectorAll('.fnd-group').forEach(function (group) {
      var anyVisible = false;
      group.querySelectorAll('.fnd-chip[data-fonds-status]').forEach(function (chip) {
        var status = chip.dataset.fondsStatus; // 'obtenu' | 'verrouille'
        var show = filter === 'all' ||
          (filter === 'obtenus' && status === 'obtenu') ||
          (filter === 'verrouilles' && status === 'verrouille');
        chip.hidden = !show;
        if (show) anyVisible = true;
      });
      group.hidden = !anyVisible;
      if (anyVisible) visibleGroups++;
    });

    if (empty) empty.hidden = visibleGroups !== 0;
  }

  /* Phase 5 — onglet Cadres : même logique que applyFondsFilter, sur les
     30 Cadres d'Univers (2 par Univers) au lieu des 75 Fonds. */
  function applyCadresFilter(filter) {
    var groupsWrap = document.getElementById('cadresGroups');
    var empty = document.getElementById('cadresEmptyFilter');
    if (!groupsWrap) return;

    var visibleGroups = 0;

    groupsWrap.querySelectorAll('.cdr-group').forEach(function (group) {
      var anyVisible = false;
      group.querySelectorAll('.cdr-chip[data-cadres-status]').forEach(function (chip) {
        var status = chip.dataset.cadresStatus; // 'obtenu' | 'verrouille'
        var show = filter === 'all' ||
          (filter === 'obtenus' && status === 'obtenu') ||
          (filter === 'verrouilles' && status === 'verrouille');
        chip.hidden = !show;
        if (show) anyVisible = true;
      });
      group.hidden = !anyVisible;
      if (anyVisible) visibleGroups++;
    });

    if (empty) empty.hidden = visibleGroups !== 0;
  }

  /* Phase 6 — onglet Trophées : grille UNIQUE (pas de groupes), filtre
     Tous/Obtenus/À débloquer directement sur les 18 cartes. */
  function applyTrophiesFilter(filter) {
    var grid = document.getElementById('trpGrid');
    var empty = document.getElementById('trpEmptyFilter');
    if (!grid) return;

    var visibleCount = 0;

    grid.querySelectorAll('.trp-card[data-trp-status]').forEach(function (card) {
      var status = card.dataset.trpStatus; // 'obtenu' | 'verrouille'
      var show = filter === 'all' ||
        (filter === 'obtenus' && status === 'obtenu') ||
        (filter === 'verrouilles' && status === 'verrouille');
      card.hidden = !show;
      if (show) visibleCount++;
    });

    if (empty) empty.hidden = visibleCount !== 0;
  }

  function init() {
    initCardNav();

    var bar = document.getElementById('collUniversFilters');
    if (bar) {
      bar.querySelectorAll('.f-pill[data-coll-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          bar.querySelectorAll('.f-pill').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          applyFilter(btn.dataset.collFilter);
        });
      });
      applyFilter('all');
    }

    var fondsBar = document.getElementById('fondsFilters');
    if (fondsBar) {
      fondsBar.querySelectorAll('.f-pill[data-fonds-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          fondsBar.querySelectorAll('.f-pill').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          applyFondsFilter(btn.dataset.fondsFilter);
        });
      });
      applyFondsFilter('all');
    }

    var cadresBar = document.getElementById('cadresFilters');
    if (cadresBar) {
      cadresBar.querySelectorAll('.f-pill[data-cadres-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          cadresBar.querySelectorAll('.f-pill').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          applyCadresFilter(btn.dataset.cadresFilter);
        });
      });
      applyCadresFilter('all');
    }

    var trpBar = document.getElementById('trpFilters');
    if (trpBar) {
      trpBar.querySelectorAll('.f-pill[data-trp-filter]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          trpBar.querySelectorAll('.f-pill').forEach(function (b) {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
          applyTrophiesFilter(btn.dataset.trpFilter);
        });
      });
      applyTrophiesFilter('all');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
