# CHECKLIST TEST RAPIDE - Workflow Unifié

**Date :** 2025-12-01  
**Pour exécution rapide des tests**

---

## 🚀 DÉMARRAGE RAPIDE

### Prérequis

- [ ] Serveur lancé : `npm start` ou équivalent
- [ ] Accès à `/add-recipes-movies/`
- [ ] Console navigateur ouverte (F12)
- [ ] Accès base de données (optionnel pour vérification)

---

## ✅ TEST 1 : FILM EXISTANT (2 minutes)

1. **Ouvrir** `/add-recipes-movies/`
2. **Taper** "Harry" dans "Nom du film"
3. **Vérifier** dropdown apparaît avec "Harry Potter"
4. **Cliquer** sur "Harry Potter"
5. **Vérifier** champs pré-remplis (année=2001, genre=fantastique)
6. **Remplir** recette :
   - Nom : "Test Recette"
   - Temps : "30"
   - Catégorie : "dessert"
   - Difficulté : "Facile"
   - Contexte : "Test"
   - Ingrédients : "Test"
   - Préparation : "Test"
7. **Cliquer** "Je valide ma recette"
8. **Vérifier** message vert de succès apparaît

**Résultat :** ✅ PASS / ❌ FAIL  
**Notes :** **********\_**********

---

## ✅ TEST 2 : NOUVEAU FILM (2 minutes)

1. **Ouvrir** `/add-recipes-movies/` (page vierge)
2. **Remplir** film :
   - Nom : "Film Test 2024"
   - Année : "2024"
   - Genre : "action"
3. **Remplir** recette complète (même que test 1)
4. **Soumettre**
5. **Vérifier** message succès

**Résultat :** ✅ PASS / ❌ FAIL  
**Notes :** **********\_**********

---

## ✅ TEST 3 : VALIDATION (1 minute)

1. **Laisser** tous les champs vides
2. **Cliquer** "Je valide ma recette"
3. **Vérifier** message d'alerte JavaScript apparaît
4. **Vérifier** formulaire ne se soumet pas

**Résultat :** ✅ PASS / ❌ FAIL  
**Notes :** **********\_**********

---

## ✅ TEST 4 : DOUBLON (1 minute)

1. **Taper** "Harry Potter" + année "2001"
2. **Remplir** recette
3. **Soumettre**
4. **Vérifier** pas de doublon créé (vérifier BDD si possible)

**Résultat :** ✅ PASS / ❌ FAIL  
**Notes :** **********\_**********

---

## 🔍 VÉRIFICATIONS CONSOLE

### Messages Attendus dans Console (F12)

- [ ] `✅ Gestionnaire formulaire unifié initialisé`
- [ ] `🔧 Initialisation autocomplétion film...`
- [ ] `✅ Autocomplétion film initialisée avec succès`
- [ ] Pas d'erreur JavaScript

---

## ⚠️ BUGS TROUVÉS

1. ***
2. ***
3. ***

---

## 📝 NOTES

---

---

---

---

**Temps total estimé :** 6-10 minutes  
**Statut global :** ⏳ À compléter
