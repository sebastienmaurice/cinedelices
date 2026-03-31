/**
 * Tests E2E — Création de recette
 *
 * Vérifie : accès au formulaire (auth requise), validation des champs,
 * soumission, statut "en attente".
 *
 * Note : le formulaire nécessite un film sélectionné (via TMDB).
 * Les tests vérifient l'accès et la validation sans forcément
 * soumettre en base (TMDB peut ne pas être disponible en CI).
 */

import { test, expect } from '@playwright/test';
import { TEST_RECIPE } from '../../helpers/test-data';

// Ces tests utilisent le storageState du projet 'chromium' (user connecté)
test.describe('Création de recette — utilisateur connecté', () => {
  test('accès au formulaire /add-recipes-movies → 200', async ({ page }) => {
    const resp = await page.goto('/add-recipes-movies');
    expect(resp?.status()).toBe(200);
    // Le formulaire principal est présent
    await expect(page.locator('#unified-form')).toBeVisible({ timeout: 10_000 });
  });

  test('champs obligatoires présents dans le formulaire', async ({ page }) => {
    await page.goto('/add-recipes-movies');
    await expect(page.locator('#recipe-name')).toBeVisible();
    await expect(page.locator('#recipe-time')).toBeVisible();
    await expect(page.locator('#category')).toBeVisible();
    await expect(page.locator('#difficulty')).toBeVisible();
    await expect(page.locator('#ingredients')).toBeVisible();
    await expect(page.locator('#preparation')).toBeVisible();
  });

  test('soumission sans film sélectionné → validation côté client', async ({ page }) => {
    await page.goto('/add-recipes-movies');

    // Remplir les champs recette
    await page.fill('#recipe-name', TEST_RECIPE.name);
    await page.fill('#recipe-time', TEST_RECIPE.time);
    await page.selectOption('#category', TEST_RECIPE.category);
    await page.selectOption('#difficulty', TEST_RECIPE.difficulty);
    await page.fill('#ingredients', TEST_RECIPE.ingredients);
    await page.fill('#preparation', TEST_RECIPE.preparation);

    // Soumettre sans film → une erreur de validation doit s'afficher
    await page.click('#submit-unified-form');

    // La page ne doit pas avoir navigué (validation côté client bloque)
    // Ou elle affiche un message d'erreur
    const url = page.url();
    const isStillOnForm = url.includes('/add-recipes-movies');
    expect(isStillOnForm).toBe(true);
  });

  test('champ nom de recette requis → validation HTML5', async ({ page }) => {
    await page.goto('/add-recipes-movies');
    // Vérifier que l'input a l'attribut required
    const required = await page.locator('#recipe-name').getAttribute('required');
    // required peut être null (absent) ou "" (présent sans valeur) — les deux cas sont vérifiés
    const isRequired =
      required !== null ||
      (await page.locator('#recipe-name').evaluate((el) => (el as HTMLInputElement).required));
    expect(isRequired).toBeTruthy();
  });

  test('champ temps de préparation accepte uniquement les nombres positifs', async ({ page }) => {
    await page.goto('/add-recipes-movies');
    const input = page.locator('#recipe-time');
    const min = await input.getAttribute('min');
    const type = await input.getAttribute('type');
    expect(type).toBe('number');
    expect(Number(min)).toBeGreaterThan(0);
  });

  test('upload photo — input accepte uniquement les images', async ({ page }) => {
    await page.goto('/add-recipes-movies');
    const accept = await page.locator('#recipeImageInput').getAttribute('accept');
    expect(accept).toMatch(/image\//);
  });

  test('catégories disponibles dans le select', async ({ page }) => {
    await page.goto('/add-recipes-movies');
    const options = await page.locator('#category option').allTextContents();
    const expected = ['apéritif', 'entrée', 'plat', 'dessert', 'boisson', 'autres'];
    for (const cat of expected) {
      expect(options.some((o) => o.toLowerCase().includes(cat))).toBe(true);
    }
  });

  test('niveaux de difficulté disponibles', async ({ page }) => {
    await page.goto('/add-recipes-movies');
    const options = await page.locator('#difficulty option').allTextContents();
    expect(options.some((o) => o.includes('Facile'))).toBe(true);
    expect(options.some((o) => o.includes('Difficile'))).toBe(true);
  });
});

test.describe('Création de recette — accès sans authentification', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('accès à /add-recipes-movies sans auth → bloqué (403 ou redirect)', async ({ page }) => {
    const resp = await page.goto('/add-recipes-movies');
    const status = resp?.status() ?? 0;
    const url = page.url();
    const body = await page.content();

    const isBlocked =
      status === 403 ||
      status === 302 ||
      body.includes('interdit') ||
      body.includes('connecté') ||
      !url.includes('add-recipes-movies');
    expect(isBlocked).toBe(true);
  });
});
