/**
 * cd-toast.js — Système de toast unifié Ciné Délices
 * Design premium cinématographique — v1.0
 *
 * Usage :
 *   window.cdToast('Message', 'success')
 *   window.cdToast('Titre', 'error', 'Description optionnelle')
 *   window.cdToast.success('Message')
 *   window.cdToast.error('Message', 'Détail')
 *   window.cdToast.info('Message')
 *   window.cdToast.warning('Message')
 */

(function () {
  'use strict';

  /* ── Config ────────────────────────────────────────────────── */
  const DURATION   = 3500;
  const ANIM_IN    = 360;
  const ANIM_OUT   = 280;
  const MAX_TOASTS = 4;

  /* ── Icônes SVG inline (Lucide-style) ──────────────────────── */
  const ICONS = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>`,
    error:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    info:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  /* ── Obtenir ou créer le container ─────────────────────────── */
  function getContainer() {
    let c = document.getElementById('cd-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'cd-toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  /* ── Créer et afficher un toast ─────────────────────────────── */
  function show(title, type, sub) {
    type = ['success', 'error', 'warning', 'info'].includes(type) ? type : 'info';
    const container = getContainer();

    /* Limiter le nombre de toasts visibles */
    const existing = container.querySelectorAll('.cd-toast');
    if (existing.length >= MAX_TOASTS) existing[0].querySelector('.cd-toast__close')?.click();

    /* Créer l'élément */
    const toast = document.createElement('div');
    toast.className = `cd-toast cd-toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    toast.innerHTML = `
      <div class="cd-toast__icon">${ICONS[type]}</div>
      <div class="cd-toast__body">
        <p class="cd-toast__title">${title}</p>
        ${sub ? `<p class="cd-toast__sub">${sub}</p>` : ''}
      </div>
      <button class="cd-toast__close" aria-label="Fermer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="cd-toast__progress"></div>
    `;

    container.appendChild(toast);

    /* Animation entrée */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('cd-toast--visible'));
    });

    /* Barre de progression */
    const progress = toast.querySelector('.cd-toast__progress');
    if (progress) {
      progress.style.transitionDuration = DURATION + 'ms';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => progress.classList.add('cd-toast__progress--running'));
      });
    }

    /* Auto-dismiss */
    const timer = setTimeout(() => dismiss(toast), DURATION);

    /* Fermeture manuelle */
    toast.querySelector('.cd-toast__close')?.addEventListener('click', () => {
      clearTimeout(timer);
      dismiss(toast);
    });

    /* Pause au survol */
    toast.addEventListener('mouseenter', () => {
      clearTimeout(timer);
      if (progress) { progress.style.animationPlayState = 'paused'; }
    });

    return toast;
  }

  function dismiss(toast) {
    toast.classList.remove('cd-toast--visible');
    toast.classList.add('cd-toast--leaving');
    setTimeout(() => toast.remove(), ANIM_OUT);
  }

  /* ── API publique ───────────────────────────────────────────── */
  function cdToast(title, type, sub) { return show(title, type, sub); }
  cdToast.success = (title, sub) => show(title, 'success', sub);
  cdToast.error   = (title, sub) => show(title, 'error',   sub);
  cdToast.warning = (title, sub) => show(title, 'warning', sub);
  cdToast.info    = (title, sub) => show(title, 'info',    sub);

  /* ── Exposer globalement + compatibilité anciens systèmes ───── */
  window.cdToast        = cdToast;
  window._cdToast       = (msg, type) => show(msg, type);
  window.showToast      = (msg, type) => show(msg, type);
  window.showNotification = (msg, type) => show(msg, type === 'info' ? 'info' : type);

})();
