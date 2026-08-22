/**
 * add-recipes-movies-film-tab.js
 * Étape 01 "Mon film ou ma série" — refonte "Velours & Projecteur".
 * Recherche + import TMDB (via les proxies serveur /api/tmdb/search et
 * /api/tmdb/detail), édition manuelle, synchronisation vers les champs
 * cachés lus par unified-form-handler.js (#film-name/#film-year/#film-genre/
 * #film-synopsis + #tmdbId-hidden etc.) — contrat de soumission inchangé.
 */
(function () {
  "use strict";

  var form = document.getElementById("film-preview-form");
  if (!form) return;

  /* ── Éléments ── */
  var typeToggle = document.getElementById("dcFilmTypeToggle");
  var searchInput = document.getElementById("dcFilmSearchInput");
  var searchBtn = document.getElementById("dcFilmSearchBtn");
  var searchError = document.getElementById("dcFilmSearchError");
  var resultsZone = document.getElementById("dcFilmResultsZone");
  var resultsAnnounce = document.getElementById("dcFilmResultsAnnounce");
  var manualLink = document.getElementById("dcFilmManualLink");
  var editBlock = document.getElementById("dcFilmEditBlock");
  var editTitle = document.getElementById("dcEditTitle");
  var editYear = document.getElementById("dcEditYear");
  var editGenre = document.getElementById("dcEditGenre");
  var editDirector = document.getElementById("dcEditDirector");
  var editSynopsis = document.getElementById("dcEditSynopsis");
  var ctaHint = document.getElementById("dcFilmCtaHint");
  var continueBtn = document.getElementById("dcFilmContinueBtn");

  var filmNameHidden = document.getElementById("film-name");
  var filmYearHidden = document.getElementById("film-year");
  var filmGenreHidden = document.getElementById("film-genre");
  var filmSynopsisHidden = document.getElementById("film-synopsis");
  var tmdbIdHidden = document.getElementById("tmdbId-hidden");
  var titleFRHidden = document.getElementById("titleFR-hidden");
  var tmdbYearHidden = document.getElementById("tmdbYear-hidden");
  var tmdbGenreHidden = document.getElementById("tmdbGenre-hidden");
  var filmTypeHidden = document.getElementById("film-type-hidden");

  /* ── État ── */
  var state = {
    type: "movie", // 'movie' | 'tv' | 'anime' (bascule UI — 'anime' interroge movie+tv filtrés genre 16)
    lastResults: [],
    activeOptionIndex: -1,
    imported: null, // { id, media_type, title, year, genre, genres, director, runtime, vote_average, overview, poster_path }
    manuallyEdited: false,
    editOpen: false,
    abortCtrl: null,
  };

  var GENRE_LABELS = {
    action: "Action", animation: "Animation", aventure: "Aventure", comédie: "Comédie",
    crime: "Crime", documentaire: "Documentaire", drame: "Drame", familial: "Familial",
    fantastique: "Fantastique", guerre: "Guerre", histoire: "Histoire", horreur: "Horreur",
    musique: "Musique", mystère: "Mystère", romance: "Romance", "science-fiction": "Science-Fiction",
    thriller: "Thriller", téléfilm: "Téléfilm", western: "Western",
  };

  function escHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  /* ══════════════════════════════════════════════════════
     SYNCHRONISATION vers les champs cachés du formulaire unifié
  ══════════════════════════════════════════════════════ */
  function syncHiddenFields() {
    var d = state.imported;
    if (d) {
      filmNameHidden.value = d.title || "";
      filmYearHidden.value = d.year || "";
      filmGenreHidden.value = d.genre || "";
      filmSynopsisHidden.value = d.overview || "";
      if (d.tmdb_id_persisted !== false) {
        tmdbIdHidden.value = d.id || "";
        titleFRHidden.value = d.title || "";
        tmdbYearHidden.value = d.year || "";
        tmdbGenreHidden.value = d.genre || "";
        filmTypeHidden.value = d.media_type || "movie";
      }
    } else {
      // Saisie manuelle pure (pas d'import TMDB)
      filmNameHidden.value = (editTitle.value || "").trim();
      filmYearHidden.value = (editYear.value || "").trim();
      filmGenreHidden.value = (editGenre.value || "").trim();
      filmSynopsisHidden.value = (editSynopsis.value || "").trim();
      tmdbIdHidden.value = "";
      titleFRHidden.value = "";
      tmdbYearHidden.value = "";
      tmdbGenreHidden.value = "";
      filmTypeHidden.value = state.type === "tv" ? "tv" : "movie";
    }
    if (window.checkS1) window.checkS1();
  }

  /* ══════════════════════════════════════════════════════
     BASCULE Film / Série / Animé
  ══════════════════════════════════════════════════════ */
  if (typeToggle) {
    typeToggle.addEventListener("click", function (e) {
      var btn = e.target.closest(".dc-pilltoggle__opt");
      if (!btn) return;
      var newType = btn.dataset.type;
      if (newType === state.type) return;

      var doSwitch = function () {
        state.type = newType;
        typeToggle.querySelectorAll(".dc-pilltoggle__opt").forEach(function (o) {
          var active = o === btn;
          o.classList.toggle("is-active", active);
          o.setAttribute("aria-checked", active ? "true" : "false");
        });
        resetToEmpty();
        searchInput.value = "";
      };

      if (state.manuallyEdited || state.imported) {
        if (confirm("Changer de type réinitialisera la recherche et la fiche importée. Continuer ?")) doSwitch();
      } else {
        doSwitch();
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     RECHERCHE
  ══════════════════════════════════════════════════════ */
  function tmdbTypesForCurrentToggle() {
    if (state.type === "tv") return ["tv"];
    if (state.type === "anime") return ["movie", "tv"];
    return ["movie"];
  }

  function showSearchError(msg) {
    if (!searchError) return;
    if (!msg) { searchError.hidden = true; searchError.textContent = ""; return; }
    searchError.hidden = false;
    searchError.textContent = msg;
  }

  function renderSkeleton() {
    var rows = "";
    for (var i = 0; i < 3; i++) {
      rows += '<div class="dc-result-row dc-result-row--skeleton"><div class="dc-skel dc-skel--poster"></div><div class="dc-skel-lines"><div class="dc-skel dc-skel--line-lg"></div><div class="dc-skel dc-skel--line-sm"></div></div></div>';
    }
    resultsZone.innerHTML = '<div class="dc-results-list" aria-hidden="true">' + rows + "</div>";
  }

  function renderError(message, retryFn) {
    resultsZone.innerHTML =
      '<div class="dc-empty-panel dc-empty-panel--error">' +
      '<i data-lucide="circle-alert" width="26" height="26" stroke-width="1.5" aria-hidden="true"></i>' +
      '<p class="dc-empty-panel__title">' + escHtml(message) + "</p>" +
      '<button type="button" class="dc-btn dc-btn--ghost" id="dcFilmRetryBtn">Réessayer</button>' +
      "</div>";
    if (window.lucide) lucide.createIcons();
    var retryBtn = document.getElementById("dcFilmRetryBtn");
    if (retryBtn) retryBtn.addEventListener("click", retryFn);
  }

  function resetToEmpty() {
    state.imported = null;
    state.lastResults = [];
    state.activeOptionIndex = -1;
    state.manuallyEdited = false;
    editBlock.hidden = true;
    state.editOpen = false;
    resultsZone.innerHTML =
      '<div class="dc-empty-panel" id="dcFilmEmptyState">' +
      '<i data-lucide="clapperboard" width="30" height="30" stroke-width="1.3" aria-hidden="true"></i>' +
      '<p class="dc-empty-panel__title">Aucune fiche importée</p>' +
      '<p class="dc-empty-panel__sub">Lancez une recherche pour récupérer l’affiche et les informations du film qui inspire votre recette.</p>' +
      "</div>";
    if (window.lucide) lucide.createIcons();
    syncHiddenFields();
    showSearchError(null);
  }

  function performSearch() {
    var q = searchInput.value.trim();
    if (q.length < 2) return;

    if (state.abortCtrl) state.abortCtrl.abort();
    var ctrl = new AbortController();
    state.abortCtrl = ctrl;

    renderSkeleton();
    showSearchError(null);

    var types = tmdbTypesForCurrentToggle();
    Promise.all(
      types.map(function (t) {
        return fetch("/api/tmdb/search?q=" + encodeURIComponent(q) + "&type=" + t, { signal: ctrl.signal })
          .then(function (r) { return r.json(); })
          .then(function (data) { return (data.results || []).map(function (r) { r.__type = t; return r; }); })
          .catch(function (err) { if (err.name === "AbortError") throw err; return []; });
      })
    )
      .then(function (lists) {
        var merged = [].concat.apply([], lists);
        if (state.type === "anime") {
          merged = merged.filter(function (r) { return (r.genre_ids || []).includes(16); });
        }
        merged.sort(function (a, b) { return (b.popularity || 0) - (a.popularity || 0); });
        merged = merged.slice(0, 10);
        state.lastResults = merged;
        renderResults(merged, q);
      })
      .catch(function (err) {
        if (err.name === "AbortError") return;
        renderError("Erreur réseau — impossible de contacter TMDB.", performSearch);
      });
  }

  function renderResults(results, q) {
    if (!results.length) {
      resultsZone.innerHTML =
        '<div class="dc-empty-panel">' +
        '<i data-lucide="search-x" width="26" height="26" stroke-width="1.5" aria-hidden="true"></i>' +
        '<p class="dc-empty-panel__title">Aucun film trouvé pour “' + escHtml(q) + '”</p>' +
        '<p class="dc-empty-panel__sub">Vérifiez l’orthographe ou le type sélectionné.</p>' +
        "</div>";
      if (window.lucide) lucide.createIcons();
      if (resultsAnnounce) resultsAnnounce.textContent = "Aucun résultat.";
      return;
    }

    var html = '<div class="dc-results-list" id="dcFilmResultsList" role="listbox" aria-label="Résultats de recherche">';
    results.forEach(function (r, i) {
      var meta = [r.year].filter(Boolean).join("");
      html +=
        '<div class="dc-result-row" role="option" tabindex="-1" data-idx="' + i + '" aria-selected="false">' +
        (r.poster_thumb
          ? '<img class="dc-result-row__poster" src="' + r.poster_thumb + '" alt="" loading="lazy" />'
          : '<div class="dc-result-row__poster dc-result-row__poster--ph"><i data-lucide="image" width="16" height="16" stroke-width="1.5" aria-hidden="true"></i></div>') +
        '<div class="dc-result-row__info">' +
        '<span class="dc-result-row__title">' + escHtml(r.title || "—") + "</span>" +
        (meta ? '<span class="dc-result-row__meta">' + escHtml(meta) + "</span>" : "") +
        "</div>" +
        '<button type="button" class="dc-btn dc-btn--gold dc-result-row__import" tabindex="-1">' +
        '<i data-lucide="download" width="13" height="13" stroke-width="2" aria-hidden="true"></i>' +
        "Importer cette fiche" +
        "</button>" +
        "</div>";
    });
    html += "</div>";
    resultsZone.innerHTML = html;
    if (window.lucide) lucide.createIcons();
    if (resultsAnnounce) resultsAnnounce.textContent = results.length + " résultat" + (results.length > 1 ? "s" : "") + " trouvé" + (results.length > 1 ? "s" : "") + ".";
    searchInput.setAttribute("aria-expanded", "true");

    resultsZone.querySelectorAll(".dc-result-row").forEach(function (row) {
      row.addEventListener("click", function () { importResult(parseInt(row.dataset.idx, 10)); });
    });
  }

  function importResult(idx) {
    var r = state.lastResults[idx];
    if (!r) return;
    resultsZone.innerHTML = '<div class="dc-empty-panel"><i data-lucide="loader-circle" width="26" height="26" class="dc-spin" aria-hidden="true"></i><p class="dc-empty-panel__title">Import de la fiche…</p></div>';
    if (window.lucide) lucide.createIcons();

    fetch("/api/tmdb/detail?id=" + r.id + "&type=" + r.__type)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.success || !data.detail) {
          renderError("Impossible de récupérer cette fiche.", function () { importResult(idx); });
          return;
        }
        state.imported = data.detail;
        state.manuallyEdited = false;
        editBlock.hidden = true;
        state.editOpen = false;
        renderImported();
        syncHiddenFields();
        document.dispatchEvent(new CustomEvent("tmdbFormPrefilled"));
      })
      .catch(function () {
        renderError("Erreur réseau lors de l’import.", function () { importResult(idx); });
      });
  }

  function renderImported() {
    var d = state.imported;
    var pills = [];
    if (d.year) pills.push(['calendar', d.year]);
    if (d.genres && d.genres.length) pills.push(['tags', d.genres.join(', ')]);
    if (d.director) pills.push(['user', d.director]);
    if (d.runtime) pills.push(['clock', d.runtime + ' min']);
    if (typeof d.vote_average === 'number') pills.push(['star', d.vote_average.toFixed(1).replace('.', ',') + ' / 10']);

    var pillsHtml = pills.map(function (p) {
      return '<span class="dc-pill"><i data-lucide="' + p[0] + '" width="11" height="11" stroke-width="2" aria-hidden="true"></i>' + escHtml(p[1]) + '</span>';
    }).join('');

    var posterHtml = d.poster_path
      ? '<img class="dc-imported__poster" src="' + d.poster_path + '" alt="Affiche officielle de ' + escHtml(d.title) + '" loading="lazy" />'
      : '<div class="dc-imported__poster dc-imported__poster--ph"><i data-lucide="image" width="28" height="28" stroke-width="1.3" aria-hidden="true"></i><span>Pas d’affiche disponible</span></div>';

    resultsZone.innerHTML =
      '<div class="dc-imported" id="dcImportedCard">' +
      '<div class="dc-imported__poster-wrap">' + posterHtml +
      '<p class="dc-imported__poster-caption">Affiche officielle · 2:3 · TMDB</p>' +
      '</div>' +
      '<div class="dc-imported__info">' +
      '<span class="dc-badge dc-badge--sage"><i data-lucide="circle-check" width="12" height="12" stroke-width="2.2" aria-hidden="true"></i>Fiche TMDB #' + d.id + ' importée</span>' +
      '<h3 class="dc-imported__title">' + escHtml(d.title) + '</h3>' +
      (pillsHtml ? '<div class="dc-imported__pills">' + pillsHtml + '</div>' : '') +
      '<p class="dc-imported__synopsis">' + (d.overview ? escHtml(d.overview) : '<span class="dc-text-tertiary">Synopsis non disponible en français</span>') + '</p>' +
      '<div class="dc-imported__actions">' +
      '<button type="button" class="dc-btn dc-btn--ghost" id="dcFilmChangeBtn"><i data-lucide="rotate-ccw" width="13" height="13" stroke-width="2" aria-hidden="true"></i>Changer de film</button>' +
      '<button type="button" class="dc-btn dc-btn--gold" id="dcFilmEditToggleBtn" aria-expanded="false" aria-controls="dcFilmEditBlock"><i data-lucide="pencil" width="13" height="13" stroke-width="2" aria-hidden="true"></i>Corriger les informations</button>' +
      '</div></div></div>';

    if (window.lucide) lucide.createIcons();

    document.getElementById("dcFilmChangeBtn").addEventListener("click", function () {
      var doReset = function () { resetToEmpty(); searchInput.value = ""; searchInput.focus(); };
      if (state.manuallyEdited) {
        if (confirm("Des corrections manuelles ont été apportées à cette fiche. Changer de film les effacera. Continuer ?")) doReset();
      } else {
        doReset();
      }
    });

    document.getElementById("dcFilmEditToggleBtn").addEventListener("click", function (e) {
      toggleEditBlock(e.currentTarget);
    });
  }

  /* ══════════════════════════════════════════════════════
     BLOC D'ÉDITION / SAISIE MANUELLE
  ══════════════════════════════════════════════════════ */
  function fillEditBlockFromImported() {
    var d = state.imported;
    editTitle.value = d ? d.title || "" : "";
    editYear.value = d ? d.year || "" : "";
    editGenre.value = d && d.genre ? d.genre : "";
    editDirector.value = d ? d.director || "" : "";
    editSynopsis.value = d ? d.overview || "" : "";
  }

  function toggleEditBlock(btn) {
    state.editOpen = !state.editOpen;
    editBlock.hidden = !state.editOpen;
    if (btn) {
      btn.setAttribute("aria-expanded", state.editOpen ? "true" : "false");
      btn.innerHTML = state.editOpen
        ? '<i data-lucide="pencil" width="13" height="13" stroke-width="2" aria-hidden="true"></i>Masquer les champs'
        : '<i data-lucide="pencil" width="13" height="13" stroke-width="2" aria-hidden="true"></i>Corriger les informations';
      if (window.lucide) lucide.createIcons();
    }
    if (state.editOpen) fillEditBlockFromImported();
  }

  if (manualLink) {
    manualLink.addEventListener("click", function () {
      state.imported = null;
      editTitle.value = "";
      editYear.value = "";
      editGenre.value = "";
      editDirector.value = "";
      editSynopsis.value = "";
      editBlock.hidden = false;
      state.editOpen = true;
      state.manuallyEdited = true;
      resultsZone.innerHTML = "";
      editTitle.focus();
      syncHiddenFields();
    });
  }

  [editTitle, editYear, editGenre, editDirector, editSynopsis].forEach(function (el) {
    if (!el) return;
    el.addEventListener("input", function () {
      state.manuallyEdited = true;
      if (state.imported) {
        // Écrase l'affichage de la fiche importée en temps réel
        state.imported = Object.assign({}, state.imported, {
          title: editTitle.value,
          year: editYear.value,
          genre: editGenre.value,
          director: editDirector.value,
          overview: editSynopsis.value,
        });
        var titleEl = document.querySelector(".dc-imported__title");
        if (titleEl) titleEl.textContent = editTitle.value;
      }
      syncHiddenFields();
    });
  });

  /* ══════════════════════════════════════════════════════
     ÉVÉNEMENTS RECHERCHE
  ══════════════════════════════════════════════════════ */
  if (searchBtn) searchBtn.addEventListener("click", performSearch);
  if (searchInput) {
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
        return;
      }
      var list = document.getElementById("dcFilmResultsList");
      if (!list) return;
      var rows = list.querySelectorAll(".dc-result-row");
      if (!rows.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        state.activeOptionIndex += e.key === "ArrowDown" ? 1 : -1;
        if (state.activeOptionIndex < 0) state.activeOptionIndex = rows.length - 1;
        if (state.activeOptionIndex >= rows.length) state.activeOptionIndex = 0;
        rows.forEach(function (r, i) { r.setAttribute("aria-selected", i === state.activeOptionIndex ? "true" : "false"); });
        rows[state.activeOptionIndex].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter" && state.activeOptionIndex >= 0) {
        importResult(state.activeOptionIndex);
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     CTA "Je passe à la recette"
  ══════════════════════════════════════════════════════ */
  if (continueBtn) {
    continueBtn.addEventListener("click", function () {
      var valid = filmNameHidden.value.trim() && filmYearHidden.value.trim() && filmGenreHidden.value.trim();
      if (!valid) {
        showSearchError("Importez d’abord une fiche depuis TMDB, ou saisissez le film manuellement.");
        return;
      }
      showSearchError(null);
      if (window.goToTab) window.goToTab(2);
    });
  }

  /* Init */
  syncHiddenFields();
})();
