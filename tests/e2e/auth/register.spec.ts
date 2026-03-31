/**
 * Tests E2E — Inscription utilisateur
 *
 * Vérifie : création de compte, validation des champs,
 * redirection après inscription, unicité du pseudo/email.
 */

import { test, expect } from '@playwright/test';
import { registerViaAPI } from '../../helpers/auth.helper';

// Ces tests s'exécutent sans état d'auth (storageState du projet chromium est ignoré
// car on teste l'inscription de nouveaux comptes)
test.use({ storageState: { cookies: [], origins: [] } });

const RUN = Date.now();

test.describe('Inscription utilisateur', () => {
  const newUser = {
    first_name: 'Alice',
    last_name: 'Playwright',
    pseudo: `alice${RUN}`,
    email: `alice${RUN}@example.com`,
    password: 'Alice123!',
  };

  test('création de compte valide via API → statut 2xx/302 et redirection /', async ({
    request,
  }) => {
    const resp = await registerViaAPI(request, newUser);
    // Express répond 302 (redirect) ou 201
    expect([200, 201, 302]).toContain(resp.status());
    // La réponse finale (après redirect) doit être la page d'accueil
    expect(resp.url()).toMatch(/localhost:3000\/?$/);
  });

  test('tentative de double inscription avec le même pseudo → 409', async ({
    request,
  }) => {
    // Créer d'abord le compte
    await registerViaAPI(request, newUser);
    // Re-tenter avec le même pseudo
    const resp = await registerViaAPI(request, newUser);
    expect(resp.status()).toBe(409);
  });

  test('inscription via UI → redirection vers / et session active', async ({ page }) => {
    const uiUser = {
      first_name: 'Bob',
      last_name: 'UI',
      pseudo: `bobui${RUN}`,
      email: `bobui${RUN}@example.com`,
      password: 'BobUi123!',
    };

    await page.goto('/');

    // .js-open-register peut être dans le dropdown — on passe par le modal login → goToRegister
    await page.click('.js-open-login');
    await page.waitForSelector('#authModal', { state: 'visible' });
    await page.click('#goToRegister');
    await page.waitForSelector('#registerForm', { state: 'visible' });

    await page.fill('#registerForm [name="first_name"]', uiUser.first_name);
    await page.fill('#registerForm [name="last_name"]', uiUser.last_name);
    await page.fill('#registerForm [name="pseudo"]', uiUser.pseudo);
    await page.fill('#registerForm [name="email"]', uiUser.email);
    await page.fill('#registerForm [name="password"]', uiUser.password);
    await page.fill('#registerForm [name="confirm_password"]', uiUser.password);
    await page.click('#registerForm [type="submit"]');

    // Doit rediriger vers /
    await page.waitForURL('/', { timeout: 10_000 });
    expect(page.url()).toMatch(/localhost:3000\/?$/);

    // L'utilisateur est connecté : le dropdown utilisateur est visible
    await expect(
      page.locator('.user-dropdown, [data-user-menu]').first()
    ).toBeVisible({ timeout: 8_000 });
  });

  test('mots de passe non conformes → erreur côté client', async ({ page }) => {
    await page.goto('/');
    await page.click('.js-open-login');
    await page.waitForSelector('#authModal', { state: 'visible' });
    await page.click('#goToRegister');
    await page.waitForSelector('#registerForm', { state: 'visible' });

    await page.fill('#registerForm [name="first_name"]', 'Test');
    await page.fill('#registerForm [name="last_name"]', 'Fail');
    await page.fill('#registerForm [name="pseudo"]', `fail_${RUN}`);
    await page.fill('#registerForm [name="email"]', `fail.${RUN}@test.com`);
    await page.fill('#registerForm [name="password"]', 'password123!');
    // Confirm password différent
    await page.fill('#registerForm [name="confirm_password"]', 'mismatch');
    await page.click('#registerForm [type="submit"]');

    // Le JS doit afficher #errorMessage
    // Note : confirm_password est une validation client-side uniquement
    await expect(page.locator('#errorMessage')).toBeVisible({ timeout: 5_000 });
  });

  test('champs obligatoires manquants → le formulaire reste ouvert', async ({ page }) => {
    await page.goto('/');
    await page.click('.js-open-login');
    await page.waitForSelector('#authModal', { state: 'visible' });
    await page.click('#goToRegister');
    await page.waitForSelector('#registerForm', { state: 'visible' });

    // Soumettre sans rien remplir — le navigateur arrête sur le premier champ requis
    await page.click('#registerForm [type="submit"]');

    // Le modal doit rester ouvert (aucune navigation)
    await expect(page.locator('#registerForm')).toBeVisible();
  });
});
