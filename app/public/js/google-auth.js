/**
 * google-auth.js
 * Gère le flux Google Identity Services (GSI) côté client.
 *
 * Deux flux coexistent :
 *  - One Tap (auto-prompt) : google.accounts.id — pour la suggestion automatique
 *  - Popup bouton          : google.accounts.oauth2.initCodeClient — pour les clics bouton
 *    → plus fiable car Chrome ne peut pas le supprimer silencieusement
 */

(function () {
  'use strict';

  /* ── Éléments du modal ──────────────────────────────────────── */
  const googlePseudoForm   = document.getElementById('googlePseudoForm');
  const googlePseudoInput  = document.getElementById('googlePseudoInput');
  const googlePseudoSubmit = document.getElementById('googlePseudoSubmit');
  const googlePseudoError  = document.getElementById('googlePseudoError');
  const googlePseudoBack   = document.getElementById('googlePseudoBack');

  let pendingCredential = null; // One Tap flow
  let pendingTempToken  = null; // Code flow (server-issued temp JWT)
  let pendingGoogleData = null;

  /* ── Afficher l'étape "choisir un pseudo" ───────────────────── */
  function showPseudoStep(tokenOrCredential, googleData, isCodeFlow) {
    if (isCodeFlow) {
      pendingTempToken  = tokenOrCredential;
      pendingCredential = null;
    } else {
      pendingCredential = tokenOrCredential;
      pendingTempToken  = null;
    }
    pendingGoogleData = googleData;

    document.getElementById('loginForm')?.classList.remove('active');
    document.getElementById('registerForm')?.classList.remove('active');
    if (googlePseudoForm) {
      googlePseudoForm.classList.add('active');
      if (googlePseudoInput && googleData.suggestedPseudo) {
        googlePseudoInput.value = googleData.suggestedPseudo + '_';
      }
      googlePseudoInput?.focus();
    }
    if (typeof openModal === 'function') openModal('login');
  }

  /* ── Callback One Tap (google.accounts.id) ──────────────────── */
  async function handleGoogleCredential(response) {
    const credential = response.credential;
    try {
      const res = await fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();

      if (data.status === 'ok') { window.location.reload(); return; }
      if (data.status === 'pseudo_required') {
        showPseudoStep(credential, data.googleData, false);
        return;
      }
      alert(data.error || 'Erreur lors de la connexion Google.');
    } catch (err) {
      console.error('Google One Tap error:', err);
      alert('Erreur réseau. Vérifiez votre connexion.');
    }
  }

  window.handleGoogleCredential = handleGoogleCredential;

  /* ── Callback Code Flow (popup bouton) ──────────────────────── */
  async function handleGoogleCode(response) {
    if (response.error) {
      console.error('Google popup error:', response.error);
      return;
    }
    try {
      const res = await fetch('/auth/google/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: response.code }),
      });
      const data = await res.json();

      if (data.status === 'ok') { window.location.reload(); return; }
      if (data.status === 'pseudo_required') {
        showPseudoStep(data.tempToken, data.googleData, true);
        return;
      }
      alert(data.error || 'Erreur lors de la connexion Google.');
    } catch (err) {
      console.error('Google code flow error:', err);
      alert('Erreur réseau. Vérifiez votre connexion.');
    }
  }

  /* ── Initialiser GSI ────────────────────────────────────────── */
  function initGSI() {
    const clientId = document.querySelector('meta[name="google-client-id"]')?.content;
    if (!clientId) return;

    /* One Tap — suggestion automatique */
    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleCredential,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    /* Code flow — redirect vers le serveur (plus fiable que popup/postMessage) */
    window._googleCodeClient = google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: 'openid email profile',
      ux_mode: 'redirect',
      redirect_uri: window.location.origin + '/auth/google/callback',
    });
  }

  if (typeof google !== 'undefined' && google.accounts) {
    initGSI();
  } else {
    window.onGoogleLibraryLoad = initGSI;
  }

  /* ── Clic sur n'importe quel bouton Google (modal + burger) ── */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.js-google-signin, .js-google-auth');
    if (!btn) return;
    e.preventDefault();

    /* Fermer le burger si ouvert */
    const drawer = document.getElementById('mobileDrawer');
    if (drawer?.classList.contains('is-open')) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      document.getElementById('navHamburger')?.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    if (typeof google !== 'undefined' && window._googleCodeClient) {
      /* Popup fiable — ne peut pas être supprimée par le navigateur */
      window._googleCodeClient.requestCode();
    } else {
      alert('La connexion Google n\'est pas disponible.\nVérifiez que GOOGLE_CLIENT_ID est configuré dans le .env.');
    }
  });

  /* ── Soumission du pseudo choisi ────────────────────────────── */
  googlePseudoSubmit?.addEventListener('click', async () => {
    const pseudo = (googlePseudoInput?.value || '').trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(pseudo)) {
      if (googlePseudoError) {
        googlePseudoError.textContent = '3 à 20 caractères : lettres minuscules, chiffres, underscore.';
        googlePseudoError.style.display = 'block';
      }
      return;
    }

    if (googlePseudoError) googlePseudoError.style.display = 'none';
    googlePseudoSubmit.disabled = true;
    googlePseudoSubmit.textContent = 'Création…';

    try {
      const body = {
        pseudo,
        first_name: pendingGoogleData?.given_name || '',
        last_name:  pendingGoogleData?.family_name || '',
      };
      /* Code flow → envoyer tempToken ; One Tap → envoyer credential */
      if (pendingTempToken)  body.tempToken  = pendingTempToken;
      if (pendingCredential) body.credential = pendingCredential;

      const res = await fetch('/auth/google/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (data.status === 'ok') { window.location.reload(); return; }

      if (googlePseudoError) {
        googlePseudoError.textContent = data.error || 'Erreur. Réessayez.';
        googlePseudoError.style.display = 'block';
      }
    } catch (err) {
      console.error('Google complete error:', err);
      if (googlePseudoError) {
        googlePseudoError.textContent = 'Erreur réseau. Réessayez.';
        googlePseudoError.style.display = 'block';
      }
    } finally {
      googlePseudoSubmit.disabled = false;
      googlePseudoSubmit.textContent = 'Confirmer';
    }
  });

  /* ── Retour depuis l'étape pseudo ───────────────────────────── */
  googlePseudoBack?.addEventListener('click', () => {
    googlePseudoForm?.classList.remove('active');
    document.getElementById('registerForm')?.classList.add('active');
    pendingCredential = null;
    pendingTempToken  = null;
    pendingGoogleData = null;
  });
})();
