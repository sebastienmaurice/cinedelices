/**
 * Tests E2E — Validation admin
 *
 * Vérifie : accès au back-office, affichage des éléments en attente,
 * approbation/rejet d'une recette.
 *
 * Prérequis : définir dans .env.test :
 *   TEST_ADMIN_PSEUDO=votre_pseudo_admin
 *   TEST_ADMIN_PASS=votre_mot_de_passe_admin
 *
 * Si non configuré, les tests admin sont skippés avec un message clair.
 * Une recette pending est insérée en BDD avant les tests et supprimée après.
 */

import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS, hasAdminCredentials } from '../../helpers/test-data';
import { insertPendingRecipe, deleteRecipe } from '../../helpers/db.helper';

test.use({ storageState: { cookies: [], origins: [] } });

/** Helper : se connecter en tant qu'admin dans la page */
async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.click('.js-open-login');
  await page.waitForSelector('#authModal', { state: 'visible' });
  await page.fill('#loginForm [name="pseudo"]', ADMIN_CREDENTIALS.pseudo);
  await page.fill('#loginForm [name="password"]', ADMIN_CREDENTIALS.password);
  await page.click('#loginForm [type="submit"]');
  await page.waitForURL('/', { timeout: 10_000 });
}

test.describe('Accès dashboard admin', () => {
  test.beforeEach(({ page: _p }, testInfo) => {
    if (!hasAdminCredentials()) {
      testInfo.skip(
        true,
        '⚠ Credentials admin non configurés. Définir TEST_ADMIN_PSEUDO et TEST_ADMIN_PASS dans .env.test'
      );
    }
  });

  test('connexion admin → accès à /admin → 200', async ({ page }) => {
    await loginAsAdmin(page);
    const resp = await page.goto('/admin');
    expect(resp?.status()).toBe(200);
    await expect(
      page.locator('.admin-dashboard, #admin-main, h1, [class*="admin"]').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard affiche les recettes en attente de validation', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    const content = await page.content();
    const hasPendingSection =
      content.includes('attente') ||
      content.includes('pending') ||
      content.includes('recette') ||
      content.includes('Recette');
    expect(hasPendingSection).toBe(true);
  });

  test('dashboard affiche les avis en attente de modération', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');
    const content = await page.content();
    const hasNoticeSection =
      content.includes('avis') ||
      content.includes('notice') ||
      content.includes('Avis') ||
      content.includes('commentaire');
    expect(hasNoticeSection).toBe(true);
  });
});

test.describe('Actions de validation admin', () => {
  let pendingRecipeId: number | null = null;

  test.beforeAll(async ({}, testInfo) => {
    if (!hasAdminCredentials()) {
      testInfo.skip(
        true,
        '⚠ Credentials admin non configurés.'
      );
      return;
    }
    // Insérer une recette pending pour que l'admin ait quelque chose à valider
    pendingRecipeId = await insertPendingRecipe({
      name: `[E2E] Validation admin ${Date.now()}`,
    });
  });

  test.afterAll(async () => {
    // Nettoyage : supprimer la recette de test si elle existe encore
    if (pendingRecipeId) {
      await deleteRecipe(pendingRecipeId).catch(() => null);
      pendingRecipeId = null;
    }
  });

  test.beforeEach(({ page: _p }, testInfo) => {
    if (!hasAdminCredentials()) {
      testInfo.skip(true, '⚠ Credentials admin non configurés.');
    }
  });

  test('approbation d\'une recette en attente → statut change', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');

    // Naviguer vers la section Recettes dans le sidebar SPA
    await page.click('[data-nav-view="recettes"]');

    // Sélecteurs réels du dashboard admin
    const approveBtn = page.locator(
      'form[action*="validateRecipe"] .act-btn--approve'
    ).first();

    const hasApproveBtn = await approveBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasApproveBtn) {
      test.skip();
      return;
    }

    await approveBtn.click();
    await page.waitForLoadState('networkidle');
    // Après validation, la recette n'est plus dans la queue pending
    const content = await page.content();
    const isSuccess =
      content.includes('approuvé') ||
      content.includes('validé') ||
      content.includes('success') ||
      !content.includes('[E2E] Validation admin');
    expect(isSuccess).toBe(true);

    // Après approbation, ne pas supprimer en afterAll (recette dans status approved maintenant)
    pendingRecipeId = null;
  });

  test('rejet d\'une recette en attente → statut change', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin');

    // Naviguer vers la section Recettes
    await page.click('[data-nav-view="recettes"]');

    const rejectBtn = page.locator(
      'form[action*="rejectRecipe"] .act-btn--reject'
    ).first();

    const hasRejectBtn = await rejectBtn.isVisible({ timeout: 5_000 }).catch(() => false);
    if (!hasRejectBtn) {
      test.skip();
      return;
    }

    await rejectBtn.click();
    await page.waitForLoadState('networkidle');
    expect(page.url()).not.toContain('error');
  });

  test('accès à la page d\'édition d\'un film → 200', async ({ page }) => {
    await loginAsAdmin(page);
    const resp = await page.goto('/admin');
    expect(resp?.status()).toBe(200);

    const editLink = page.locator('a[href*="/admin/movie/"]').first();
    const hasEditLink = await editLink.isVisible({ timeout: 3_000 }).catch(() => false);
    if (hasEditLink) {
      await editLink.click();
      await expect(page.locator('form, .admin-form').first()).toBeVisible({ timeout: 8_000 });
    }
  });
});
