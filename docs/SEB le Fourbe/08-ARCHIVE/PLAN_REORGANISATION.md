# Plan de Réorganisation - Documentation SEB le Fourbe

## 📋 Analyse des Fichiers (44 fichiers)

### Catégories Identifiées

1. **📊 Synthèses et Bilans** (6 fichiers)
   - BILAN_GLOBAL_PHASES_1-7.md
   - SYNTHESE_FINALE.md
   - RAPPORT_FINAL.md
   - VALIDATION_FINALE_PHASE8.md
   - GUIDE_UTILISATEUR_FINAL.md
   - CENTRALISATION.md

2. **🔄 Phases du Projet** (6 fichiers)
   - PHASE6_RESUME.md
   - PHASE7_RESUME.md
   - VALIDATION_PHASE7.md
   - VERIFICATION_PHASE5.md
   - RESUME_IMPLEMENTATION_PHASE1.md

3. **🎬 TMDB** (6 fichiers - DOUBLONS avec docs/)
   - INTEGRATION_TMDB_COMPLETE.md ⚠️ DOUBLON
   - AMELIORATIONS_ET_CORRECTIONS_TMDB.md ⚠️ DOUBLON
   - README_TMDB.md ⚠️ DOUBLON
   - RESUME_DOCUMENTATION_TMDB.md ⚠️ DOUBLON
   - PLAN_INTEGRATION_TMDB.md
   - INSTRUCTIONS_TMDB.md

4. **🎯 Workflow Film + Recette** (7 fichiers)
   - WORKFLOW_FILM_RECETTE_RESUME.md
   - RESUME_WORKFLOW_UNIFIE.md
   - PLAN_IMPLEMENTATION_WORKFLOW_IA.md
   - PROGRESSION_WORKFLOW_IA.md
   - INSPECTION_ADD_RECIPES_MOVIES_ETAPE1.md
   - TEST_AUTOCOMPLETION_ETAPE2.md
   - CORRECTION_DROPDOWN_VISIBILITE.md

5. **🧪 Tests** (7 fichiers)
   - README_TESTS.md
   - CHECKLIST_TEST_RAPIDE.md
   - GUIDE_TEST_WORKFLOW.md
   - RAPPORT_TEST_WORKFLOW.md
   - PLAN_TEST_WORKFLOW_UNIFIE.md
   - VERIFICATION_PRE_TEST.md

6. **🖼️ Images** (5 fichiers)
   - RAPPORT_IMPLEMENTATION_IMAGES.md
   - AUDIT_IMPORT_IMAGES.md
   - RATIO_16-9_VS_21-9_ANALYSIS.md
   - PIPELINE_README.md
   - PIPELINE_INTEGRATION.md

7. **🐛 Corrections** (4 fichiers)
   - PROBLEME_FILM_ADMIN.md
   - SOLUTION_FILM_ADMIN.md

8. **📝 Modifications Journalières** (3 fichiers)
   - modifications-20-11-25-seb.md
   - modifications-21-11-25-seb.md
   - modifications-24-11-25-seb.md

9. **📐 Techniques** (4 fichiers)
   - STRUCTURE_PARTIALS.md
   - mapping-variables-css.md
   - INTEGRATION_EXAMPLE.md
   - README.md (image-utils.js)

---

## 🗂️ Structure Proposée

```
docs/SEB le Fourbe/
├── README.md (nouveau - index général)
│
├── 01-SYNTHESE-GLOBALE/
│   ├── BILAN_GLOBAL_PHASES_1-7.md
│   ├── SYNTHESE_FINALE.md
│   ├── RAPPORT_FINAL.md
│   └── GUIDE_UTILISATEUR_FINAL.md
│
├── 02-PHASES-DU-PROJET/
│   ├── PHASE1_RESUME.md (renommer)
│   ├── PHASE5_VERIFICATION.md (renommer)
│   ├── PHASE6_RESUME.md
│   ├── PHASE7_RESUME.md
│   ├── PHASE7_VALIDATION.md (renommer)
│   ├── PHASE8_VALIDATION.md (renommer)
│   └── CENTRALISATION.md
│
├── 03-WORKFLOW-FILM-RECETTE/
│   ├── WORKFLOW_RESUME.md (consolidation)
│   ├── PLAN_IMPLEMENTATION.md
│   ├── INSPECTION_ETAPE1.md
│   ├── TEST_AUTOCOMPLETION_ETAPE2.md
│   └── CORRECTION_DROPDOWN.md
│
├── 04-TESTS/
│   ├── README_TESTS.md
│   ├── CHECKLIST_RAPIDE.md
│   ├── GUIDE_TEST_WORKFLOW.md
│   ├── PLAN_TEST_UNIFIE.md
│   └── RAPPORT_TEST.md
│
├── 05-IMAGES/
│   ├── RAPPORT_IMPLEMENTATION.md
│   ├── AUDIT_IMPORT.md
│   ├── RATIO_ANALYSIS.md
│   └── PIPELINE.md (consolidation)
│
├── 06-CORRECTIONS/
│   ├── PROBLEME_FILM_ADMIN.md
│   └── SOLUTION_FILM_ADMIN.md
│
├── 07-TECHNIQUE/
│   ├── STRUCTURE_PARTIALS.md
│   ├── MAPPING_CSS.md (renommer)
│   ├── INTEGRATION_EXAMPLE.md
│   └── IMAGE_UTILS.md (renommer)
│
└── 08-ARCHIVE/
    ├── modifications-20-11-25-seb.md
    ├── modifications-21-11-25-seb.md
    └── modifications-24-11-25-seb.md
```

---

## ❌ Fichiers à Supprimer (Doublons)

Les fichiers suivants sont des copies de fichiers déjà dans `docs/` :

- INTEGRATION_TMDB_COMPLETE.md → Supprimer (existe dans docs/)
- AMELIORATIONS_ET_CORRECTIONS_TMDB.md → Supprimer (existe dans docs/)
- README_TMDB.md → Supprimer (existe dans docs/)
- RESUME_DOCUMENTATION_TMDB.md → Supprimer (existe dans docs/)
- PLAN_INTEGRATION_TMDB.md → Garder (plan initial)
- INSTRUCTIONS_TMDB.md → Garder (instructions spécifiques)

---

## ✅ Actions à Effectuer

1. Créer la structure de dossiers
2. Déplacer les fichiers dans les bons dossiers
3. Renommer les fichiers pour cohérence
4. Consolider les fichiers similaires
5. Supprimer les doublons
6. Créer README.md principal
