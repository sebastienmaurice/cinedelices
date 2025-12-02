# GUIDE DE TEST - Workflow Unifié Film + Recette

**Date :** 2025-12-01  
**Statut :** Prêt pour tests manuels

---

## ✅ VÉRIFICATIONS AUTOMATISÉES TERMINÉES

### Structure Technique

1. ✅ **Route backend** : `/movie-and-recipe` présente et accessible
2. ✅ **Controller** : Fonction `addMovieAndRecipe()` avec transaction
3. ✅ **Formulaire unifié** : Action correcte, champs hidden présents
4. ✅ **Scripts JavaScript** : Synchronisation et validation implémentées
5. ✅ **Syntaxe** : Aucune erreur de syntaxe détectée
6. ✅ **Linter** : Aucune erreur de lint

**Tous les éléments sont en place pour les tests.** ✅

---

## 🎯 TESTS À EXÉCUTER (Manuel)

### TEST 1 : Film Existant (5 minutes)

**Objectif :** Vérifier l'autocomplétion et la soumission avec film existant

**Étapes :**

1. Ouvrir `http://localhost:3000/add-recipes-movies/`
2. Ouvrir la console navigateur (F12)
3. Dans "Nom du film", taper **"Harry"**
4. **Vérifier :** Dropdown bleu apparaît avec "Harry Potter"
5. Cliquer sur "Harry Potter" dans le dropdown
6. **Vérifier :** Champs pré-remplis (année=2001, genre=fantastique)
7. Dans la console, vérifier : `filmId-hidden` a une valeur
8. Remplir la recette :
   - Nom : "Test Tarte Mélasse"
   - Temps : "50"
   - Catégorie : "dessert"
   - Difficulté : "Moyenne"
   - Contexte : "Lors du banquet..."
   - Ingrédients : "Liste d'ingrédients"
   - Préparation : "Étapes de préparation"
9. Cliquer sur **"Je valide ma recette"**
10. **Vérifier :** Message vert apparaît : "✅ Ta recette est envoyée..."

**Résultat :** ⏳ À remplir

---

### TEST 2 : Nouveau Film (5 minutes)

**Objectif :** Vérifier la création d'un nouveau film + recette

**Étapes :**

1. Ouvrir `http://localhost:3000/add-recipes-movies/`
2. Taper un film inexistant : **"Les Goonies"**
3. Remplir année : **"1985"**, genre : **"aventure"**
4. Remplir la recette complète
5. Soumettre
6. **Vérifier :** Message de succès
7. (Optionnel) Vérifier en BDD que film et recette créés avec `status: false`

**Résultat :** ⏳ À remplir

---

### TEST 3 : Validation Côté Client (2 minutes)

**Objectif :** Vérifier que la validation bloque la soumission

**Étapes :**

1. Aller sur la page
2. Remplir seulement le film, laisser la recette vide
3. Cliquer sur "Je valide ma recette"
4. **Vérifier :** Message d'alerte JavaScript apparaît
5. **Vérifier :** Formulaire ne se soumet pas

**Résultat :** ⏳ À remplir

---

### TEST 4 : Détection Doublons (3 minutes)

**Objectif :** Vérifier qu'aucun doublon n'est créé

**Étapes :**

1. Taper "Harry Potter" + année "2001" (film existant)
2. Remplir recette complète
3. Soumettre
4. (Optionnel) Vérifier en BDD qu'un seul film "Harry Potter" 2001 existe
5. **Vérifier :** Recette liée au film existant

**Résultat :** ⏳ À remplir

---

### TEST 5 : Rollback Transaction (3 minutes)

**Objectif :** Vérifier que le rollback fonctionne

**Étapes :**

1. Remplir film correctement
2. Laisser le **nom de la recette vide**
3. Soumettre
4. **Vérifier :** Message d'erreur affiché
5. (Optionnel) Vérifier en BDD qu'aucun film n'a été créé

**Résultat :** ⏳ À remplir

---

## 📊 VÉRIFICATIONS BASE DE DONNÉES

### Requêtes Utiles

```sql
-- Vérifier les dernières recettes créées
SELECT r.id, r.name, r.status, m.title, m.status as movie_status
FROM recipes r
LEFT JOIN movies m ON r.id_movie = m.id
ORDER BY r.id DESC
LIMIT 5;

-- Vérifier qu'il n'y a pas de films orphelins
SELECT m.*
FROM movies m
LEFT JOIN recipes r ON m.id = r.id_movie
WHERE r.id IS NULL AND m.status = false;

-- Vérifier qu'il n'y a pas de doublons
SELECT title, year, COUNT(*) as count
FROM movies
GROUP BY title, year
HAVING COUNT(*) > 1;
```

---

## 🔍 CONSOLE NAVIGATEUR

### Messages Attendus

**Au chargement de la page :**

```
✅ Gestionnaire formulaire unifié initialisé
🔧 Initialisation autocomplétion film...
✅ Autocomplétion film initialisée avec succès
```

**Lors de la saisie :**

```
🔍 Recherche film: harry
📡 Appel API: /movies/api/search?query=harry
📥 Réponse API: {success: true, movies: [...]}
```

**Lors de la soumission :**

- Pas d'erreur JavaScript
- Synchronisation exécutée

---

## ⚠️ PROBLÈMES CONNUS

Aucun problème identifié avant les tests.

---

## 📝 RAPPORT DE TEST

**Tester :** **********\_**********  
**Date :** **********\_**********

### Résultats

| Test                   | Résultat | Notes |
| ---------------------- | -------- | ----- |
| Test 1 : Film Existant | ⏳       |       |
| Test 2 : Nouveau Film  | ⏳       |       |
| Test 3 : Validation    | ⏳       |       |
| Test 4 : Doublons      | ⏳       |       |
| Test 5 : Rollback      | ⏳       |       |

### Bugs Trouvés

1. ***
2. ***

---

**Prêt pour exécution :** ✅
