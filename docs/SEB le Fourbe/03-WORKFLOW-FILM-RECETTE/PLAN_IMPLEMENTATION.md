# PLAN D'IMPLÉMENTATION - Workflow Film + Recette avec IA

**Date :** 2025-12-01  
**Objectif :** Intégrer l'autocomplétion IA et améliorer le workflow d'ajout film + recette

---

## 🎯 PHASE 1 : AUTocomplétion Films (Priorité 1)

### ✅ Étape 1.1 : Intégrer le script et le dropdown

- [ ] Charger `movie-autocomplete-form.js` dans la vue
- [ ] Ajouter le dropdown HTML avec wrapper position relative
- [ ] Ajouter les styles CSS adaptés de `movies.css`

### ✅ Étape 1.2 : Détection doublons

- [ ] Vérifier film existant avant création
- [ ] Bloquer création si doublon trouvé
- [ ] Message utilisateur clair en cas de doublon

---

## 🎯 PHASE 2 : Workflow Unifié (Priorité 2)

### ✅ Étape 2.1 : Transaction film + recette

- [ ] Créer route unifiée POST `/add-recipes-movies/movie-and-recipe`
- [ ] Implémenter transaction Sequelize
- [ ] Rollback automatique en cas d'erreur

### ✅ Étape 2.2 : Messages de confirmation

- [ ] Message succès : "Ta recette est envoyée à Ciné Délices et sera contrôlée en admin sous 24h"
- [ ] Messages d'erreur clairs
- [ ] Affichage conditionnel dans la vue

---

## 🎯 PHASE 3 : Fonctionnalités IA Recette (Priorité 3)

### ✅ Étape 3.1 : Correction orthographique

- [ ] API de correction pour nom recette
- [ ] Suggestions en temps réel

### ✅ Étape 3.2 : Suggestions catégorie/difficulté

- [ ] IA suggère catégorie basée sur le nom
- [ ] IA suggère difficulté basée sur le temps

### ✅ Étape 3.3 : Enrichissement contexte

- [ ] Suggestions pour le contexte de recette
- [ ] Placeholders intelligents

---

## 🎯 PHASE 4 : Améliorations UX/UI (Priorité 4)

### ✅ Étape 4.1 : Validation côté client

- [ ] Validation HTML5
- [ ] Messages d'erreur inline
- [ ] Désactivation bouton si formulaire invalide

### ✅ Étape 4.2 : Animations

- [ ] Animation dropdown autocomplétion
- [ ] Transitions fluides

---

**Ordre d'implémentation :** Phase 1 → Phase 2 → Phase 3 → Phase 4
