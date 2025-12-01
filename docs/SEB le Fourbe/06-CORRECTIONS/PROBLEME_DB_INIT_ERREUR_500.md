# Problème : Erreur 500 après `npm run db:init`

## 📋 Résumé

Après avoir exécuté `npm run db:init`, toutes les pages du site retournaient une erreur 500. Le problème venait du fait que le script SQL d'initialisation ne créait pas la colonne `tmdb_id` dans la table `movies`, alors que cette colonne est requise par le modèle Sequelize.

---

## 🔍 Problème Identifié

### Symptômes

- Toutes les pages retournaient une erreur 500
- Erreur serveur générique affichée
- Le site était complètement inutilisable après l'exécution de `npm run db:init`

### Cause Racine

Le script `app/data/create_db.sql` ne contenait **pas la colonne `tmdb_id`** dans la définition de la table `movies`, alors que :

1. Cette colonne a été ajoutée récemment pour l'intégration TMDB
2. Le modèle Sequelize `Movie` (`app/models/movie.model.js`) définit cette colonne :
   ```javascript
   tmdb_id: { type: DataTypes.INTEGER, allowNull: true, unique: true }
   ```
3. Après `db:init`, la table `movies` était recréée sans cette colonne
4. Les requêtes Sequelize échouaient car elles tentaient d'accéder à une colonne inexistante

---

## ✅ Solution Appliquée

### 1. Correction du Script SQL

**Fichier :** `app/data/create_db.sql`

#### Avant (❌ Incorrect)

```sql
CREATE TABLE IF NOT EXISTS "movies" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "year" INT NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "picture" VARCHAR(255),
    "status" BOOLEAN DEFAULT FALSE
);
```

#### Après (✅ Corrigé)

```sql
CREATE TABLE IF NOT EXISTS "movies" (
    "id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "year" INT NOT NULL,
    "genre" VARCHAR(100) NOT NULL,
    "picture" VARCHAR(255),
    "status" BOOLEAN DEFAULT FALSE,
    "tmdb_id" INTEGER UNIQUE
);
```

### 2. Mise à Jour des INSERT

Les inserts ont été mis à jour pour inclure `tmdb_id` (avec valeur `NULL` pour les films existants) :

```sql
INSERT INTO movies (title, year, genre, picture, status, tmdb_id) VALUES
    ('Harry Potter', 2001, 'fantastique', '/images/movies/...', TRUE, NULL),
    -- ...
```

### 3. Ajout de l'Index

Un index a été ajouté pour améliorer les performances de recherche sur `tmdb_id` :

```sql
-- Créer un index pour améliorer les performances de recherche sur tmdb_id
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
```

### 4. Script de Migration Ajouté

**Fichier :** `package.json`

Un nouveau script npm a été ajouté pour appliquer la migration sans réinitialiser toute la base :

```json
{
  "scripts": {
    "dev": "node --watch index.js",
    "db:init": "psql -U cinedelices -d cinedelices -f ./app/data/create_db.sql",
    "db:migrate": "psql -U cinedelices -d cinedelices -f ./app/data/migration_add_tmdb_id.sql"
  }
}
```

---

## 🔧 Comment Corriger une Base Existante

### Option 1 : Appliquer la Migration (Recommandé)

Si vous avez déjà exécuté `db:init` et que votre base existe mais sans la colonne `tmdb_id`, utilisez la migration :

```bash
npm run db:migrate
```

Cette commande exécute `app/data/migration_add_tmdb_id.sql` qui :

- Ajoute la colonne `tmdb_id` si elle n'existe pas
- Crée l'index si nécessaire
- **Préserve toutes vos données existantes**

### Option 2 : Réinitialiser Complètement

Si vous pouvez vous permettre de perdre toutes les données (développement uniquement) :

```bash
npm run db:init
```

⚠️ **Attention** : Cette commande supprime et recrée toutes les tables. Toutes vos données seront perdues.

---

## 📝 Fichiers Modifiés

1. **`app/data/create_db.sql`**

   - Ajout de la colonne `tmdb_id` dans la définition de `movies`
   - Mise à jour des INSERT pour inclure `tmdb_id`
   - Ajout de l'index `idx_movies_tmdb_id`

2. **`package.json`**

   - Ajout du script `db:migrate` pour appliquer les migrations

3. **`app/data/migration_add_tmdb_id.sql`** (déjà existant)
   - Migration pour ajouter la colonne sans réinitialiser la base

---

## 🎯 Points d'Attention pour l'Avenir

### Vérifications à Faire

Lors de l'ajout de nouvelles colonnes aux modèles Sequelize, **toujours** :

1. ✅ Mettre à jour le modèle (`app/models/*.model.js`)
2. ✅ Mettre à jour le script `create_db.sql` avec la nouvelle colonne
3. ✅ Créer une migration SQL (`app/data/migration_*.sql`) pour les bases existantes
4. ✅ Mettre à jour les INSERT dans `create_db.sql` si nécessaire
5. ✅ Tester `db:init` dans un environnement de développement

### Checklist Ajout de Colonne

- [ ] Colonne ajoutée au modèle Sequelize
- [ ] Colonne ajoutée dans `create_db.sql` (CREATE TABLE)
- [ ] Colonne ajoutée dans les INSERT (si nécessaire)
- [ ] Migration créée pour les bases existantes
- [ ] Index créé si recherche fréquente sur cette colonne
- [ ] Script de migration testé

---

## 📚 Scripts SQL Disponibles

### `create_db.sql`

- **Utilisation** : `npm run db:init`
- **Action** : Supprime et recrée toutes les tables
- **Quand l'utiliser** : Initialisation complète de la base (développement)

### `migration_add_tmdb_id.sql`

- **Utilisation** : `npm run db:migrate`
- **Action** : Ajoute la colonne `tmdb_id` et son index
- **Quand l'utiliser** : Mettre à jour une base existante sans perdre de données

---

## 🔗 Liens Utiles

- **Migration TMDB** : `app/data/migration_add_tmdb_id.sql`
- **Script d'initialisation** : `app/data/create_db.sql`
- **Modèle Movie** : `app/models/movie.model.js`
- **Documentation TMDB** : `docs/INTEGRATION_TMDB_COMPLETE.md`

---

## ✅ Statut

**Problème résolu** ✅

- Script `create_db.sql` corrigé
- Migration disponible
- Script npm `db:migrate` ajouté
- Documentation complète

---

**Date** : Décembre 2025  
**Auteur** : SEB le Fourbe  
**Version** : 1.0
