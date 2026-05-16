/**
 * gamification.js — Ciné Délices
 * - Équiper un cadre via l'API POST /auth/equip-frame
 * - Mise à jour temps réel : hero profil, nav badge, footer widget
 * - Toast notifications
 */

/* ═══════════════════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════════════════ */
/* Toast → délégué à cd-toast.js (window._cdToast est déjà défini) */

/* ═══════════════════════════════════════════════════════════════
   HERO — helpers rebuild (utilisés aussi par le handler equip)
═══════════════════════════════════════════════════════════════ */
const ANIMATED_FRAMES = ['sherlock', 'matrix', 'indiana', 'harry'];

function _buildHero(heroEl, frameCode, frameUrl, photoSrc) {
  // Détruire le moteur animé existant si présent
  if (heroEl._badgeEngine) {
    heroEl._badgeEngine.destroy();
    heroEl._badgeEngine = null;
  }
  if (heroEl._badgeEngineInner) {
    heroEl._badgeEngineInner.remove();
    heroEl._badgeEngineInner = null;
  }

  // Retirer les éléments statiques
  heroEl.querySelector('#pbhPhoto')?.remove();
  heroEl.querySelector('.pbh-frame')?.remove();
  heroEl.querySelector('.pbh-ring')?.remove();

  const actions = heroEl.querySelector('.avatar-actions');

  if (ANIMATED_FRAMES.includes(frameCode) && window.BadgeEngine) {
    // Cadre animé
    const inner = document.createElement('div');
    inner.style.cssText = 'position:absolute;inset:0;width:260px;height:260px;overflow:visible;';
    heroEl.insertBefore(inner, actions || null);
    heroEl._badgeEngine      = new window.BadgeEngine(inner, frameCode, photoSrc);
    heroEl._badgeEngineInner = inner;
  } else {
    // Cadre statique : photo + PNG overlay
    const photo = document.createElement('img');
    photo.id        = 'pbhPhoto';
    photo.className = 'pbh-photo';
    photo.src       = photoSrc;
    photo.alt       = '';
    heroEl.insertBefore(photo, actions || null);

    if (frameUrl) {
      const fr = document.createElement('img');
      fr.className = 'pbh-frame';
      fr.src       = frameUrl;
      fr.alt       = '';
      fr.setAttribute('aria-hidden', 'true');
      heroEl.insertBefore(fr, actions || null);
    } else {
      const ring = document.createElement('div');
      ring.className = 'pbh-ring';
      heroEl.insertBefore(ring, actions || null);
    }
  }

  heroEl.dataset.frameCode = frameCode;
}

