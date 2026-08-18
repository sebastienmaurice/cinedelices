/**
 * Helpers d'authentification — Ciné Délices
 *
 * Fonctions réutilisables pour s'authentifier dans les tests Playwright.
 * Utilise l'API directement (sans navigateur) pour être rapide.
 */

import { APIRequestContext, Page, expect } from '@playwright/test';

/**
 * Inscrit un utilisateur via l'API et retourne la réponse.
 */
export async function registerViaAPI(
  request: APIRequestContext,
  user: { first_name: string; last_name: string; pseudo: string; email: string; password: string }
) {
  return request.post('/auth/register', {
    form: {
      first_name: user.first_name,
      last_name: user.last_name,
      pseudo: user.pseudo,
      email: user.email,
      password: user.password,
      rgpd_consent: 'on', // requis côté serveur depuis l'ajout du consentement RGPD
    },
  });
}

/**
 * Authentifie un utilisateur via l'API.
 * Retourne la réponse HTTP (le cookie token est géré par le contexte).
 */
export async function loginViaAPI(
  request: APIRequestContext,
  pseudo: string,
  password: string
) {
  return request.post('/auth/login', {
    form: { pseudo, password },
  });
}

/**
 * Déconnecte l'utilisateur courant via l'API.
 */
export async function logoutViaAPI(request: APIRequestContext) {
  return request.post('/auth/logout');
}

/**
 * Remplit et soumet le formulaire de connexion dans le modal du header.
 * Attend que la page soit redirigée après succès.
 */
export async function loginViaUI(page: Page, pseudo: string, password: string) {
  // Ouvrir le modal de connexion
  await page.click('.js-open-login');
  await page.waitForSelector('#authModal', { state: 'visible' });

  // Remplir le formulaire de connexion
  await page.fill('#loginForm [name="pseudo"]', pseudo);
  await page.fill('#loginForm [name="password"]', password);
  await page.click('#loginForm [type="submit"]');

  // Attendre la redirection vers /
  await page.waitForURL('/');
}

/**
 * Remplit et soumet le formulaire d'inscription dans le modal du header.
 */
export async function registerViaUI(
  page: Page,
  user: { first_name: string; last_name: string; pseudo: string; email: string; password: string }
) {
  // Ouvrir le modal et basculer vers l'inscription
  await page.click('.js-open-register');
  await page.waitForSelector('#authModal', { state: 'visible' });
  await page.waitForSelector('#registerForm', { state: 'visible' });

  await page.fill('#registerForm [name="first_name"]', user.first_name);
  await page.fill('#registerForm [name="last_name"]', user.last_name);
  await page.fill('#registerForm [name="pseudo"]', user.pseudo);
  await page.fill('#registerForm [name="email"]', user.email);
  await page.fill('#registerForm [name="password"]', user.password);
  await page.fill('#registerForm [name="confirm_password"]', user.password);
  await page.click('#registerForm [type="submit"]');

  // Attendre la redirection vers /
  await page.waitForURL('/');
}

/**
 * Vérifie que l'utilisateur est connecté (présence d'un lien profil ou bouton logout).
 */
export async function expectLoggedIn(page: Page) {
  // Le header affiche un menu utilisateur quand on est connecté
  await expect(page.locator('form[action="/auth/logout"], .user-dropdown, [href*="/auth/profil"]'))
    .toBeVisible({ timeout: 8_000 });
}

/**
 * Vérifie que l'utilisateur est déconnecté (présence des boutons de connexion).
 */
export async function expectLoggedOut(page: Page) {
  await expect(page.locator('.js-open-login')).toBeVisible({ timeout: 8_000 });
}
