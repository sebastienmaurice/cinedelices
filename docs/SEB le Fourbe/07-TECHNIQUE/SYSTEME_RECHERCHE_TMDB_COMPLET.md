# Documentation Complète - Système de Recherche avec TMDB

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Compréhension du code](#compréhension-du-code)
4. [Requêtes API](#requêtes-api)
5. [Mise en place Backend](#mise-en-place-backend)
6. [Mise en place Frontend](#mise-en-place-frontend)
7. [Configuration et variables d'environnement](#configuration-et-variables-denvironnement)
8. [Flux de données](#flux-de-données)
9. [Gestion du cache](#gestion-du-cache)
10. [Tests et débogage](#tests-et-débogage)

---

## Vue d'ensemble

Le système de recherche Ciné Délices combine :
- **Recherche locale** : Films et séries stockés dans la base de données PostgreSQL
- **Enrichissement TMDB** : Recherche et enrichissement via l'API The Movie Database
- **Fuzzy search** : Recherche approximative avec scoring de pertinence
- **Cache LRU** : Mise en cache des résultats pour optimiser les performances
- **Recherche parallèle** : Films ET séries recherchés simultanément

### Fonctionnalités principales

- ✅ Recherche fuzzy avec scoring de pertinence (0-100)
- ✅ Recherche parallèle films + séries sur TMDB
- ✅ Cache LRU avec TTL (1 heure par défaut)
- ✅ Détection automatique des doublons
- ✅ Enrichissement automatique avec données TMDB
- ✅ Navigation clavier dans les résultats
- ✅ Debounce dynamique selon vitesse de frappe
- ✅ Highlight des mots correspondants

---

## Architecture du système

### Structure des fichiers

```
app/
├── controllers/
│   ├── movies.controllers.js      # Contrôleur principal (recherche avancée)
│   └── tmdb.controllers.js        # Contrôleur TMDB (recherche simple)
├── routes/
│   ├── movies.route.js            # Routes de recherche
│   └── tmdb.route.js              # Routes TMDB
├── utils/
│   ├── search-utils.js            # Utilitaires de recherche (fuzzy, scoring)
│   └── search-cache.js           # Système de cache LRU
├── models/
│   └── movie.model.js            # Modèle Sequelize (avec champ type)
└── public/js/
    ├── movie-search-advanced.js  # Script frontend recherche avancée
    └── movie-search.js           # Script frontend recherche simple (legacy)
```

### Flux général

```
[Frontend] → [Backend Controller] → [Search Utils] → [Database + TMDB API] → [Cache] → [Response]
```

---

## Compréhension du code

### 1. Utilitaires de recherche (`app/utils/search-utils.js`)

#### `levenshteinDistance(str1, str2)`

Calcule la distance de Levenshtein entre deux chaînes (nombre de modifications nécessaires).

**Algorithme** : Programmation dynamique avec tableau 2D
- **Complexité** : O(m × n) où m et n sont les longueurs des chaînes
- **Retour** : Distance (0 = identique, plus élevé = plus différent)

**Exemple** :
```javascript
levenshteinDistance("harry", "harry") // 0
levenshteinDistance("harry", "harri") // 1
levenshteinDistance("harry", "potter") // 6
```

#### `normalizeText(text)`

Normalise un texte pour la recherche :
- Convertit en minuscules
- Retire les accents (NFD normalization)
- Retire la ponctuation
- Normalise les espaces

**Exemple** :
```javascript
normalizeText("Harry Potter & l'Ordre") // "harry potter lordre"
```

#### `similarityScore(str1, str2)`

Calcule un score de similarité entre 0 et 1 :
- **1** = identique
- **0** = complètement différent

**Formule** : `1 - (distance / maxLength)`

#### `extractKeywords(query)`

Extrait les mots-clés d'une requête en retirant :
- Articles (le, la, les, un, une, des)
- Prépositions (de, du, avec, pour, dans)
- Mots de moins de 3 caractères

**Exemple** :
```javascript
extractKeywords("Le Retour vers le futur") // ["retour", "vers", "futur"]
```

#### `calculateRelevanceScore(movie, query)`

Calcule un score de pertinence (0-100) pour un film selon plusieurs critères :

| Critère | Poids | Description |
|---------|-------|-------------|
| Correspondance exacte titre | 40 | Titre identique à la requête |
| Titre commence par requête | 35 | Titre commence par la requête |
| Titre contient requête | 30 | Titre contient la requête |
| Similarité fuzzy | 30 | Score de similarité × 30 |
| Genre correspond | 15 | Genre correspond à la requête |
| Année correspond | 10 | Année exacte correspond |
| Année proche (±2 ans) | 5 | Année à ±2 ans |
| Film validé | 5 | Bonus pour films avec status=true |

**Score maximum** : 100

#### `sortByRelevance(movies)`

Trie les films par score de pertinence décroissant, puis par titre alphabétique en cas d'égalité.

---

### 2. Système de cache (`app/utils/search-cache.js`)

#### Classe `SearchCache`

**Paramètres** :
- `maxSize` : Nombre maximum d'entrées (défaut : 100)
- `defaultTTL` : Durée de vie par défaut en ms (défaut : 3600000 = 1h)

**Méthodes principales** :

- `generateKey(query, filters)` : Génère une clé de cache unique
- `get(key)` : Récupère une valeur (retourne `null` si expirée)
- `set(key, data, ttl)` : Stocke une valeur avec TTL optionnel
- `delete(key)` : Supprime une entrée
- `clear()` : Vide tout le cache
- `cleanExpired()` : Supprime les entrées expirées
- `size()` : Retourne le nombre d'entrées
- `getStats()` : Retourne les statistiques du cache

**Nettoyage automatique** : Toutes les 30 minutes

**Stratégie LRU** : Les entrées les plus récemment utilisées sont conservées en priorité.

---

### 3. Contrôleur de recherche avancée (`app/controllers/movies.controllers.js`)

#### `searchMoviesAdvanced(req, res)`

**Fonction principale de recherche avancée**

**Paramètres de requête** :
- `query` : Terme de recherche (minimum 2 caractères)
- `genre` : Filtre optionnel par genre
- `year` : Filtre optionnel par année

**Processus** :

1. **Validation** :
   - Vérifie que la requête fait au moins 2 caractères
   - Retourne un tableau vide si trop court

2. **Vérification du cache** :
   - Génère une clé de cache basée sur la requête et les filtres
   - Si trouvé dans le cache → retourne immédiatement

3. **Recherche locale** :
   - Récupère tous les films validés (`status: true`)
   - Filtre par genre si fourni
   - Filtre par année si fournie
   - Calcule le score de pertinence pour chaque film
   - Filtre avec seuil minimum de 35 points
   - Trie par score décroissant

4. **Recherche TMDB** (si `TMDB_API_KEY` configurée) :
   - **Recherche parallèle** : Films ET séries simultanément
   - **Stratégie de recherche intelligente** :
     a. Recherche avec la requête originale
     b. Si aucun résultat → recherche avec mots-clés extraits
     c. Si toujours aucun → recherche avec premier mot-clé seulement
   - **Formatage des résultats** :
     - Films : `title`, `release_date`, `type: "film"`
     - Séries : `name`, `first_air_date`, `type: "serie"`
   - **Mapping des genres** : Conversion des IDs TMDB vers noms français
   - **Détection des doublons** : Compare avec films locaux pour éviter les doublons

5. **Combinaison et tri** :
   - Combine films locaux + films TMDB + séries TMDB
   - **Priorité de tri** :
     1. Films locaux TOUJOURS en premier
     2. Puis par score de pertinence décroissant
     3. Puis par titre alphabétique
   - Limite à 5 résultats au total

6. **Formatage de la réponse** :
   - Enrichit avec chemins d'images pour films locaux
   - Ajoute les métadonnées TMDB pour films/séries externes
   - Structure JSON standardisée

7. **Mise en cache** :
   - Stocke le résultat dans le cache avec TTL par défaut

**Structure de réponse** :

```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "title_fr": "Harry Potter",
      "title_en": "Harry Potter",
      "year": 2001,
      "genre": "fantastique",
      "note": null,
      "overview": "...",
      "poster": "/images/movies/...",
      "score": 95,
      "tmdb_enriched": false,
      "isLocal": true,
      "tmdb_id": null,
      "type": "film"
    },
    {
      "id": 105,
      "title_fr": "Retour vers le futur",
      "title_en": "Back to the Future",
      "year": 1985,
      "genre": "science-fiction",
      "note": null,
      "overview": "...",
      "poster": "https://image.tmdb.org/t/p/w500/...",
      "score": 90,
      "tmdb_enriched": true,
      "isLocal": false,
      "tmdb_id": 105,
      "type": "film"
    }
  ],
  "hasResults": true,
  "query": "harry potter",
  "filters": {
    "genre": null,
    "year": null
  },
  "cached": false
}
```

#### `getTmdbInfo(req, res)`

**Récupère les informations complètes d'un film/série depuis TMDB**

**Paramètres** :
- `tmdb_id` : ID TMDB du film/série
- `type` (query) : `"film"` ou `"serie"` (optionnel, détection auto si absent)

**Processus** :

1. **Détermination du type** :
   - Si `type` fourni → utilise l'endpoint correspondant
   - Sinon → essaie d'abord `/movie/{id}`, puis `/tv/{id}` en fallback si 404

2. **Appel API TMDB** :
   - Endpoint : `/movie/{id}` ou `/tv/{id}`
   - Langue : `fr-FR` (titres français)

3. **Formatage** :
   - Mapping des genres TMDB → genres français
   - Extraction des métadonnées (titre, année, synopsis, images, note)
   - Gestion différenciée films/séries (champs différents)

**Structure de réponse** :

```json
{
  "success": true,
  "movie": {
    "tmdb_id": 105,
    "title_fr": "Retour vers le futur",
    "title_en": "Back to the Future",
    "year": 1985,
    "genre": "science-fiction",
    "genres": ["science-fiction", "aventure", "comédie"],
    "note": "8.5",
    "overview": "...",
    "poster": "https://image.tmdb.org/t/p/w500/...",
    "backdrop": "https://image.tmdb.org/t/p/original/...",
    "release_date": "1985-07-03",
    "runtime": 116,
    "type": "film"
  }
}
```

---

### 4. Contrôleur TMDB simple (`app/controllers/tmdb.controllers.js`)

#### `searchMovie(req, res)`

**Recherche simple sur TMDB (utilisée pour pré-remplissage formulaire)**

**Paramètres** :
- `query` : Terme de recherche

**Processus** :

1. **Recherche intelligente** :
   - Essaie d'abord avec la requête originale
   - Si aucun résultat → essaie avec mots-clés extraits
   - Si toujours aucun → essaie avec premier mot-clé

2. **Formatage** :
   - Retourne le premier résultat comme suggestion principale
   - Retourne jusqu'à 5 résultats comme suggestions alternatives

**Utilisation** : Pré-remplissage automatique du formulaire d'ajout de film

---

## Requêtes API

### 1. Recherche avancée

**Endpoint** : `GET /movies/search-advanced`

**Paramètres de requête** :
- `query` (requis) : Terme de recherche (minimum 2 caractères)
- `genre` (optionnel) : Filtre par genre
- `year` (optionnel) : Filtre par année

**Exemples** :

```bash
# Recherche simple
GET /movies/search-advanced?query=harry%20potter

# Recherche avec filtre genre
GET /movies/search-advanced?query=harry&genre=fantastique

# Recherche avec filtre année
GET /movies/search-advanced?query=harry&year=2001

# Recherche complète
GET /movies/search-advanced?query=harry&genre=fantastique&year=2001
```

**Réponse** :

```json
{
  "success": true,
  "results": [...],
  "hasResults": true,
  "query": "harry potter",
  "filters": {
    "genre": null,
    "year": null
  },
  "cached": false
}
```

### 2. Recherche simple (legacy)

**Endpoint** : `GET /movies/api/search`

**Paramètres** :
- `query` (optionnel) : Terme de recherche

**Exemples** :

```bash
# Recherche avec terme
GET /movies/api/search?query=harry

# Tous les films (si query vide)
GET /movies/api/search
```

### 3. Informations TMDB complètes

**Endpoint** : `GET /movies/get-tmdb-info/:tmdb_id`

**Paramètres** :
- `tmdb_id` (requis) : ID TMDB du film/série
- `type` (optionnel) : `"film"` ou `"serie"`

**Exemples** :

```bash
# Film (détection auto)
GET /movies/get-tmdb-info/105

# Film explicite
GET /movies/get-tmdb-info/105?type=film

# Série explicite
GET /movies/get-tmdb-info/1396?type=serie
```

### 4. Recherche TMDB (pré-remplissage)

**Endpoint** : `GET /api/tmdb/search`

**Paramètres** :
- `query` (requis) : Terme de recherche

**Exemple** :

```bash
GET /api/tmdb/search?query=harry%20potter
```

**Réponse** :

```json
{
  "success": true,
  "hasResults": true,
  "movie": {
    "tmdb_id": 671,
    "title": "Harry Potter à l'école des sorciers",
    "original_title": "Harry Potter and the Philosopher's Stone",
    "year": 2001,
    "genre": "fantastique",
    "overview": "...",
    "poster_path": "https://image.tmdb.org/t/p/w500/...",
    "release_date": "2001-11-16"
  },
  "suggestions": [...]
}
```

### 5. Récupération film par ID

**Endpoint** : `GET /movies/api/get/:id`

**Paramètres** :
- `id` (requis) : ID du film dans la base de données

**Exemple** :

```bash
GET /movies/api/get/1
```

---

## Mise en place Backend

### 1. Configuration de la base de données

#### Migration : Ajout du champ `type`

```sql
-- Migration : Ajout colonne type pour films/séries
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS type VARCHAR(10) DEFAULT 'film';

-- Mettre à jour les films existants
UPDATE movies SET type = 'film' WHERE type IS NULL;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_movies_type ON movies(type);
```

#### Migration : Ajout du champ `tmdb_id`

```sql
-- Migration : Ajout colonne tmdb_id
ALTER TABLE movies
ADD COLUMN IF NOT EXISTS tmdb_id INTEGER UNIQUE;

-- Créer un index
CREATE INDEX IF NOT EXISTS idx_movies_tmdb_id ON movies(tmdb_id);
```

### 2. Variables d'environnement

Ajouter dans `.env` :

```env
# TMDB API Configuration
TMDB_API_KEY=votre_cle_api_tmdb
TMDB_API_URL=https://api.themoviedb.org/3
```

### 3. Installation des dépendances

Aucune dépendance supplémentaire requise (utilise `fetch` natif de Node.js 18+).

### 4. Structure des routes

**Fichier** : `app/routes/movies.route.js`

```javascript
import { Router } from "express";
import moviesController from "../controllers/movies.controllers.js";

const moviesRouter = Router();

// Route recherche avancée (DOIT être avant /:genre)
moviesRouter.get("/search-advanced", moviesController.searchMoviesAdvanced);

// Route recherche simple (legacy)
moviesRouter.get("/api/search", moviesController.searchMovies);

// Route infos TMDB complètes
moviesRouter.get("/get-tmdb-info/:tmdb_id", moviesController.getTmdbInfo);

// Route récupération film par ID
moviesRouter.get("/api/get/:id", moviesController.getMovieById);

// Route filtrage par genre (DOIT être en dernier)
moviesRouter.get("/:genre", moviesController.filtredMovies);

export default moviesRouter;
```

**Fichier** : `app/routes/tmdb.route.js`

```javascript
import { Router } from "express";
import tmdbController from "../controllers/tmdb.controllers.js";

const tmdbRouter = Router();

// Route recherche TMDB (pré-remplissage)
tmdbRouter.get("/search", tmdbController.searchMovie);

export default tmdbRouter;
```

### 5. Mapping des genres TMDB

Les genres TMDB sont des IDs numériques. Le système les convertit en noms français :

```javascript
const genreMap = {
  28: "action",
  12: "aventure",
  16: "animation",
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
  10749: "romance",
  878: "science-fiction",
  10770: "téléfilm",
  53: "thriller",
  10752: "guerre",
  37: "western",
};
```

---

## Mise en place Frontend

### 1. Structure HTML

**Fichier** : `app/views/movies.ejs`

```html
<div class="banner__search__films">
  <div class="search-container">
    <div class="search-input-wrapper">
      <input
        type="text"
        id="search-movie"
        name="search-movie"
        class="search__input__film"
        placeholder="Rechercher un film ou une série ..."
        autocomplete="off"
        aria-label="Rechercher un film"
      />
      <button
        type="button"
        id="search-boost-button"
        class="btn-search-boost"
        title="Recherche boostée"
        aria-label="Recherche boostée"
      >
        <i class="fa-solid fa-robot"></i>
      </button>
    </div>

    <!-- Dropdown des résultats -->
    <div id="search-results" class="search-results" aria-live="polite">
      <!-- Résultats injectés dynamiquement -->
    </div>
  </div>
</div>
```

### 2. Script JavaScript

**Fichier** : `app/public/js/movie-search-advanced.js`

**Fonctionnalités principales** :

#### Debounce dynamique

```javascript
// Vitesse de frappe détectée automatiquement
// - Frappe rapide (< 100ms entre touches) → debounce 600ms
// - Frappe normale (100-500ms) → debounce 400ms
// - Frappe lente (> 500ms) → debounce 200ms
```

#### Navigation clavier

- **↑ ↓** : Navigation dans les résultats
- **Enter** : Sélection du résultat
- **Escape** : Fermer le dropdown

#### Affichage des résultats

- **Mini-cartes** : 60x90px avec poster
- **Badges** : "Ciné Délices" (films locaux), "Film", "Série"
- **Highlight** : Mots correspondants mis en évidence
- **Score** : Affichage du score de pertinence (optionnel)

#### Filtrage de la liste

- Filtre automatiquement la liste principale (`#movies__list`)
- Affiche uniquement les films correspondants

### 3. Styles CSS

**Fichier** : `app/public/css/movies.css`

**Classes principales** :

- `.search-results` : Conteneur du dropdown
- `.search-result-card` : Carte de résultat individuelle
- `.search-result-card.is-local` : Film existant dans Ciné Délices
- `.search-result-card-type--film` : Badge film (doré)
- `.search-result-card-type--serie` : Badge série (bleu)
- `.search-result-highlight` : Highlight des mots correspondants

### 4. Chargement des scripts

Dans `movies.ejs` :

```html
<!-- Scripts JS spécifiques à la page -->
<script src="/js/movie-search-advanced.js" defer></script>
```

---

## Configuration et variables d'environnement

### Variables requises

**Fichier** : `.env`

```env
# TMDB API
TMDB_API_KEY=votre_cle_api_ici
TMDB_API_URL=https://api.themoviedb.org/3
```

### Obtenir une clé API TMDB

1. Créer un compte sur [themoviedb.org](https://www.themoviedb.org/)
2. Aller dans [Settings > API](https://www.themoviedb.org/settings/api)
3. Demander une clé API (gratuite pour projets non commerciaux)
4. Copier la clé dans `.env`

### Configuration du cache

**Fichier** : `app/utils/search-cache.js`

```javascript
// Modifier les paramètres par défaut si nécessaire
export const searchCache = new SearchCache(
  100,        // maxSize : nombre maximum d'entrées
  3600000     // defaultTTL : 1 heure en millisecondes
);
```

---

## Flux de données

### Recherche avancée complète

```
1. Utilisateur tape dans le champ de recherche
   ↓
2. Debounce dynamique (200-600ms selon vitesse)
   ↓
3. Frontend : fetch("/movies/search-advanced?query=...")
   ↓
4. Backend : Vérification cache
   ├─ Cache hit → Retourne immédiatement
   └─ Cache miss → Continue
   ↓
5. Backend : Recherche locale
   ├─ Récupère films validés
   ├─ Filtre par genre/année si fourni
   ├─ Calcule score de pertinence
   └─ Trie par score
   ↓
6. Backend : Recherche TMDB (si API_KEY configurée)
   ├─ Recherche films (/search/movie)
   ├─ Recherche séries (/search/tv)
   ├─ Stratégie intelligente (variantes de requête)
   └─ Formatage des résultats
   ↓
7. Backend : Combinaison et tri
   ├─ Films locaux en priorité
   ├─ Puis par score décroissant
   └─ Limite à 5 résultats
   ↓
8. Backend : Mise en cache
   ↓
9. Backend : Réponse JSON
   ↓
10. Frontend : Affichage dans dropdown
    ├─ Mini-cartes avec posters
    ├─ Badges Film/Série
    └─ Highlight des mots
   ↓
11. Frontend : Filtrage de la liste principale
```

### Pré-remplissage formulaire

```
1. Utilisateur tape dans "Nom du film" (formulaire ajout)
   ↓
2. Debounce 400ms
   ↓
3. Frontend : fetch("/api/tmdb/search?query=...")
   ↓
4. Backend : Recherche TMDB
   ├─ Requête originale
   ├─ Mots-clés si aucun résultat
   └─ Premier mot-clé si toujours aucun
   ↓
5. Backend : Retourne premier résultat + suggestions
   ↓
6. Frontend : Pré-remplit les champs
   ├─ Titre (français)
   ├─ Année
   ├─ Genre
   └─ tmdb_id
```

---

## Gestion du cache

### Stratégie LRU (Least Recently Used)

- **Taille maximale** : 100 entrées par défaut
- **TTL** : 1 heure par défaut
- **Nettoyage** : Automatique toutes les 30 minutes

### Clé de cache

Format : `search:{query}:{filters_json}`

Exemples :
- `search:harry potter:{"genre":null,"year":null}`
- `search:harry:{"genre":"fantastique","year":"2001"}`

### Gestion de l'expiration

- Vérification automatique à chaque `get()`
- Entrées expirées supprimées automatiquement
- Nettoyage périodique toutes les 30 minutes

### Statistiques

```javascript
const stats = searchCache.getStats();
// { size: 45, maxSize: 100, defaultTTL: 3600000 }
```

---

## Tests et débogage

### Tests manuels

#### 1. Recherche simple

```bash
curl "http://localhost:3000/movies/search-advanced?query=harry"
```

#### 2. Recherche avec filtres

```bash
curl "http://localhost:3000/movies/search-advanced?query=harry&genre=fantastique&year=2001"
```

#### 3. Informations TMDB

```bash
curl "http://localhost:3000/movies/get-tmdb-info/105"
```

#### 4. Recherche TMDB (pré-remplissage)

```bash
curl "http://localhost:3000/api/tmdb/search?query=harry%20potter"
```

### Tests dans le navigateur

1. Aller sur `/movies`
2. Taper dans le champ de recherche
3. Vérifier :
   - Affichage du dropdown
   - Résultats locaux en premier
   - Badges Film/Série
   - Navigation clavier
   - Highlight des mots

### Logs de débogage

Le système affiche des logs dans la console :

- `📦 Résultat récupéré du cache` : Cache hit
- `❌ Erreur lors de la recherche TMDB` : Erreur API TMDB
- `🔍 Aucun résultat avec "...", essai avec mots-clés` : Recherche avec variantes

### Points de contrôle

1. **Vérifier la clé API** :
   ```javascript
   console.log(process.env.TMDB_API_KEY); // Ne doit pas être undefined
   ```

2. **Vérifier le cache** :
   ```javascript
   console.log(searchCache.getStats());
   ```

3. **Vérifier les résultats** :
   - Ouvrir la console navigateur
   - Vérifier les réponses API dans l'onglet Network

---

## Mapping des genres TMDB

| ID TMDB | Genre français | ID TMDB | Genre français |
|---------|----------------|---------|----------------|
| 28 | action | 10751 | familial |
| 12 | aventure | 14 | fantastique |
| 16 | animation | 36 | histoire |
| 35 | comédie | 27 | horreur |
| 80 | crime | 10402 | musique |
| 99 | documentaire | 9648 | mystère |
| 18 | drame | 10749 | romance |
| 878 | science-fiction | 10770 | téléfilm |
| 53 | thriller | 10752 | guerre |
| 37 | western | | |

---

## Endpoints TMDB utilisés

### 1. Recherche de films

```
GET https://api.themoviedb.org/3/search/movie
?api_key={API_KEY}
&language=fr-FR
&query={query}
```

### 2. Recherche de séries

```
GET https://api.themoviedb.org/3/search/tv
?api_key={API_KEY}
&language=fr-FR
&query={query}
```

### 3. Détails d'un film

```
GET https://api.themoviedb.org/3/movie/{tmdb_id}
?api_key={API_KEY}
&language=fr-FR
```

### 4. Détails d'une série

```
GET https://api.themoviedb.org/3/tv/{tmdb_id}
?api_key={API_KEY}
&language=fr-FR
```

### 5. Images TMDB

Les images sont servies via CDN :

- **Poster** : `https://image.tmdb.org/t/p/w500{poster_path}`
- **Backdrop** : `https://image.tmdb.org/t/p/original{backdrop_path}`

---

## Structure des données

### Film local (Base de données)

```javascript
{
  id: 1,
  title: "Harry Potter",
  year: 2001,
  genre: "fantastique",
  status: true,
  type: "film",
  tmdb_id: 671,
  // ... autres champs
}
```

### Film TMDB (formaté)

```javascript
{
  tmdb_id: 671,
  title_fr: "Harry Potter à l'école des sorciers",
  title_en: "Harry Potter and the Philosopher's Stone",
  year: 2001,
  genre: "fantastique",
  overview: "...",
  poster: "https://image.tmdb.org/t/p/w500/...",
  score: 95,
  tmdb_enriched: true,
  isLocal: false,
  type: "film"
}
```

### Série TMDB (formaté)

```javascript
{
  tmdb_id: 1396,
  title_fr: "Breaking Bad",
  title_en: "Breaking Bad",
  year: 2008,
  genre: "drame",
  overview: "...",
  poster: "https://image.tmdb.org/t/p/w500/...",
  score: 90,
  tmdb_enriched: true,
  isLocal: false,
  type: "serie"
}
```

---

## Optimisations et bonnes pratiques

### 1. Cache

- ✅ Cache LRU pour éviter les requêtes répétées
- ✅ TTL configurable pour équilibrer fraîcheur/performance
- ✅ Nettoyage automatique des entrées expirées

### 2. Recherche intelligente

- ✅ Stratégie de recherche avec variantes (requête originale → mots-clés → premier mot-clé)
- ✅ Détection automatique des doublons
- ✅ Seuil de pertinence minimum (35 points) pour éviter faux positifs

### 3. Performance

- ✅ Limite à 5 résultats au total
- ✅ Recherche parallèle films + séries
- ✅ Debounce dynamique selon vitesse de frappe

### 4. Expérience utilisateur

- ✅ Films locaux toujours en premier
- ✅ Badges visuels (Ciné Délices, Film, Série)
- ✅ Navigation clavier complète
- ✅ Highlight des mots correspondants
- ✅ Message si aucun résultat avec bouton "Créer une fiche"

---

## Limitations et améliorations futures

### Limitations actuelles

- ⚠️ Recherche phonétique non implémentée (Double Metaphone FR)
- ⚠️ Recherche acteurs/réalisateurs non implémentée
- ⚠️ Enrichissement complet séries TMDB (détails) non implémenté

### Améliorations possibles

1. **Recherche sémantique** : Utilisation d'embeddings IA
2. **Recherche phonétique** : Double Metaphone FR pour tolérance aux fautes
3. **Recherche étendue** : Acteurs, réalisateurs, mots-clés
4. **Enrichissement séries** : Détails complets via `/tv/{id}`
5. **Suggestions intelligentes** : Autocomplétion basée sur l'historique
6. **Recherche multi-langue** : Support anglais, espagnol, etc.

---

## Dépannage

### Problème : Aucun résultat TMDB

**Causes possibles** :
- Clé API non configurée ou invalide
- Rate limit TMDB atteint
- Erreur réseau

**Solutions** :
1. Vérifier `TMDB_API_KEY` dans `.env`
2. Vérifier les logs serveur pour erreurs API
3. Tester directement l'API TMDB avec curl

### Problème : Cache ne fonctionne pas

**Causes possibles** :
- Cache vidé au redémarrage serveur (mémoire)
- TTL trop court

**Solutions** :
1. Vérifier les statistiques du cache : `searchCache.getStats()`
2. Augmenter le TTL si nécessaire
3. Considérer un cache persistant (Redis) pour production

### Problème : Résultats non pertinents

**Causes possibles** :
- Seuil de pertinence trop bas
- Requête trop vague

**Solutions** :
1. Augmenter `MIN_SCORE_THRESHOLD` dans `searchMoviesAdvanced()`
2. Améliorer l'algorithme de scoring dans `calculateRelevanceScore()`

### Problème : Doublons dans les résultats

**Causes possibles** :
- Fonction `isSameMovie()` trop permissive
- Normalisation des titres insuffisante

**Solutions** :
1. Améliorer la logique de comparaison dans `isSameMovie()`
2. Utiliser `tmdb_id` pour détecter les doublons si disponible

---

## Références

- **Documentation TMDB** : [https://developers.themoviedb.org/3](https://developers.themoviedb.org/3)
- **API Search Movies** : [https://developers.themoviedb.org/3/search/search-movies](https://developers.themoviedb.org/3/search/search-movies)
- **API Search TV** : [https://developers.themoviedb.org/3/search/search-tv](https://developers.themoviedb.org/3/search/search-tv)
- **Distance de Levenshtein** : [Wikipedia](https://fr.wikipedia.org/wiki/Distance_de_Levenshtein)

---

**Date de création** : 2024  
**Dernière mise à jour** : 2024  
**Version** : 1.0
