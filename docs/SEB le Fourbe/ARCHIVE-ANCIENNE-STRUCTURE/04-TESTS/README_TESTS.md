# 🧪 GUIDE DE TEST - Workflow Unifié Film + Recette

**Date :** 2025-12-01  
**Statut :** ✅ PRÊT POUR TESTS

---

## ⚡ DÉMARRAGE RAPIDE

### 1. Vérifier le Serveur

```bash
# Vérifier que le serveur est lancé
curl http://localhost:3000/add-recipes-movies/
```

### 2. Ouvrir la Page

```
http://localhost:3000/add-recipes-movies/
```

### 3. Ouvrir la Console Navigateur

- Appuyer sur **F12**
- Aller dans l'onglet **Console**
- Vérifier les messages d'initialisation

---

## ✅ CHECKLIST VÉRIFICATIONS AUTOMATISÉES

- ✅ Route `/movie-and-recipe` présente
- ✅ Controller `addMovieAndRecipe()` avec transaction
- ✅ Formulaire unifié avec action correcte
- ✅ Scripts JavaScript chargés
- ✅ Aucune erreur de syntaxe
- ✅ Champs hidden présents
- ✅ Messages d'erreur/succès configurés

**Tout est prêt !** ✅

---

## 🎯 TESTS PRIORITAIRES

### TEST 1 : Film Existant (CRITIQUE - 5 min)

**Action :**

1. Taper "Harry" → Sélectionner "Harry Potter"
2. Remplir recette complète
3. Soumettre

**Vérifier :**

- ✅ Dropdown fonctionne
- ✅ Pré-remplissage fonctionne
- ✅ Message succès affiché
- ✅ Pas de doublon créé

---

### TEST 2 : Nouveau Film (CRITIQUE - 5 min)

**Action :**

1. Taper "Film Test 2024" (inexistant)
2. Remplir année/genre
3. Remplir recette
4. Soumettre

**Vérifier :**

- ✅ Film créé avec `status: false`
- ✅ Recette créée et liée
- ✅ Transaction atomique

---

### TEST 3 : Validation (2 min)

**Action :**

1. Laisser champs vides
2. Tenter soumission

**Vérifier :**

- ✅ Alerte JavaScript
- ✅ Soumission bloquée

---

## 📋 DOCUMENTATION COMPLÈTE

- **Plan détaillé :** `docs/PLAN_TEST_WORKFLOW_UNIFIE.md`
- **Guide rapide :** `docs/GUIDE_TEST_WORKFLOW.md`
- **Checklist :** `docs/CHECKLIST_TEST_RAPIDE.md`

---

## 🔧 ÉLÉMENTS TECHNIQUES VÉRIFIÉS

### Backend

- ✅ Route : `POST /add-recipes-movies/movie-and-recipe`
- ✅ Transaction : Sequelize avec rollback
- ✅ Détection doublons : Op.iLike sur titre + année
- ✅ Validation : Champs obligatoires vérifiés

### Frontend

- ✅ Formulaire unifié : Action `/movie-and-recipe`
- ✅ Champs hidden : `filmId`, `title`, `year`, `genre`
- ✅ Synchronisation : Script `unified-form-handler.js`
- ✅ Validation client : Messages d'alerte

---

**Commencer les tests maintenant !** 🚀
