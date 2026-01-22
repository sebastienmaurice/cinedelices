# Ajout des Genres de Films Manquants

## 📋 Objectif

Ajouter tous les genres de films manquants dans le formulaire d'ajout de film pour correspondre à la liste complète des genres disponibles.

---

## ✅ Genres Ajoutés

### Genres Actuels (Avant)

Le formulaire ne contenait que **10 genres** :

- action
- animé
- aventure
- comédie
- drame
- fantastique
- horreur
- romantique
- science-fiction
- thriller

### Genres Complets (Après)

Le formulaire contient maintenant **19 genres** :

1. ✅ **Action**
2. ✅ **Animation** (renommé depuis "animé")
3. ✅ **Aventure**
4. ✅ **Comédie**
5. ✅ **Crime** (nouveau)
6. ✅ **Documentaire** (nouveau)
7. ✅ **Drame**
8. ✅ **Familial** (nouveau)
9. ✅ **Fantastique**
10. ✅ **Guerre** (nouveau)
11. ✅ **Histoire** (nouveau)
12. ✅ **Horreur**
13. ✅ **Musique** (nouveau)
14. ✅ **Mystère** (nouveau)
15. ✅ **Romance** (renommé depuis "romantique")
16. ✅ **Science-Fiction**
17. ✅ **Thriller**
18. ✅ **Téléfilm** (nouveau)
19. ✅ **Western** (nouveau)

---

## 🔧 Modifications Apportées

### 1. Formulaire d'Ajout de Film

**Fichier :** `app/views/add-recipes-movies.ejs`

**Modification :**

- ✅ Ajout de 9 nouveaux genres dans le select `#film-genre`
- ✅ Renommage "animé" → "animation"
- ✅ Renommage "romantique" → "romance"

**Genres ajoutés :**

```html
<option value="crime">Crime</option>
<option value="documentaire">Documentaire</option>
<option value="familial">Familial</option>
<option value="guerre">Guerre</option>
<option value="histoire">Histoire</option>
<option value="musique">Musique</option>
<option value="mystère">Mystère</option>
<option value="téléfilm">Téléfilm</option>
<option value="western">Western</option>
```

### 2. Harmonisation du Mapping TMDB

**Fichiers modifiés :**

- `app/controllers/tmdb.controllers.js`
- `app/controllers/movies.controllers.js` (2 occurrences)

**Modifications :**

- ✅ Changement "animé" → "animation" dans les mappings TMDB
- ✅ Changement "romantique" → "romance" dans les mappings TMDB

**Mapping TMDB complet :**

```javascript
const genreMap = {
  28: "action",
  12: "aventure",
  16: "animation", // Renommé depuis "animé"
  35: "comédie",
  80: "crime",
  99: "documentaire",
  18: "drame",
  10751: "familial",
  14: "fantastique",
  36: "histoire",
  27: "horreur",
  10402: "musique",
  9648: "mystère",
  10749: "romance", // Renommé depuis "romantique"
  878: "science-fiction",
  10770: "téléfilm",
  53: "thriller",
  10752: "guerre",
  37: "western",
};
```

### 3. Script SQL de Migration (Optionnel)

**Fichier :** `app/data/migration_update_genres.sql`

**Script créé pour harmoniser les genres existants :**

```sql
-- Mettre à jour "animé" vers "animation"
UPDATE movies
SET genre = 'animation'
WHERE genre = 'animé';

-- Mettre à jour "romantique" vers "romance"
UPDATE movies
SET genre = 'romance'
WHERE genre = 'romantique';
```

**Commande npm :**

```bash
npm run db:migrate-genres
```

⚠️ **Note :** Ce script est optionnel et ne met à jour que les films existants qui utilisent les anciens noms de genres.

---

## 📊 Correspondance TMDB → Genres Locaux

| ID TMDB | Genre TMDB      | Genre Local     |
| ------- | --------------- | --------------- |
| 28      | Action          | action          |
| 12      | Adventure       | aventure        |
| 16      | Animation       | animation       |
| 35      | Comedy          | comédie         |
| 80      | Crime           | crime           |
| 99      | Documentary     | documentaire    |
| 18      | Drama           | drame           |
| 10751   | Family          | familial        |
| 14      | Fantasy         | fantastique     |
| 36      | History         | histoire        |
| 27      | Horror          | horreur         |
| 10402   | Music           | musique         |
| 9648    | Mystery         | mystère         |
| 10749   | Romance         | romance         |
| 878     | Science Fiction | science-fiction |
| 10770   | TV Movie        | téléfilm        |
| 53      | Thriller        | thriller        |
| 10752   | War             | guerre          |
| 37      | Western         | western         |

---

## 🔄 Harmonisation des Genres Existants

Si vous avez des films existants dans votre base de données avec les anciens noms de genres :

1. **"animé"** → sera automatiquement converti en **"animation"** via le mapping TMDB
2. **"romantique"** → sera automatiquement converti en **"romance"** via le mapping TMDB

Pour mettre à jour les films existants dans la base de données :

```bash
npm run db:migrate-genres
```

Ce script mettra à jour uniquement les films qui utilisent encore les anciens noms.

---

## ✅ Fichiers Modifiés

### Créés

- ✅ `app/data/migration_update_genres.sql` - Script SQL pour harmoniser les genres existants

### Modifiés

- ✅ `app/views/add-recipes-movies.ejs` - Ajout de tous les genres dans le select
- ✅ `app/controllers/tmdb.controllers.js` - Harmonisation du mapping TMDB
- ✅ `app/controllers/movies.controllers.js` - Harmonisation des mappings TMDB (2 occurrences)
- ✅ `package.json` - Ajout du script `db:migrate-genres`

---

## 📝 Liste Complète des Genres Disponibles

Tous les genres suivants sont maintenant disponibles dans le formulaire d'ajout de film :

1. Action
2. Animation
3. Aventure
4. Comédie
5. Crime
6. Documentaire
7. Drame
8. Familial
9. Fantastique
10. Guerre
11. Histoire
12. Horreur
13. Musique
14. Mystère
15. Romance
16. Science-Fiction
17. Thriller
18. Téléfilm
19. Western

---

## 🎯 Utilisation

### Pour les Nouveaux Films

Tous les genres sont maintenant disponibles dans le select du formulaire `/add-recipes-movies/`.

### Pour les Films Existants

Si vous voulez harmoniser les genres existants dans la base de données :

```bash
npm run db:migrate-genres
```

⚠️ **Attention :** Cette commande mettra à jour tous les films qui utilisent "animé" ou "romantique".

---

**Date** : Décembre 2025  
**Status** : ✅ **Implémenté et fonctionnel**
