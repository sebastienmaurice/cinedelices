/**
 * Données de test — Ciné Délices
 *
 * Chaque exécution génère des identifiants uniques (timestamp) pour éviter
 * les conflits avec des données existantes en base.
 */

const RUN_ID = Date.now();

export const TEST_USER = {
  first_name: 'Test',
  last_name: 'Playwright',
  pseudo: `testpw${RUN_ID}`,
  email: `testpw${RUN_ID}@example.com`,
  password: 'TestPw123!',
};

/** Recette minimale valide pour les tests */
export const TEST_RECIPE = {
  name: `Recette E2E ${RUN_ID}`,
  time: '30',
  category: 'plat',
  difficulty: 'Facile',
  description: 'Recette créée automatiquement par les tests Playwright.',
  ingredients: '200g de pâtes\n1 œuf\nSel et poivre',
  preparation: 'Faire bouillir les pâtes.\nMélanger avec l\'œuf.\nAssaisonner.',
};

/** Credentials admin — lus depuis les variables d'environnement */
export const ADMIN_CREDENTIALS = {
  pseudo: process.env.TEST_ADMIN_PSEUDO ?? '',
  password: process.env.TEST_ADMIN_PASS ?? '',
};

export const SUPERADMIN_CREDENTIALS = {
  pseudo: process.env.TEST_SUPERADMIN_PSEUDO ?? '',
  password: process.env.TEST_SUPERADMIN_PASS ?? '',
};

/** Vérifie si les credentials admin sont configurés */
export function hasAdminCredentials(): boolean {
  return !!(ADMIN_CREDENTIALS.pseudo && ADMIN_CREDENTIALS.password);
}

export function hasSuperAdminCredentials(): boolean {
  return !!(SUPERADMIN_CREDENTIALS.pseudo && SUPERADMIN_CREDENTIALS.password);
}
