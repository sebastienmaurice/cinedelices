import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Charger .env.test si présent (credentials admin/super_admin)
config({ path: '.env.test', override: false });
// Puis .env pour les variables de base
config({ path: '.env', override: false });

/**
 * Playwright E2E Configuration — Ciné Délices
 *
 * Prérequis : le serveur doit tourner sur http://localhost:3000
 * Lancement : npm run dev (dans un terminal séparé), puis npx playwright test
 *
 * Variables d'environnement optionnelles (.env.test) :
 *   BASE_URL          - URL du serveur (défaut : http://localhost:3000)
 *   TEST_ADMIN_PSEUDO - Pseudo d'un compte admin pour les tests admin
 *   TEST_ADMIN_PASS   - Mot de passe du compte admin
 *   TEST_SUPERADMIN_PSEUDO - Pseudo super_admin
 *   TEST_SUPERADMIN_PASS   - Mot de passe super_admin
 */
export default defineConfig({
  testDir: './tests/e2e',

  /* Exécution séquentielle — la BDD est partagée */
  fullyParallel: false,
  workers: 1,

  /* Pas de retry en local, 2 retries en CI */
  retries: process.env.CI ? 2 : 0,

  /* Interrompt la suite si un test .only est commité en CI */
  forbidOnly: !!process.env.CI,

  /* Reporters */
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',

    /* Captures en cas d'échec */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',

    /* Timeouts */
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  /* Timeout global par test */
  timeout: 30_000,
  expect: { timeout: 8_000 },

  projects: [
    /* ── Setup : crée les états d'auth réutilisables ── */
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    /* ── Tests principaux (Chromium) — user connecté ── */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        /* Réutilise l'état du user de test (créé en setup) */
        storageState: 'tests/fixtures/user.json',
      },
      dependencies: ['setup'],
      teardown: 'teardown',
      /* Exclure les fichiers setup/teardown et ceux réservés au projet anonymous */
      testIgnore: [/.*\.setup\.ts/, /.*\.teardown\.ts/, /.*\.(anon|rbac|security)\.spec\.ts/],
    },

    /* ── Tests anonymes (pas de storageState) ── */
    {
      name: 'anonymous',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.(anon|rbac|security)\.spec\.ts/,
    },

    /* ── Teardown : nettoyage BDD après chromium ── */
    {
      name: 'teardown',
      testMatch: /.*\.teardown\.ts/,
    },
  ],

  /* Dossier pour les artefacts (screenshots, traces, vidéos) */
  outputDir: 'test-results/',
});