/* ═══════════════════════════════════════════════════════════════
   EQUIP FRAME — POST /auth/equip-frame + mise à jour temps réel
═══════════════════════════════════════════════════════════════ */
(function () {
  const framesList = document.getElementById('contrib-frames-list');
  if (!framesList) return;

  // Clone pour retirer les anciens listeners
  const newList = framesList.cloneNode(true);
  framesList.parentNode.replaceChild(newList, framesList);

  newList.addEventListener('click', function (e) {
    const row = e.target.closest('.frame-row');
    if (!row) return;
    if (row.dataset.unlocked !== 'true') {
      window._cdToast('Ce cadre est verrouillé pour votre niveau.', 'error');
      return;
    }
    if (row.classList.contains('frame-row--active')) return;

    const frameCode = row.dataset.frameId;

    fetch('/auth/equip-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frameCode }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) { window._cdToast(data.error, 'error'); return; }

        // ── 1. Mise à jour liste cadres ──────────────────────────
        newList.querySelectorAll('.frame-row--active').forEach(r => r.classList.remove('frame-row--active'));
        row.classList.add('frame-row--active');
        newList.querySelectorAll('.frame-row-check').forEach(c => {
          c.classList.remove('frame-row-check--active');
          if (!c.closest('.frame-row--locked')) c.classList.add('frame-row-check--ok');
        });
        row.querySelector('.frame-row-check')?.classList.replace('frame-row-check--ok', 'frame-row-check--active');

        // Ancien pill bento (.ctb-frame-tile__status)
        newList.querySelectorAll('.ctb-frame-tile__status').forEach(p => {
          if (p.classList.contains('is-locked')) return;
          p.classList.remove('is-active'); p.classList.add('is-ready');
          p.innerHTML = '<span>Équiper</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
        });
        const pill = row.querySelector('.ctb-frame-tile__status');
        if (pill) {
          pill.classList.remove('is-ready', 'is-locked'); pill.classList.add('is-active');
          pill.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg><span>Équipé</span>';
        }

        // ── 1b. Mise à jour nouveaux cf-card (design premium) ─────
        newList.querySelectorAll('.cf-card').forEach(card => {
          // Retirer état actif de toutes les cartes
          card.classList.remove('cf-card--active');
          // Supprimer pill "ACTUEL"
          card.querySelector('.cf-card__actuel')?.remove();
          // Remettre le bouton en "ÉQUIPER" si non verrouillé
          const btn = card.querySelector('.cf-card__btn--equipped');
          if (btn) {
            btn.className = 'cf-card__btn cf-card__btn--equip frame-row-check frame-row-check--ok account-edit-btn';
            btn.innerHTML = 'Équiper <i data-lucide="arrow-right" width="13" height="13" aria-hidden="true"></i>';
            if (window.lucide) window.lucide.createIcons({ nodes: [btn] });
          }
          // Remettre le nom en couleur normale
          const name = card.querySelector('.cf-card__name');
          if (name) name.style.color = '';
        });
        // Activer la carte cliquée
        const cfCard = row.classList.contains('cf-card') ? row : row.closest('.cf-card');
        if (cfCard) {
          cfCard.classList.add('cf-card--active');
          // Ajouter pill "ACTUEL"
          const actuelPill = document.createElement('div');
          actuelPill.className = 'cf-card__actuel';
          actuelPill.textContent = 'Actuel';
          cfCard.prepend(actuelPill);
          // Passer le bouton en "ÉQUIPÉ"
          const activeBtn = cfCard.querySelector('.cf-card__btn');
          if (activeBtn) {
            activeBtn.className = 'cf-card__btn cf-card__btn--equipped frame-row-check frame-row-check--active';
            activeBtn.innerHTML = '<i data-lucide="check" width="13" height="13" aria-hidden="true"></i> Équipé';
            if (window.lucide) window.lucide.createIcons({ nodes: [activeBtn] });
          }
        }
        // Widget "Cadre actif" dans la sidebar contributions
        const activePreview = document.querySelector('.active-frame-body .active-frame-preview');
        if (activePreview) {
          const existingFrame = activePreview.querySelector('.bsf');
          if (data.activeFrameUrl) {
            activePreview.classList.remove('active-frame-preview--noframe');
            if (existingFrame) {
              existingFrame.src = data.activeFrameUrl;
            } else {
              const fr = document.createElement('img');
              fr.className = 'bsf';
              fr.src = data.activeFrameUrl;
              fr.alt = '';
              activePreview.appendChild(fr);
            }
          } else {
            existingFrame?.remove();
            activePreview.classList.add('active-frame-preview--noframe');
          }
        }

        // ── 1b. Mise à jour active-frame-meta ────────────────────
        const metaName  = document.querySelector('.active-frame-meta .active-frame-name');
        const metaTheme = document.querySelector('.active-frame-meta .active-frame-theme');
        const metaPill  = document.querySelector('.active-frame-meta .active-frame-pill');
        if (metaName || metaTheme || metaPill) {
          const rowLabel = row.querySelector('.frame-row-name')?.textContent?.trim() || '';
          const rowSub   = row.querySelector('.frame-row-sub')?.textContent?.trim() || '';
          const subParts = rowSub.split(' · niv. ');
          const theme = subParts[0] || '';
          const lvl   = subParts[1] || '';
          if (metaName)  metaName.textContent  = rowLabel;
          if (metaTheme) metaTheme.textContent = theme;
          if (metaPill)  metaPill.textContent  = `✓ Débloqué · Niv. ${lvl}`;
        }

        // ── 2. Hero profil (avatar-block) ────────────────────────
        const heroEl  = document.getElementById('profileBadgeHero');
        if (heroEl) {
          const photoSrc = heroEl.dataset.photoSrc || '';
          _buildHero(heroEl, frameCode, data.activeFrameUrl, photoSrc);
        }

        // ── 3. Nav badge ─────────────────────────────────────────
        const navTrigger = document.getElementById('userDropdownTrigger');
        let   navBadge   = navTrigger?.querySelector('.nav-badge-static');
        let   navFrame   = navTrigger?.querySelector('.nav-badge-static__frame');
        const avatarSrc  = navTrigger?.dataset.navAvatar || '/images/image-default-profile.jpg';

        if (!navBadge && navTrigger) {
          // SVG générique affiché → construire le badge avec la photo
          navTrigger.innerHTML = `<div class="nav-badge-static" aria-hidden="true"><img class="nav-badge-static__photo" src="${avatarSrc}" alt="" /></div>`;
          navBadge = navTrigger.querySelector('.nav-badge-static');
          navFrame = null;
        }

        if (data.activeFrameUrl) {
          if (navFrame) {
            navFrame.src = data.activeFrameUrl;
            navFrame.style.display = '';
          } else if (navBadge) {
            const fr = document.createElement('img');
            fr.className = 'nav-badge-static__frame';
            fr.src = data.activeFrameUrl;
            fr.alt = '';
            navBadge.appendChild(fr);
          }
        } else {
          // "Sans cadre" — retirer l'overlay frame s'il existe
          navFrame?.remove();
        }

        // ── 4. Footer widget — ligne de l'utilisateur courant ────
        const currentUserId = document.querySelector('main[data-user-id]')?.dataset.userId;
        if (currentUserId && data.activeFrameUrl) {
          const contribRow = document.querySelector(`[data-contrib-user-id="${currentUserId}"]`);
          if (contribRow) {
            const contribFrame = contribRow.querySelectorAll('img')[1]; // 2e img = frame
            if (contribFrame) contribFrame.src = data.activeFrameUrl;
          }
        }

        window._cdToast('Cadre équipé !', 'success');
      })
      .catch(() => window._cdToast('Erreur réseau, réessayez.', 'error'));
  });
})();

/* ═══════════════════════════════════════════════════════════════
   HERO BADGE — init au chargement de la page
═══════════════════════════════════════════════════════════════ */
(function () {
  const heroEl = document.getElementById('profileBadgeHero');
  if (!heroEl || typeof window.BadgeEngine === 'undefined') return;

  const frameCode = heroEl.dataset.frameCode || 'cine';
  if (!ANIMATED_FRAMES.includes(frameCode)) return;

  const photoSrc = heroEl.dataset.photoSrc || '';

  // Retirer les éléments statiques rendus côté serveur
  heroEl.querySelector('#pbhPhoto')?.remove();
  heroEl.querySelector('.pbh-frame')?.remove();
  heroEl.querySelector('.pbh-ring')?.remove();

  const inner = document.createElement('div');
  inner.style.cssText = 'position:absolute;inset:0;width:260px;height:260px;overflow:visible;';
  const actions = heroEl.querySelector('.avatar-actions');
  heroEl.insertBefore(inner, actions || null);

  heroEl._badgeEngine      = new window.BadgeEngine(inner, frameCode, photoSrc);
  heroEl._badgeEngineInner = inner;
})();

/* frame-rows : PNG statique uniquement, pas d'animation canvas en dessous de 80px */
