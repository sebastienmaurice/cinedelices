/**
 * Setup global — Ciné Délices E2E
 *
 * Crée un compte utilisateur de test et sauvegarde son état d'authentification
 * (cookie JWT) dans tests/fixtures/user.json.
 * Ce fichier est lu par tous les tests du projet 'chromium'.
 */

import { test as setup, expect } from '@playwright/test';
import { TEST_USER } from '../helpers/test-data';
import { registerViaAPI } from '../helpers/auth.helper';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures');
const USER_STATE_FILE = path.join(FIXTURES_DIR, 'user.json');

setup('create test user and save auth state', async ({ request, browser }) => {
  // S'assurer que le dossier fixtures existe
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  // Créer le compte via l'API
  const response = await registerViaAPI(request, TEST_USER);

  // 200 ou 201 = succès, 409 = pseudo déjà pris (compte existe déjà)
  expect([200, 201, 302, 409]).toContain(response.status());

  // Si le compte existe déjà, on procède quand même — on va juste se connecter
  // Créer un contexte navigateur propre pour récupérer le cookie
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('/');

  // Tenter l'inscription via UI pour récupérer le cookie
  // Si le pseudo existe déjà (setup re-exécuté), se connecter à la place
  if (response.status() === 409) {
    // Connexion
    const loginResp = await request.post('/auth/login', {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });
    expect([200, 302]).toContain(loginResp.status());
  }

  // Ré-authentifier dans le contexte navigateur pour capturer le cookie
  await page.goto('/');
  await page.click('.js-open-login');
  await page.waitForSelector('#authModal', { state: 'visible' });
  await page.fill('#loginForm [name="pseudo"]', TEST_USER.pseudo);
  await page.fill('#loginForm [name="password"]', TEST_USER.password);
  await page.click('#loginForm [type="submit"]');
  await page.waitForURL('/');

  // Sauvegarder l'état (cookies + localStorage)
  await context.storageState({ path: USER_STATE_FILE });
  console.log(`✓ Auth state saved → ${USER_STATE_FILE}`);
  console.log(`✓ Test user: ${TEST_USER.pseudo} / ${TEST_USER.email}`);

  await context.close();
});
