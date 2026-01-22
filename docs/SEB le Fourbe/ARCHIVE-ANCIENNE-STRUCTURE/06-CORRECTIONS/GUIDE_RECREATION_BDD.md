# Guide - Recréation de la Base de Données

## 🔄 Commandes Disponibles

### 1. `npm run db:init` - Réinitialisation Complète

**Commande :**

```bash
npm run db:init
```

**Ce qu'elle fait :**

1. ✅ **Supprime** toutes les tables existantes (`DROP TABLE`)
2. ✅ **Recrée** toutes les tables (`CREATE TABLE`)
3. ✅ **Insère** des données de base (users, movies, recipes, notices, etc.)

**⚠️ ATTENTION :**

- **TOUTES les données sont PERDUES** (films, recettes, utilisateurs, etc.)
- C'est une **réinitialisation complète**

**Quand l'utiliser :**

- En **développement** pour repartir de zéro
- Pour **tester** avec des données propres
- Si vous voulez **tout réinitialiser**

---

### 2. `npm run db:migrate` - Migration (Ajout de colonne)

**Commande :**

```bash
npm run db:migrate
```

**Ce qu'elle fait :**

1. ✅ **Ajoute** uniquement la colonne `tmdb_id` à la table `movies`
2. ✅ **Préserve** toutes les données existantes
3. ✅ **Crée** un index sur `tmdb_id`

**⚠️ ATTENTION :**

- **Ne supprime rien**
- **Préserve toutes les données**

**Quand l'utiliser :**

- En **production** pour ajouter une nouvelle colonne
- Pour **mettre à jour le schéma** sans perdre les données

---

## 📋 Processus de Réinitialisation Complète

Si vous voulez **recréer complètement** votre base de données :

```bash
npm run db:init
```

**Ce qui se passe :**

1. **Suppression** de toutes les tables :

   - `users_recipes`
   - `notices`
   - `recipes`
   - `movies`
   - `users`

2. **Recréation** de toutes les tables avec le schéma complet :

   - Table `users` (id, first_name, last_name, pseudo, email, password, picture, role)
   - Table `movies` (id, title, year, genre, picture, status, **tmdb_id**)
   - Table `recipes` (id, name, time, category, difficulty, description, ingredients, preparation, picture, id_movie, status)
   - Table `notices` (id, quote, id_recipe, id_user)
   - Table `users_recipes` (id_user, id_recipe)

3. **Insertion** des données de base :
   - 3 utilisateurs admin (ludo, pipou, Semauri)
   - 5 films de base (Harry Potter, American pie, Bienvenue chez les Ch'tis, Le silence des agneaux, Indiana Jones)
   - Des recettes et notices d'exemple

---

## ✅ Vérification Après Réinitialisation

Après avoir lancé `npm run db:init`, vérifiez :

1. **Connexion à la base de données** :

   ```bash
   psql -U cinedelices -d cinedelices
   ```

2. **Vérifier les tables** :

   ```sql
   \dt
   ```

3. **Vérifier les données** :

   ```sql
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM movies;
   SELECT COUNT(*) FROM recipes;
   ```

4. **Vérifier la colonne tmdb_id** :
   ```sql
   \d movies
   ```
   (Doit afficher la colonne `tmdb_id INTEGER UNIQUE`)

---

## 🔧 Script SQL Utilisé

**Fichier :** `app/data/create_db.sql`

**Contenu :**

- Suppression des tables
- Création des tables avec schéma complet
- Insertion des données de base
- Création des index (dont `idx_movies_tmdb_id`)

---

## 📝 Migration vs Initialisation

| Aspect          | `db:init`                  | `db:migrate`                |
| --------------- | -------------------------- | --------------------------- |
| **Action**      | Réinitialisation complète  | Ajout de colonne uniquement |
| **Suppression** | ✅ Oui (toutes les tables) | ❌ Non                      |
| **Données**     | ❌ Perdues                 | ✅ Préservées               |
| **Utilisation** | Développement/Test         | Production/Mise à jour      |
| **Temps**       | ~5-10 secondes             | ~1 seconde                  |

---

## ⚠️ Avertissements

### Avant `npm run db:init` :

1. **⚠️ Sauvegardez vos données** si vous avez des données importantes :

   ```bash
   pg_dump -U cinedelices -d cinedelices > backup.sql
   ```

2. **⚠️ Fermez votre serveur** si il tourne :

   ```bash
   # Arrêter le serveur (Ctrl+C)
   ```

3. **⚠️ Vérifiez que vous êtes en développement** (pas en production avec des données réelles)

### Après `npm run db:init` :

1. **Redémarrez votre serveur** :

   ```bash
   npm run dev
   ```

2. **Vérifiez que tout fonctionne** :
   - Connexion à la base
   - Affichage des pages
   - Insertion de données

---

## 🎯 Résumé

**Pour recréer complètement la base de données :**

```bash
npm run db:init
```

**Pour ajouter uniquement une colonne (sans perdre de données) :**

```bash
npm run db:migrate
```

**Pour harmoniser les genres existants (optionnel) :**

```bash
npm run db:migrate-genres
```

_(Met à jour "animé" → "animation" et "romantique" → "romance" dans les films existants)_

---

**Date** : Décembre 2025  
**Status** : ✅ **Documentation complète**
