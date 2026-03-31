/**
 * Helper base de données pour les tests E2E
 *
 * Permet d'insérer et nettoyer des données de test directement en BDD,
 * pour les cas où l'API ne suffit pas (ex : créer une recette pending
 * sans upload Multer).
 *
 * Connexion : lecture depuis PG_URL dans .env
 */

import pkg from 'pg';
const { Client } = pkg;

const PG_URL =
  process.env.PG_URL ?? 'postgresql://cinedelices:cinedelices@localhost:5432/cinedelices';

export async function withDB<T>(fn: (client: pkg.Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: PG_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Insère une recette pending de test en BDD.
 * Retourne son id pour pouvoir la supprimer après le test.
 */
export async function insertPendingRecipe(opts?: {
  name?: string;
  idUser?: number;
  idMovie?: number | null;
}): Promise<number> {
  const name = opts?.name ?? `[E2E] Recette test admin ${Date.now()}`;
  const idUser = opts?.idUser ?? 3; // Seb le Fourbe par défaut
  const idMovie = opts?.idMovie ?? 1; // Harry Potter par défaut

  return withDB(async (client) => {
    const res = await client.query<{ id: number }>(
      `INSERT INTO recipes
        (name, description, category, difficulty, time, ingredients, preparation, status, id_user, id_movie)
       VALUES
        ($1, 'Recette insérée par les tests E2E Playwright.', 'plat', 'Facile', 30,
         '200g de pâtes, 1 œuf, sel', 'Cuire les pâtes. Mélanger. Servir.', 'pending', $2, $3)
       RETURNING id`,
      [name, idUser, idMovie]
    );
    return res.rows[0].id;
  });
}

/**
 * Supprime une recette par son id (nettoyage post-test).
 */
export async function deleteRecipe(id: number): Promise<void> {
  await withDB(async (client) => {
    await client.query('DELETE FROM recipes WHERE id = $1', [id]);
  });
}

/**
 * Supprime tous les utilisateurs de test (pseudo testpw*, alice*, bobui*).
 * À appeler dans un teardown global — ne touche pas aux comptes réels.
 */
export async function cleanupTestUsers(): Promise<number> {
  return withDB(async (client) => {
    const res = await client.query<{ count: string }>(
      `DELETE FROM users
       WHERE pseudo ~ '^(testpw|alice|bobui)[0-9]+'
       RETURNING id`
    );
    return res.rowCount ?? 0;
  });
}
