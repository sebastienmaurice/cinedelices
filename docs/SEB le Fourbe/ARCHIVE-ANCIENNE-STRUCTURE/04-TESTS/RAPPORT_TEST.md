# RAPPORT DE TEST - Workflow Unifié Film + Recette

**Date :** 2025-12-01  
**Testeur :** Tests automatisés + Manuel  
**Statut :** En cours

---

## ✅ VÉRIFICATIONS AUTOMATISÉES

### 1. Structure des Fichiers

| Fichier                          | État            | Détails                                                  |
| -------------------------------- | --------------- | -------------------------------------------------------- |
| Route `/movie-and-recipe`        | ✅ **PRÉSENTE** | Ligne 36-39 dans `add-recipes-movies.route.js`           |
| Controller `addMovieAndRecipe()` | ✅ **PRÉSENT**  | Lignes 184-357 dans `add-recipes-movies.controllers.js`  |
| Formulaire unifié                | ✅ **PRÉSENT**  | Action `/movie-and-recipe` dans `add-recipes-movies.ejs` |
| Script synchronisation           | ✅ **PRÉSENT**  | `unified-form-handler.js` chargé                         |
| Script autocomplétion            | ✅ **PRÉSENT**  | `movie-autocomplete-form.js` chargé                      |

### 2. Vérifications Code

| Élément               | État | Vérification                                                      |
| --------------------- | ---- | ----------------------------------------------------------------- |
| Transaction Sequelize | ✅   | `const transaction = await sequelize.transaction()` présent       |
| Rollback              | ✅   | `await transaction.rollback()` dans tous les cas d'erreur         |
| Commit                | ✅   | `await transaction.commit()` après création réussie               |
| Import sequelize      | ✅   | `import sequelize from "../database/sequelize-client.js"` présent |
| Import Op             | ✅   | `import { Op } from "sequelize"` présent                          |
| Détection doublons    | ✅   | `Movie.findOne()` avec `Op.iLike` présent                         |
| Validation champs     | ✅   | Vérifications présentes pour film et recette                      |
| Messages utilisateur  | ✅   | `successMessage` et `errorMessage` configurés                     |
| Journalisation        | ✅   | `logUpload()` et `logUploadError()` appelés                       |

### 3. Structure HTML

| Élément                 | État | Détails                                               |
| ----------------------- | ---- | ----------------------------------------------------- |
| Formulaire unifié       | ✅   | `<form id="unified-form" action="/movie-and-recipe">` |
| Champ hidden filmId     | ✅   | `<input name="filmId" id="filmId-hidden">`            |
| Champs hidden film      | ✅   | `title`, `year`, `genre` présents                     |
| Dropdown autocomplétion | ✅   | `<div id="film-search-results">` présent              |
| Scripts chargés         | ✅   | Tous les scripts nécessaires présents                 |

---

## 🧪 TESTS À EXÉCUTER (Manuel)

### TEST 1 : Film Existant via Autocomplétion

**Statut :** ⏳ À tester

**Étapes :**

1. Aller sur `/add-recipes-movies/`
2. Taper "Harry" dans le champ film
3. Vérifier dropdown apparaît
4. Sélectionner "Harry Potter"
5. Vérifier pré-remplissage
6. Remplir recette complète
7. Soumettre

**Résultats attendus :**

- [ ] Dropdown fonctionne
- [ ] Pré-remplissage fonctionne
- [ ] filmId correctement rempli
- [ ] Message succès affiché
- [ ] Recette créée avec `status: false`
- [ ] Film existant réutilisé (pas de doublon)

**Résultat réel :** ⏳ À remplir après test

---

### TEST 2 : Nouveau Film

**Statut :** ⏳ À tester

**Étapes :**

1. Aller sur `/add-recipes-movies/`
2. Taper "Les Goonies" (film inexistant)
3. Remplir année : 1985, genre : aventure
4. Remplir recette complète
5. Soumettre

**Résultats attendus :**

- [ ] Film créé avec `status: false`
- [ ] Recette créée et liée au film
- [ ] Transaction atomique (les deux créés ensemble)
- [ ] Message succès affiché

**Résultat réel :** ⏳ À remplir après test

---

### TEST 3 : Détection Doublons

**Statut :** ⏳ À tester

**Étapes :**

1. Taper "Harry Potter" + année 2001
2. Remplir recette
3. Soumettre

**Résultats attendus :**

- [ ] Film existant réutilisé
- [ ] Aucun doublon créé
- [ ] Recette liée au film existant

**Résultat réel :** ⏳ À remplir après test

---

### TEST 4 : Rollback Transaction

**Statut :** ⏳ À tester

**Étapes :**

1. Remplir film correctement
2. Laisser nom recette vide
3. Soumettre

**Résultats attendus :**

- [ ] Message d'erreur affiché
- [ ] Aucun film créé
- [ ] Transaction rollback exécuté

**Résultat réel :** ⏳ À remplir après test

---

## 📊 REQUÊTES SQL DE VÉRIFICATION

### Vérifier Dernières Recettes Créées

```sql
SELECT
    r.id,
    r.name as recipe_name,
    r.status as recipe_status,
    m.title as movie_title,
    m.status as movie_status,
    r.id_movie,
    r.created_at
FROM recipes r
LEFT JOIN movies m ON r.id_movie = m.id
ORDER BY r.id DESC
LIMIT 5;
```

### Vérifier Films Orphelins (sans recette)

```sql
SELECT m.*
FROM movies m
LEFT JOIN recipes r ON m.id = r.id_movie
WHERE r.id IS NULL
AND m.status = false
ORDER BY m.id DESC;
```

### Vérifier Doublons Films

```sql
SELECT title, year, COUNT(*) as count
FROM movies
GROUP BY title, year
HAVING COUNT(*) > 1;
```

### Vérifier Recettes avec Status False (en attente validation)

```sql
SELECT
    r.id,
    r.name,
    r.status,
    m.title as movie,
    m.status as movie_status
FROM recipes r
JOIN movies m ON r.id_movie = m.id
WHERE r.status = false
ORDER BY r.id DESC;
```

---

## 🔍 VÉRIFICATIONS CONSOLE NAVIGATEUR

### Messages Attendus

Lors de la page :

- [ ] `✅ Gestionnaire formulaire unifié initialisé`
- [ ] `🔧 Initialisation autocomplétion film...`
- [ ] `✅ Autocomplétion film initialisée avec succès`

Lors de la saisie :

- [ ] `🔍 Recherche film: [query]`
- [ ] `📡 Appel API: /movies/api/search?query=...`
- [ ] `📥 Réponse API: [films]`

Lors de la soumission :

- [ ] Pas d'erreur JavaScript
- [ ] Synchronisation données exécutée

---

## ⚠️ PROBLÈMES IDENTIFIÉS

### Avant Tests

Aucun problème critique identifié. Tous les éléments sont en place.

### Après Tests

- [ ] À remplir après exécution des tests

---

## 📝 NOTES

### Points à Vérifier Spécialement

1. **Synchronisation filmId**

   - Vérifier que `filmId-hidden` est rempli quand film sélectionné
   - Vérifier que les champs film sont vidés si `filmId` présent

2. **Validation Client**

   - Tester avec champs vides
   - Vérifier messages d'alerte

3. **Transaction**
   - Vérifier rollback en cas d'erreur
   - Vérifier qu'aucun film orphelin n'est créé

---

**Rapport créé :** ✅  
**Tests à exécuter :** ⏳
