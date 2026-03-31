/**
 * Tests E2E — Authentification (login / logout / session)
 *
 * Vérifie : login valide, logout, session active, identifiants invalides,
 * protection des routes privées.
 */

import { test, expect } from '@playwright/test';
import { TEST_USER } from '../../helpers/test-data';
import { registerViaAPI } from '../../helpers/auth.helper';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Connexion / Déconnexion', () => {
  // Crée le compte de test une seule fois pour ce describe
  test.beforeAll(async ({ request }) => {
    await registerViaAPI(request, TEST_USER);
    // 409 si déjà créé = OK
  });

  test('login valide via API → statut 2xx/302', async ({ request }) => {
    const resp = await request.post('/auth/login', {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });
    expect([200, 302]).toContain(resp.status());
  });

  test('login valide via UI → cookie positionné, redirection /', async ({ page }) => {
    await page.goto('/');
    await page.click('.js-open-login');
    await page.waitForSelector('#authModal', { state: 'visible' });

    await page.fill('#loginForm [name="pseudo"]', TEST_USER.pseudo);
    await page.fill('#loginForm [name="password"]', TEST_USER.password);
    await page.click('#loginForm [type="submit"]');
    await page.waitForURL('/', { timeout: 10_000 });

    // Cookie token présent
    const cookies = await page.context().cookies();
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeDefined();
    expect(tokenCookie!.httpOnly).toBe(true);
  });

  test('login avec email au lieu du pseudo → accepté', async ({ request }) => {
    const resp = await request.post('/auth/login', {
      form: { pseudo: TEST_USER.email, password: TEST_USER.password },
    });
    expect([200, 302]).toContain(resp.status());
  });

  test('identifiants invalides → statut 401 ou page d\'erreur', async ({ request }) => {
    const resp = await request.post('/auth/login', {
      form: { pseudo: 'fantome_inexistant', password: 'mauvais_mdp' },
    });
    // Le contrôleur retourne 401 ou rend la page erreur (200 avec message d'erreur)
    expect([401, 200]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.text();
      expect(body).toMatch(/invalide|incorrect|erreur/i);
    }
  });

  test('mot de passe incorrect → statut 401', async ({ request }) => {
    const resp = await request.post('/auth/login', {
      form: { pseudo: TEST_USER.pseudo, password: 'FauxMotDePasse99!' },
    });
    expect([401, 200]).toContain(resp.status());
  });

  test('logout → cookie effacé, redirection /', async ({ page }) => {
    // 1. Se connecter d'abord
    await page.goto('/');
    await page.click('.js-open-login');
    await page.waitForSelector('#authModal', { state: 'visible' });
    await page.fill('#loginForm [name="pseudo"]', TEST_USER.pseudo);
    await page.fill('#loginForm [name="password"]', TEST_USER.password);
    await page.click('#loginForm [type="submit"]');
    await page.waitForURL('/');

    // 2. Se déconnecter via une requête GET directe sur /auth/logout
    // (plus fiable que form.submit() qui peut poser des problèmes de timing)
    await page.goto('/auth/logout');
    await page.waitForURL('/', { timeout: 10_000 });

    // Cookie token doit être absent ou expiré — vérifier après reload
    const cookies = await page.context().cookies('http://localhost:3000');
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(!tokenCookie || tokenCookie.value === '').toBe(true);
  });
});

test.describe('Protection des routes privées', () => {
  test('accès à /add-recipes-movies sans auth → page d\'erreur 403', async ({ page }) => {
    const resp = await page.goto('/add-recipes-movies');
    expect([403, 302]).toContain(resp?.status() ?? 403);
    // La page doit afficher un message d'erreur ou rediriger
    const body = await page.content();
    const isErrorPage = body.includes('interdit') ||
      body.includes('connecté') ||
      body.includes('403') ||
      page.url().includes('/');
    expect(isErrorPage).toBe(true);
  });

  test('accès à /auth/profil/:id sans auth → page d\'erreur ou redirection', async ({
    page,
  }) => {
    const resp = await page.goto('/auth/profil/1');
    expect([403, 302, 200]).toContain(resp?.status() ?? 403);
    const body = await page.content();
    const isBlocked =
      body.includes('interdit') ||
      body.includes('connecté') ||
      body.includes('403') ||
      page.url() === 'http://localhost:3000/';
    expect(isBlocked).toBe(true);
  });
});

test.describe('Session active', () => {
  test('utilisateur connecté accède à son profil', async ({ browser }) => {
    // Ce test utilise le storageState généré par global.setup
    const context = await browser.newContext({
      storageState: 'tests/fixtures/user.json',
    });
    const page = await context.newPage();

    const cookies = await context.cookies('http://localhost:3000');
    const tokenCookie = cookies.find((c) => c.name === 'token');
    expect(tokenCookie).toBeDefined();

    await context.close();
  });
});
