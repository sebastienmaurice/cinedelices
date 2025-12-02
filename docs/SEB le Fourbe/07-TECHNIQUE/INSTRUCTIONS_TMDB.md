# Instructions d'Installation TMDB

## Configuration de la Clé API TMDB

### 1. Obtenir une clé API TMDB

1. Créer un compte sur [The Movie Database](https://www.themoviedb.org/)
2. Aller dans [Settings > API](https://www.themoviedb.org/settings/api)
3. Demander une clé API (c'est gratuit pour les projets non commerciaux)
4. Copier votre clé API

### 2. Configurer la variable d'environnement

Ajouter dans votre fichier `.env` :

```env
TMDB_API_KEY=votre_cle_api_ici
TMDB_API_URL=https://api.themoviedb.org/3
```

### 3. Exécuter la migration de base de données

Exécuter le script SQL pour ajouter le champ `tmdb_id` :

```bash
psql -U cinedelices -d cinedelices -f ./app/data/migration_add_tmdb_id.sql
```

Ou manuellement dans psql :

```sql
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE;

CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
```

## Fonctionnalités

### Validation Intelligente

- **Debounce 400ms** : L'appel à l'API se fait 400ms après la dernière frappe
- **Recherche automatique** : Quand l'utilisateur tape un titre dans "Nom du film"
- **Titre français** : Remplace automatiquement le titre par le titre français de TMDB
- **Pré-remplissage** : Année, genre et tmdbId sont automatiquement remplis

### Protection contre les doublons

- Vérifie si un film avec le même `tmdb_id` existe déjà
- Si oui, réutilise le film existant
- Si non, crée un nouveau film avec le `tmdb_id`

### Blocage des films fictifs

- Si aucun résultat TMDB → Blocage de la création
- Message : "Aucun film correspondant trouvé. Veuillez vérifier le titre du film."

## Routes

- **API TMDB** : `GET /api/tmdb/search?query=titre`
  - Protégée par authentification (`isLogged`)
  - Retourne le premier résultat le plus pertinent

## Tests

1. Aller sur `/add-recipes-movies/`
2. Taper un titre de film (ex: "Harry Potter")
3. Attendre 400ms
4. Vérifier que :
   - Le titre est remplacé par le titre français
   - L'année est pré-remplie
   - Le genre est pré-rempli
   - Un message de confirmation apparaît

## Documentation TMDB

- [Documentation API](https://developers.themoviedb.org/3/search/search-movies)
- [Liste des genres](https://developers.themoviedb.org/3/genres/get-movie-list)
