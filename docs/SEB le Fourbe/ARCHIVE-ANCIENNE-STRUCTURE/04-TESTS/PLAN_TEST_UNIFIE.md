# PLAN DE TEST - Workflow Unifié Film + Recette

**Date :** 2025-12-01  
**Objectif :** Valider le workflow complet avant intégration des fonctionnalités IA

---

## 📋 PRÉREQUIS POUR LES TESTS

### Environnement

- [ ] Serveur de développement lancé
- [ ] Base de données accessible
- [ ] Console navigateur ouverte (F12)
- [ ] Accès à la base de données pour vérification

### Films de Test Disponibles

- [ ] "Harry Potter" (2001, fantastique)
- [ ] "American pie" (1999, comédie)
- [ ] "Bienvenue chez les Ch'tis" (2008, comédie)
- [ ] "Le silence des agneaux" (1991, thriller)
- [ ] "Indiana Jones et les Aventuriers de l'Arche perdue" (1981, aventure)

### Images de Test

- [ ] Image valide (JPG/PNG/WEBP, < 5 MB)
- [ ] Image trop volumineuse (> 5 MB) pour test erreur
- [ ] Fichier non-image pour test erreur

---

## 🧪 TEST 1 : FILM EXISTANT (via Autocomplétion)

### Scénario

1. **Navigation**

   - [ ] Aller sur `/add-recipes-movies/`
   - [ ] Vérifier que la page charge correctement
   - [ ] Vérifier que les scripts sont chargés (console navigateur)

2. **Autocomplétion Film**

   - [ ] Cliquer sur le champ "Nom du film" (`#film-name`)
   - [ ] Taper "Harry" (recherche partielle)
   - [ ] **Résultat attendu :** Dropdown apparaît après 300ms
   - [ ] **Résultat attendu :** "Harry Potter" apparaît dans les suggestions
   - [ ] **Résultat attendu :** Affiche "2001 • fantastique"

3. **Sélection Film**

   - [ ] Cliquer sur "Harry Potter" dans le dropdown
   - [ ] **Résultat attendu :** Les champs se pré-remplissent :
     - [ ] `#film-name` = "Harry Potter"
     - [ ] `#film-year` = "2001"
     - [ ] `#film-genre` = "fantastique"
   - [ ] Vérifier dans la console navigateur (F12) :
     - [ ] `filmId-hidden` a la valeur de l'ID du film
     - [ ] Pas d'erreur JavaScript

