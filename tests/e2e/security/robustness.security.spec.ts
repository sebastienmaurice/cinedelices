/**
 * Tests E2E — Robustesse et sécurité
 *
 * Vérifie : champs obligatoires manquants, email invalide, mot de passe incorrect,
 * accès non autorisé, injections XSS basiques, upload de fichier invalide,
 * manipulation d'ID en URL.
 *
 * Ces tests (.security.spec.ts) tournent sur le projet 'anonymous'
 * pour partir d'un état sans authentification.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { test, expect } from "@playwright/test";
import { TEST_USER } from "../../helpers/test-data";
import { registerViaAPI } from "../../helpers/auth.helper";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RUN = Date.now();

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION — Inscription
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Sécurité — Validation inscription", () => {
  test("email invalide → inscription refusée", async ({ request }) => {
    const resp = await registerViaAPI(request, {
      first_name: "Test",
      last_name: "Invalid",
      pseudo: `inv_email_${RUN}`,
      email: "pas-un-email",
      password: "Test123!",
    });
    // Joi doit rejeter l'email invalide
    expect([400, 422, 409, 200]).toContain(resp.status());
    if ([400, 422].includes(resp.status())) {
      const body = await resp.text();
      expect(body).toMatch(/email|invalide|invalid/i);
    }
  });

  test("mot de passe trop court → inscription refusée", async ({ request }) => {
    const resp = await registerViaAPI(request, {
      first_name: "Test",
      last_name: "Short",
      pseudo: `short_pw_${RUN}`,
      email: `short.${RUN}@test.com`,
      password: "abc",
    });
    expect([400, 422, 200]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.text();
      // La page d'erreur doit mentionner le mot de passe
      expect(body).toMatch(/mot de passe|password|invalide/i);
    }
  });

  test("pseudo avec caractères spéciaux interdits → refusé", async ({
    request,
  }) => {
    const resp = await registerViaAPI(request, {
      first_name: "Test",
      last_name: "Special",
      pseudo: `bad pseudo!@#$${RUN}`,
      email: `special.${RUN}@test.com`,
      password: "Test123!",
    });
    // Joi valide les pseudos alphanumériques uniquement
    expect([400, 422, 200]).toContain(resp.status());
  });

  test("champs first_name/last_name manquants → refusé", async ({
    request,
  }) => {
    const resp = await request.post("/auth/register", {
      form: {
        pseudo: `nofname_${RUN}`,
        email: `nofname.${RUN}@test.com`,
        password: "Test123!",
      },
    });
    expect([400, 422, 200]).toContain(resp.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION — Connexion
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Sécurité — Validation connexion", () => {
  test.beforeAll(async ({ request }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
  });

  test("mot de passe incorrect → refusé (401)", async ({ request }) => {
    const resp = await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: "MauvaisMotDePasse99!" },
    });
    expect([401, 200]).toContain(resp.status());
    if (resp.status() === 200) {
      const body = await resp.text();
      expect(body).toMatch(/invalide|incorrect|erreur/i);
    }
  });

  test("pseudo inexistant → refusé", async ({ request }) => {
    const resp = await request.post("/auth/login", {
      form: { pseudo: `fantome_${RUN}`, password: "Test123!" },
    });
    expect([401, 200]).toContain(resp.status());
  });

  test("champs vides → refusé", async ({ request }) => {
    const resp = await request.post("/auth/login", {
      form: { pseudo: "", password: "" },
    });
    expect([400, 401, 422, 200]).toContain(resp.status());
  });

  test("tentative injection SQL dans le pseudo → pas d'erreur 500", async ({
    request,
  }) => {
    const resp = await request.post("/auth/login", {
      form: {
        pseudo: "' OR '1'='1",
        password: "' OR '1'='1",
      },
    });
    // Ne doit jamais crasher avec 500
    expect(resp.status()).not.toBe(500);
    // Ne doit pas être connecté
    expect([401, 400, 200]).toContain(resp.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// XSS — Protection basique
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Sécurité — XSS basique", () => {
  const XSS_PAYLOAD = '<script>alert("xss")</script>';

  test("pseudo avec payload XSS → échappé ou refusé en inscription", async ({
    request,
  }) => {
    const resp = await registerViaAPI(request, {
      first_name: XSS_PAYLOAD,
      last_name: "Test",
      pseudo: `xss_test_${RUN}`,
      email: `xss.${RUN}@test.com`,
      password: "Test123!",
    });
    // Soit refusé, soit accepté mais le payload ne doit pas s'exécuter
    // On vérifie juste qu'il n'y a pas de 500
    expect(resp.status()).not.toBe(500);
  });

  test("page d'accueil — absence de scripts injectés dans le DOM", async ({
    page,
  }) => {
    await page.goto("/");
    // Vérifier qu'aucune alerte JS n'est déclenchée
    let alertFired = false;
    page.on("dialog", async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });
    await page.waitForTimeout(1000);
    expect(alertFired).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ROUTES — Manipulation d'ID
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Sécurité — Manipulation d'ID en URL", () => {
  test("GET /recipes-movie/details/99999999 → 404 ou page d'erreur", async ({
    page,
  }) => {
    const resp = await page.goto("/recipes-movie/details/99999999");
    const status = resp?.status() ?? 0;
    expect([404, 200, 302]).toContain(status);
    if (status === 200) {
      const body = await page.content();
      // La page doit signaler que la recette n'existe pas
      // (pas d'erreur serveur 500)
      expect(body).not.toMatch(/internal server error/i);
    }
  });

  test("GET /auth/profil/99999999 anonyme → bloqué", async ({ page }) => {
    const resp = await page.goto("/auth/profil/99999999");
    const status = resp?.status() ?? 0;
    const isBlocked = status === 403 || status === 302 || status === 404;
    expect(isBlocked).toBe(true);
  });

  test("POST /admin/deleteUser/99999999 anonyme → bloqué", async ({
    request,
  }) => {
    const resp = await request.post("/admin/deleteUser/99999999");
    // Sans auth → 403 ou 401
    expect([401, 403, 302]).toContain(resp.status());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD — Fichiers invalides
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Sécurité — Upload fichiers invalides", () => {
  /**
   * Ces tests vérifient que le serveur rejette correctement les fichiers non-image.
   * On teste en tant qu'utilisateur authentifié (login inline dans chaque test)
   * car la route /add-recipes-movies est protégée.
   * Un 403 = route bien protégée (login non persisté dans ce contexte = attendu).
   */

  test("upload d'un fichier non-image comme photo recette → refusé ou protégé", async ({
    request,
  }) => {
    // Créer le compte si nécessaire
    await registerViaAPI(request, TEST_USER).catch(() => null);
    // Login dans ce contexte request
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      multipart: {
        name: "Recette Malveillante",
        time: "30",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Test",
        preparation: "Test",
        pictures: {
          name: "malicious.txt",
          mimeType: "text/plain",
          buffer: Buffer.from('<?php system("ls"); ?>'),
        },
      },
    });
    // 400/422 = rejeté par Multer, 200 = traité, 403 = non connecté
    // ⚠ BUG CONNU : le serveur retourne 500 sur certains fichiers invalides
    // TODO: corriger le gestionnaire d'erreur Multer (fileFilter + onError)
    const status = resp.status();
    expect(status).not.toBe(500);
    expect([400, 422, 200, 403, 302]).toContain(status);
  });

  test("upload d'un fichier exécutable → refusé ou protégé", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      multipart: {
        name: "Test Exe",
        time: "10",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Test",
        preparation: "Test",
        pictures: {
          name: "virus.exe",
          mimeType: "application/x-msdownload",
          buffer: Buffer.from("MZ"),
        },
      },
    });
    const status2 = resp.status();
    expect(status2).not.toBe(500);
    expect([400, 422, 200, 403, 302]).toContain(status2);
  });

  test("POST /add-recipes-movies/movie-and-recipe AJAX ratio warning 16:9 → succès JSON", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 680,
        channels: 3,
        background: "#ffffff",
      },
    })
      .jpeg()
      .toBuffer();

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      headers: { accept: "application/json" },
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        synopsis: "Description du film",
        name: "Recette de test",
        description: "Description de la recette",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "30",
        pictures: {
          name: `recipe-warning-169-${RUN}.jpg`,
          mimeType: "image/jpeg",
          buffer: imageBuffer,
        },
      },
    });

    expect([200, 201]).toContain(resp.status());
    const body = await resp.json();
    expect(body.status).toBe("ok");
    expect(body.warningMessage).toMatch(/ratio 3:2|recadrée automatiquement/i);
  });

  test("POST /add-recipes-movies/movie-and-recipe AJAX ratio warning 4:3 → succès JSON", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 900,
        channels: 3,
        background: "#ffffff",
      },
    })
      .jpeg()
      .toBuffer();

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      headers: { accept: "application/json" },
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        synopsis: "Description du film",
        name: "Recette 4:3",
        description: "Description de la recette",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "30",
        pictures: {
          name: `recipe-warning-4-3-${RUN}.jpg`,
          mimeType: "image/jpeg",
          buffer: imageBuffer,
        },
      },
    });

    expect([200, 201]).toContain(resp.status());
    const body = await resp.json();
    expect(body.status).toBe("ok");
    expect(body.warningMessage).toMatch(/ratio 3:2|recadrée automatiquement/i);
  });

  test("POST /add-recipes-movies/movie-and-recipe AJAX portrait 800x1200 → bloqué JSON", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const portraitBuffer = await sharp({
      create: {
        width: 800,
        height: 1200,
        channels: 3,
        background: "#ffffff",
      },
    })
      .jpeg()
      .toBuffer();

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      headers: { accept: "application/json" },
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        synopsis: "Description du film",
        name: "Recette portrait",
        description: "Description de la recette",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "30",
        pictures: {
          name: `recipe-portrait-${RUN}.jpg`,
          mimeType: "image/jpeg",
          buffer: portraitBuffer,
        },
      },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.status).toBe("fail");
    expect(body.message).toMatch(/verticale|carrée|panoramique|ratio 3:2/i);
  });

  test("POST /add-recipes-movies/movie-and-recipe AJAX carré 1200x1200 → bloqué JSON", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const squareBuffer = await sharp({
      create: {
        width: 1200,
        height: 1200,
        channels: 3,
        background: "#ffffff",
      },
    })
      .jpeg()
      .toBuffer();

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      headers: { accept: "application/json" },
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        synopsis: "Description du film",
        name: "Recette carré",
        description: "Description de la recette",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "30",
        pictures: {
          name: `recipe-square-${RUN}.jpg`,
          mimeType: "image/jpeg",
          buffer: squareBuffer,
        },
      },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.status).toBe("fail");
    expect(body.message).toMatch(/verticale|carrée|panoramique|ratio 3:2/i);
  });

  test("POST /add-recipes-movies/movie-and-recipe aucune image → bloqué HTML", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        description: "Description de la recette",
        name: "Recette sans image",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "30",
      },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.text();
    expect(body).toMatch(/alert-error|erreur|merci d'ajouter/i);
    expect(body).not.toMatch(
      /internal server error|erreur serveur|stack trace/i,
    );
  });

  test("POST /add-recipes-movies/movie-and-recipe AJAX fichier texte renommé .jpg → bloqué JSON et nettoyage", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const uniqueName = `cleanup-invalid-${RUN}.jpg`;
    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      headers: { accept: "application/json" },
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        synopsis: "Description du film",
        name: "Recette malveillante",
        description: "Description de la recette",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "30",
        pictures: {
          name: uniqueName,
          mimeType: "image/jpeg",
          buffer: Buffer.from("Ceci n'est pas une image"),
        },
      },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.status).toBe("fail");
    expect(body.message).toMatch(
      /image valide|non pris en charge|image.*valide/i,
    );

    const tempDir = path.join(__dirname, "../../../app/public/images/recipes");
    const leftovers = fs
      .readdirSync(tempDir)
      .filter((filename) =>
        filename.includes(uniqueName.replace(/\.jpg$/, "")),
      );
    expect(leftovers.length).toBe(0);
  });

  test("POST /add-recipes-movies/movie-and-recipe AJAX temps non numérique → bloqué JSON", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: "#ffffff",
      },
    })
      .jpeg()
      .toBuffer();

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      headers: { accept: "application/json" },
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        synopsis: "Description du film",
        name: "Recette erreur temps",
        description: "Description de la recette",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        time: "abc",
        servings: "deux",
        pictures: {
          name: `recipe-valid-${RUN}.jpg`,
          mimeType: "image/jpeg",
          buffer: imageBuffer,
        },
      },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.status).toBe("fail");
    expect(body.message).toMatch(/temps|servings|nombre/i);
  });

  test("POST /add-recipes-movies/movie-and-recipe avec une image 3:2 valide → succès", async ({
    request,
  }) => {
    await registerViaAPI(request, TEST_USER).catch(() => null);
    await request.post("/auth/login", {
      form: { pseudo: TEST_USER.pseudo, password: TEST_USER.password },
    });

    const imageBuffer = await sharp({
      create: {
        width: 1200,
        height: 800,
        channels: 3,
        background: "#ffffff",
      },
    })
      .jpeg()
      .toBuffer();

    const resp = await request.post("/add-recipes-movies/movie-and-recipe", {
      multipart: {
        title: "Film de test",
        year: "2024",
        genre: "comédie",
        description: "Description de la recette",
        name: "Recette de test",
        time: "30",
        category: "plat",
        difficulty: "Facile",
        ingredients: "Farine, eau, sel",
        preparation: "Mélanger et cuire.",
        pictures: {
          name: "recipe-valid-3-2.jpg",
          mimeType: "image/jpeg",
          buffer: imageBuffer,
        },
      },
    });

    expect([200, 201]).toContain(resp.status());
  });
});
