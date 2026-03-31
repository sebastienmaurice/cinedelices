/**
 * Teardown global — Ciné Délices E2E
 *
 * Exécuté après tous les tests du projet 'chromium'.
 * Supprime les utilisateurs fantômes créés par les runs Playwright
 * (pseudo correspondant à testpw*, alice*, bobui* + timestamp).
 *
 * Ne touche JAMAIS aux comptes réels (pipou, Seb le Fourbe, etc.).
 */

import { test as teardown } from '@playwright/test';
import { cleanupTestUsers } from '../helpers/db.helper';

teardown('supprimer les utilisateurs de test E2E', async () => {
  const count = await cleanupTestUsers();
  console.log(`✓ Teardown : ${count} utilisateur(s) de test supprimé(s)`);
});