4. **Bouton "Je passe à la recette"**

   - [ ] **Résultat attendu :** Le bouton ne doit PAS apparaître si un film est sélectionné
   - [ ] (Le bouton ne devrait être visible que si aucun film n'est sélectionné)

5. **Remplissage Recette**

   - [ ] Remplir le nom de la recette : "Tarte à la mélasse"
   - [ ] Remplir le temps : "50" (minutes)
   - [ ] Sélectionner catégorie : "dessert"
   - [ ] Sélectionner difficulté : "Moyenne"
   - [ ] Remplir le contexte : "Lors du banquet de bienvenue..."
   - [ ] Uploader une image de recette (format valide, < 5 MB)
   - [ ] Remplir les ingrédients : "- 1 pâte brisée\n- 300g de mélasse..."
   - [ ] Remplir la préparation : "1. Préchauffer le four..."

6. **Soumission**

   - [ ] Cliquer sur "Je valide ma recette"
   - [ ] **Résultat attendu :** Formulaire soumis vers `/add-recipes-movies/movie-and-recipe`
   - [ ] **Résultat attendu :** Pas d'alerte JavaScript (validation OK)

7. **Message de Succès**

   - [ ] **Résultat attendu :** Message vert apparaît :
     - [ ] "✅ Ta recette est envoyée à Ciné Délices et sera contrôlée en admin sous 24h."
   - [ ] **Résultat attendu :** Animation slideDown

8. **Vérification Base de Données**
   - [ ] Connecter à la base de données
   - [ ] Vérifier que la recette est créée :
     ```sql
     SELECT * FROM recipes ORDER BY id DESC LIMIT 1;
     ```
   - [ ] **Résultat attendu :**
     - [ ] `name` = "Tarte à la mélasse"
     - [ ] `id_movie` = ID de "Harry Potter"
     - [ ] `status` = `false`
     - [ ] `picture` contient le chemin de l'image
   - [ ] Vérifier que le film n'a pas été créé en double :
     ```sql
     SELECT COUNT(*) FROM movies WHERE title ILIKE '%Harry Potter%' AND year = 2001;
     ```
     - [ ] **Résultat attendu :** 1 seul film (celui existant)

### Checklist Validation

- [ ] Autocomplétion fonctionne
- [ ] Pré-remplissage automatique fonctionne
- [ ] `filmId` correctement stocké
- [ ] Formulaire soumis sans erreur
- [ ] Message de succès affiché
- [ ] Recette créée en base avec `status: false`
- [ ] Film existant réutilisé (pas de doublon)
- [ ] Image uploadée correctement

---

## 🧪 TEST 2 : NOUVEAU FILM

### Scénario

1. **Navigation**

   - [ ] Aller sur `/add-recipes-movies/`
   - [ ] Page vide (pas de film pré-sélectionné)

2. **Création Nouveau Film**

   - [ ] Taper "Les Goonies" dans le champ "Nom du film"
   - [ ] Taper "1985" dans "Année du film"
   - [ ] Sélectionner "aventure" dans "Genre"
   - [ ] **Résultat attendu :** Pas de suggestion (film inexistant)

3. **Bouton "Je passe à la recette"**

   - [ ] **Résultat attendu :** Le bouton apparaît
   - [ ] (Optionnel : cliquer pour scroller vers la section recette)

4. **Remplissage Recette**

   - [ ] Remplir tous les champs de la recette :
     - [ ] Nom : "Baby Ruth au beurre de cacahuète"
     - [ ] Temps : "15"
     - [ ] Catégorie : "dessert"
     - [ ] Difficulté : "Facile"
     - [ ] Contexte : "Dans la scène où Chunk mange..."
     - [ ] Image : uploader une image
     - [ ] Ingrédients : "- Baby Ruth\n- Beurre de cacahuète..."
     - [ ] Préparation : "1. Prendre un Baby Ruth..."

5. **Soumission**

   - [ ] Cliquer sur "Je valide ma recette"
   - [ ] **Résultat attendu :** Formulaire soumis

6. **Message de Succès**

   - [ ] **Résultat attendu :** Message vert affiché

7. **Vérification Base de Données**
   - [ ] Vérifier que le film est créé :
     ```sql
     SELECT * FROM movies WHERE title ILIKE '%Goonies%' ORDER BY id DESC LIMIT 1;
     ```
     - [ ] **Résultat attendu :**
       - [ ] `title` = "Les Goonies" (ou avec underscores selon validator)
       - [ ] `year` = 1985
       - [ ] `genre` = "aventure"
       - [ ] `status` = `false`
   - [ ] Vérifier que la recette est créée et liée :
     ```sql
     SELECT r.*, m.title as movie_title
     FROM recipes r
     JOIN movies m ON r.id_movie = m.id
     WHERE r.name ILIKE '%Baby Ruth%'
     ORDER BY r.id DESC LIMIT 1;
     ```
     - [ ] **Résultat attendu :**
       - [ ] Recette créée
       - [ ] `id_movie` correspond au film créé
       - [ ] `status` = `false`

### Checklist Validation

- [ ] Nouveau film créé correctement
- [ ] Recette créée et liée au film
- [ ] Transaction atomique (film + recette créés ensemble)
- [ ] Status `false` pour film et recette

---

## 🧪 TEST 3 : GESTION DOUBLONS

### Scénario

1. **Tentative Création Doublon**

   - [ ] Aller sur `/add-recipes-movies/`
   - [ ] Taper "Harry Potter" (film existant)
   - [ ] Taper "2001" (année correspondante)
   - [ ] Sélectionner "fantastique"
   - [ ] Remplir la recette complète
   - [ ] Soumettre le formulaire

2. **Résultat Attendu**

   - [ ] **Pas de doublon créé**
   - [ ] Le film existant "Harry Potter" est réutilisé
   - [ ] La recette est liée au film existant
   - [ ] Message de succès affiché normalement

3. **Vérification Base de Données**
   - [ ] Vérifier le nombre de films :
     ```sql
     SELECT COUNT(*) FROM movies WHERE title ILIKE '%Harry Potter%' AND year = 2001;
     ```
     - [ ] **Résultat attendu :** 1 seul film
   - [ ] Vérifier que la recette est liée au bon film :
     ```sql
     SELECT r.*, m.title
     FROM recipes r
     JOIN movies m ON r.id_movie = m.id
     WHERE m.title ILIKE '%Harry Potter%'
     ORDER BY r.id DESC;
     ```
     - [ ] **Résultat attendu :** Toutes les recettes liées au même film

### Checklist Validation

- [ ] Détection doublons fonctionne
- [ ] Film existant réutilisé
- [ ] Aucun doublon créé
- [ ] Recette liée au film existant

---

## 🧪 TEST 4 : UPLOAD IMAGE

### Scénario A : Image Valide

1. **Upload Image Valide**

   - [ ] Sélectionner une image JPG (format valide)
   - [ ] Taille < 5 MB
   - [ ] **Résultat attendu :** Prévisualisation affichée
   - [ ] Soumettre le formulaire
   - [ ] **Résultat attendu :** Image uploadée correctement

2. **Vérification**
   - [ ] Vérifier que l'image est dans `/app/public/images/recipes/cards/`
   - [ ] Vérifier que le chemin est stocké en base :
     ```sql
     SELECT picture FROM recipes ORDER BY id DESC LIMIT 1;
     ```
   - [ ] **Résultat attendu :** Chemin au format `/images/recipes/cards/recipe-...-random.ext`

### Scénario B : Image Trop Volumineuse

1. **Upload Image > 5 MB**
   - [ ] Tenter d'uploader une image > 5 MB
   - [ ] **Résultat attendu :** Message d'erreur côté client (si validation JS)
   - [ ] **Résultat attendu :** Message d'erreur Multer si upload tenté

### Scénario C : Format Invalide

1. **Upload Fichier Non-Image**
   - [ ] Tenter d'uploader un fichier .pdf ou .txt
   - [ ] **Résultat attendu :** Message d'erreur
   - [ ] **Résultat attendu :** Upload refusé

### Checklist Validation

- [ ] Image valide uploadée correctement
- [ ] Taille maximale respectée (5 MB)
- [ ] Formats acceptés uniquement (JPG, PNG, WEBP)
- [ ] Journalisation upload fonctionne

---

## 🧪 TEST 5 : VALIDATION CLIENT

### Scénario A : Validation HTML5

1. **Input Année**

   - [ ] Tester avec valeur < 1888
   - [ ] **Résultat attendu :** Validation HTML5 bloque
   - [ ] Tester avec valeur > année actuelle + 5
   - [ ] **Résultat attendu :** Validation HTML5 bloque

2. **Input Temps**

   - [ ] Tester avec valeur < 1
   - [ ] **Résultat attendu :** Validation HTML5 bloque
   - [ ] Tester avec valeur négative
   - [ ] **Résultat attendu :** Validation HTML5 bloque

3. **Champs Obligatoires**
   - [ ] Laisser un champ obligatoire vide
   - [ ] Tenter de soumettre
   - [ ] **Résultat attendu :** Message d'alerte JavaScript

### Scénario B : Désactivation Bouton

1. **Formulaire Incomplet**
   - [ ] Laisser des champs obligatoires vides
   - [ ] **Résultat attendu :** Bouton reste actif mais validation bloque la soumission
   - [ ] (Note : Pour l'instant, le bouton n'est pas désactivé, la validation bloque juste la soumission)

### Checklist Validation

- [ ] Validation HTML5 fonctionne (année, temps)
- [ ] Messages d'alerte JavaScript affichés
- [ ] Validation bloque soumission si champs manquants

---

## 🧪 TEST 6 : ROLLBACK TRANSACTION

### Scénario A : Erreur Validation Champ Manquant

1. **Soumission Incomplète**

   - [ ] Remplir le film correctement
   - [ ] Laisser le nom de la recette vide
   - [ ] Soumettre le formulaire
   - [ ] **Résultat attendu :** Message d'erreur affiché
   - [ ] **Résultat attendu :** Aucun film créé

2. **Vérification Base de Données**
   - [ ] Vérifier qu'aucun film orphelin n'est créé :
     ```sql
     SELECT * FROM movies ORDER BY id DESC LIMIT 5;
     ```
     - [ ] **Résultat attendu :** Pas de nouveau film créé si recette échoue

### Scénario B : Erreur Sequelize (Simulation)

**Note :** Pour tester un rollback réel, il faudrait créer une erreur volontaire. Exemples :

- Contrainte de clé étrangère violée
- Erreur de validation Sequelize
- Timeout de connexion

1. **Simulation Erreur**

   - [ ] (Optionnel) Modifier temporairement le controller pour simuler une erreur
   - [ ] Soumettre le formulaire
   - [ ] **Résultat attendu :** Rollback exécuté

2. **Vérification**
   - [ ] Aucun film créé
   - [ ] Aucune recette créée
   - [ ] Message d'erreur affiché

### Checklist Validation

- [ ] Rollback fonctionne en cas d'erreur
- [ ] Aucun film orphelin créé
- [ ] Aucune recette orpheline créée
- [ ] Transaction atomique garantie

---

## 🧪 TEST 7 : MESSAGES UTILISATEUR

### Scénario A : Message de Succès

1. **Soumission Réussie**
   - [ ] Compléter le formulaire correctement
   - [ ] Soumettre
   - [ ] **Résultat attendu :**
     - [ ] Message vert apparaît
     - [ ] Texte : "✅ Ta recette est envoyée à Ciné Délices et sera contrôlée en admin sous 24h."
     - [ ] Animation slideDown
     - [ ] Icône check-circle visible

### Scénario B : Message d'Erreur

1. **Erreur Validation**

   - [ ] Soumettre formulaire incomplet
   - [ ] **Résultat attendu :**
     - [ ] Message rouge apparaît
     - [ ] Message clair et explicite
     - [ ] Icône circle-exclamation visible

2. **Erreur Serveur**
   - [ ] (Simuler une erreur serveur)
   - [ ] **Résultat attendu :**
     - [ ] Message d'erreur générique affiché
     - [ ] Pas de détails techniques exposés à l'utilisateur

### Checklist Validation

- [ ] Messages de succès clairs et visibles
- [ ] Messages d'erreur informatifs
- [ ] Animations fonctionnent
- [ ] Pas de messages d'erreur techniques exposés

---

## 📊 RAPPORT DE TEST

### Template de Rapport

Pour chaque test, documenter :

```
TEST #X : [Nom du test]
Date : [Date]
Testeur : [Nom]
Résultat : ✅ PASS / ❌ FAIL / ⚠️ PARTIEL

Observations :
- Point 1 : ✅/❌
- Point 2 : ✅/❌
...

Erreurs rencontrées :
- [Description détaillée]

Logs console :
- [Copier les logs si erreur]

Logs serveur :
- [Copier les logs serveur si erreur]

Screenshot : [si nécessaire]
```

---

## ✅ CHECKLIST FINALE

### Avant Intégration IA

- [ ] Tous les tests 1-7 passent
- [ ] Aucun bug critique identifié
- [ ] Workflow fonctionne end-to-end
- [ ] Transaction fonctionne correctement
- [ ] Messages utilisateur affichés
- [ ] Base de données cohérente (pas de doublons, pas d'orphelins)
- [ ] Validation côté client et serveur fonctionne
- [ ] Upload d'image fonctionne
- [ ] Rollback transaction testé et validé

### Points d'Attention

- [ ] Vérifier que le bouton "Je passe à la recette" ne bloque pas le workflow unifié
- [ ] S'assurer que l'autocomplétion ne casse pas la soumission
- [ ] Vérifier que les champs hidden sont bien remplis avant soumission

---

## 🔍 VÉRIFICATIONS TECHNIQUES

### Console Navigateur

À vérifier lors des tests :

- [ ] Pas d'erreur JavaScript
- [ ] Messages de log du script d'autocomplétion
- [ ] Messages de log du formulaire unifié
- [ ] Requêtes réseau vers `/movies/api/search` fonctionnent
- [ ] POST vers `/movie-and-recipe` fonctionne

### Logs Serveur

À vérifier :

- [ ] Journalisation upload fonctionne (si image uploadée)
- [ ] Journalisation erreurs fonctionne (si erreur)
- [ ] Pas d'erreur Sequelize
- [ ] Transaction commit/rollback loggés

### Base de Données

Requêtes de vérification :

```sql
-- Vérifier dernières recettes créées
SELECT r.id, r.name, r.status, m.title as movie, m.status as movie_status
FROM recipes r
LEFT JOIN movies m ON r.id_movie = m.id
ORDER BY r.id DESC
LIMIT 5;

-- Vérifier films orphelins (sans recette)
SELECT m.*
FROM movies m
LEFT JOIN recipes r ON m.id = r.id_movie
WHERE r.id IS NULL
AND m.status = false
ORDER BY m.id DESC;

-- Vérifier doublons films
SELECT title, year, COUNT(*) as count
FROM movies
GROUP BY title, year
HAVING COUNT(*) > 1;
```

---

**Plan de test créé :** ✅  
**Prêt pour exécution :** ⏳
