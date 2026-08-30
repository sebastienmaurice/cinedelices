/**
 * collection-univers.js — Fiche détaillée d'un Univers (Phase 3, Ma Collection)
 * Action "Utiliser ce Fond" / "Équiper" un Cadre / "Définir comme Univers
 * actif" — Phase 15 : mécanique réellement persistante (POST réel,
 * revalidation serveur, aucune confiance dans l'état visuel avant réponse).
 * La structure des boutons (data-kind/data-index/data-code) était déjà
 * prête depuis la Phase 3 — seul le comportement au clic change ici.
 */
(function () {
  'use strict';

  function toast(message, type) {
    if (typeof window._cdToast === 'function') window._cdToast(message, type);
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { /* réponse non-JSON — traité comme échec ci-dessous */ }
    return { ok: res.ok, data };
  }

  function updateEquipGroup(kind, index) {
    document.querySelectorAll('.uf-equip-btn[data-kind="' + kind + '"]').forEach(function (btn) {
      var isTarget = parseInt(btn.dataset.index, 10) === index;
      btn.disabled = isTarget;
      btn.textContent = isTarget ? 'ACTIF' : (kind === 'cadre' ? 'Équiper' : 'Utiliser ce Fond');
    });
  }

  async function handleEquipClick(btn) {
    if (btn.disabled) return;
    var kind = btn.dataset.kind;
    var code = btn.dataset.code;
    var index = parseInt(btn.dataset.index, 10);

    btn.disabled = true;
    var originalText = btn.textContent;
    btn.textContent = '…';

    const { ok, data } = await postJSON('/collection/univers/' + encodeURIComponent(code) + '/' + kind, { index: index });

    if (ok && data && data.success) {
      updateEquipGroup(kind, index);
      toast(kind === 'cadre' ? 'Cadre équipé ✓' : 'Fond équipé ✓', 'success');
    } else {
      btn.disabled = false;
      btn.textContent = originalText;
      toast("Impossible d'équiper : ce palier n'est pas (ou plus) débloqué.", 'error');
    }
  }

  async function handleActifClick(btn) {
    if (btn.disabled) return;
    var code = btn.dataset.code;
    var originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '…';

    const { ok, data } = await postJSON('/collection/univers-actif', { code: code });

    if (ok && data && data.success) {
      // Un seul Univers actif à la fois côté données — la fiche ne connaît
      // que CET Univers, donc un rechargement est la façon la plus sûre de
      // refléter partout (badge "Actif" ici + toute autre carte concernée
      // par ce même Univers) sans dupliquer l'état ailleurs en JS.
      toast('Univers actif ✓', 'success');
      window.location.reload();
    } else {
      btn.disabled = false;
      btn.textContent = originalText;
      toast("Impossible de définir cet Univers comme actif.", 'error');
    }
  }

  function init() {
    document.querySelectorAll('.uf-equip-btn[data-kind]').forEach(function (btn) {
      btn.addEventListener('click', function () { handleEquipClick(btn); });
    });
    var actifBtn = document.getElementById('ufSetActifBtn');
    if (actifBtn) {
      actifBtn.addEventListener('click', function () { handleActifClick(actifBtn); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
