# Plan d'Intégration TMDB - Validation Intelligente des Films

## Objectif

Implémenter une validation intelligente des films avec l'API TMDB pour :

- Empêcher la création de films fictifs ou mal orthographiés
- Remplacer automatiquement le titre par le vrai titre français
- Pré-remplir les champs (année, genre, tmdbId)
- Éviter les doublons via `tmdb_id`

## Étapes d'Implémentation

### 1. Base de Données ✅ À faire

- Ajouter le champ `tmdb_id` (INTEGER, nullable, unique) à la table `movies`
- Créer une migration SQL ou modifier `create_db.sql`

### 2. Modèle Sequelize ✅ À faire

- Ajouter `tmdb_id` au modèle `Movie`

### 3. Route API Backend ✅ À faire

- Créer `/api/tmdb/search` pour protéger la clé API
- Appeler l'API TMDB avec `language=fr-FR`
- Retourner les résultats formatés

### 4. Script JavaScript Frontend ✅ À faire

- Créer/modifier `tmdb-validator.js`
- Debounce 400ms sur le champ "Nom du film"
- Appeler l'API backend
- Gérer les résultats (succès/erreur)
- Pré-remplir les champs cachés

### 5. Formulaire HTML ✅ À faire

- Ajouter les champs cachés :
  - `tmdbId`
  - `titleFR`
  - `tmdbYear`
  - `tmdbGenre`

### 6. Controller Backend ✅ À faire

- Vérifier `tmdb_id` avant création
- Si `tmdb_id` existe → utiliser le film existant
- Sinon → créer avec `tmdb_id`

### 7. Validation ✅ À faire

- Bloquer la création si aucun résultat TMDB
- Afficher message : "Aucun film correspondant trouvé"

## Variables d'Environnement

Ajouter dans `.env` :

```
TMDB_API_KEY=votre_cle_api_tmdb
TMDB_API_URL=https://api.themoviedb.org/3
```

## API TMDB

**Endpoint :** `GET /search/movie`
**Paramètres :**

- `api_key` : clé API TMDB
- `language` : `fr-FR`
- `query` : titre du film

**Documentation :** https://developers.themoviedb.org/3/search/search-movies
