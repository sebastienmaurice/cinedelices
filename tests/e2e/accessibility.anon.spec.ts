/**
 * accessibility.anon.spec.ts — Audit WCAG via axe-core
 * Lance : npx playwright test accessibility --project=anonymous
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { name: 'Accueil',          url: '/' },
  { name: 'Films',            url: '/movies' },
  { name: 'Recettes',         url: '/recipes-movie' },
  { name: 'Contact',          url: '/contact-about' },
  { name: 'Mentions légales', url: '/mentions-legales' },
];

for (const { name, url } of PAGES) {
  test(`Accessibilité WCAG AA — ${name} (${url})`, async ({ page }) => {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Ferme la bannière cookies si présente
    const acceptBtn = page.locator('#cookie-banner button').first();
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('#cookie-banner')      // géré séparément
      .analyze();

    // Affiche le détail des violations
    if (results.violations.length > 0) {
      console.log(`\n❌ ${name} — ${results.violations.length} violation(s) :`);
      for (const v of results.violations) {
        console.log(`  [${v.impact?.toUpperCase()}] ${v.id}: ${v.description}`);
        for (const node of v.nodes.slice(0, 3)) {
          console.log(`    → ${node.target}`);
        }
      }
    } else {
      console.log(`\n✅ ${name} — Aucune violation WCAG AA`);
    }

    // Le test échoue uniquement sur les violations critiques
    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical, `Violations critiques sur ${name}`).toHaveLength(0);
  });
}
