# Correction Erreur 500 - Champ `type` dans le modèle Movie

## 🐛 Problème

Après l'ajout du champ `type` dans le modèle Sequelize `Movie`, toutes les pages retournent une erreur 500.

**Symptômes :**

- Toutes les pages affichent : "Oups ! Une erreur est survenue 😢 erreur 500"
- Erreur serveur HTTP/1.1 500 Internal Server Error

## 🔍 Cause

Le modèle Sequelize `Movie` a été mis à jour pour inclure le champ `type`, mais :

1. La colonne `type` n'existe pas encore dans la base de données existante
2. Sequelize essaie d'utiliser cette colonne lors des requêtes
3. Cela provoque des erreurs SQL qui bloquent toutes les pages

## ✅ Solution

**Solution temporaire :** Retirer le champ `type` du modèle Sequelize jusqu'à ce que la migration soit exécutée.

**Fichier modifié :**

- `app/models/movie.model.js` - Champ `type` commenté temporairement

## 📝 Procédure de Correction

### 1. Le champ `type` a été temporairement retiré du modèle

Le champ est maintenant commenté dans `app/models/movie.model.js` pour éviter les erreurs.

### 2. Exécuter la migration pour ajouter la colonne

Une fois que vous êtes prêt à ajouter la colonne `type` à la base de données :

```bash
npm run db:migrate-type
```

Cette commande va :

- Ajouter la colonne `type VARCHAR(10) DEFAULT 'film'` à la table `movies`
- Mettre à jour tous les films existants avec `type = 'film'`
- Créer un index sur la colonne `type`

### 3. Réactiver le champ dans le modèle

Après la migration, décommentez le champ `type` dans `app/models/movie.model.js` :

```javascript
type: {
  type: DataTypes.STRING(10),
  defaultValue: "film",
  allowNull: false,
},
```

## ⚠️ Important

**NE PAS exécuter la migration si :**

- Vous n'êtes pas sûr que la base de données soit dans un état stable
- Vous avez des données importantes non sauvegardées

**Pour tester la migration :**

1. Faire un backup de la base de données
2. Exécuter la migration sur une base de test
3. Vérifier que tout fonctionne
4. Exécuter la migration sur la base de production

## 🔄 Migration SQL

La migration ajoute la colonne `type` avec la valeur par défaut `'film'` :

```sql
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'film';

UPDATE movies
SET type = 'film'
WHERE type IS NULL OR type = '';

CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(type);
```

---

**Date** : Décembre 2025  
**Status** : ✅ **Corrigé temporairement - Migration prête**
