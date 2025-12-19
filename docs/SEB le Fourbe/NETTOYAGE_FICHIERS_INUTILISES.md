# Nettoyage des fichiers inutilisés - Étape 3.1

**Date** : 18 décembre 2025

## Fichiers identifiés comme inutilisés

### ❌ À supprimer

1. **`app/db/client.js`**
   - Client PostgreSQL non utilisé
   - Le projet utilise uniquement Sequelize (`app/database/sequelize-client.js`)
   - Aucune importation trouvée dans le codebase
   - **Action** : Supprimer le fichier et le dossier `app/db/` s'il est vide

2. **`app/data/create_db.sql.back`**
   - Fichier de backup SQL
   - Version de sauvegarde de `create_db.sql`
   - Non référencé dans les scripts npm ou dans le code
   - **Action** : Supprimer (le fichier original `create_db.sql` est conservé)

### ⚠️ Conservés (avec justification)

1. **`app/utils/entity-validator.js`**
   - **Statut** : Créé lors du refactoring Étape 2 mais non encore utilisé
   - **Raison** : Helper préparé pour une future simplification des fonctions validate/reject dans `admin.controllers.js`
   - **Action** : Conserver avec commentaire explicatif

2. **`app/utils/cleanup.js`**
   - **Statut** : Fonctionnalité préparée mais non activée (`CLEANUP_ENABLED = false`)
   - **Raison** : Code préparé pour nettoyage automatique des images orphelines (future fonctionnalité)
   - **Action** : Conserver (documentation indique que c'est intentionnel)

## Résultat

- **2 fichiers supprimés**
- **2 fichiers conservés** (justifiés)
