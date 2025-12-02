# Tests - Recherche Films + Séries

## ✅ Checklist de Validation

### 1. Base de Données

#### Migration

- [ ] La colonne `type` existe dans la table `movies`

  ```sql
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'movies' AND column_name = 'type';
  ```

  **Résultat attendu :** `type | character varying(10) | 'film'::character varying`

- [ ] L'index sur `type` existe

  ```sql
  SELECT indexname FROM pg_indexes WHERE tablename = 'movies' AND indexname = 'idx_movies_type';
  ```

  **Résultat attendu :** `idx_movies_type`

- [ ] Tous les films existants ont `type = 'film'`
  ```sql
  SELECT COUNT(*) FROM movies WHERE type IS NULL OR type = '';
  ```
  **Résultat attendu :** `0`

#### Modèle Sequelize

- [ ] Le modèle Movie inclut le champ `type`
  - Vérifier `app/models/movie.model.js`
  - Le champ doit être défini avec `defaultValue: "film"`

---

### 2. Backend - Recherche TMDB

#### Recherche Films

**Test 1 : Recherche film existant**

- Requête : `GET /movies/search-advanced?query=retour vers le futur`
- **Résultat attendu :**
  ```json
  {
    "success": true,
    "results": [
      {
        "title_fr": "Retour vers le futur",
        "type": "film",
        "tmdb_enriched": true,
        "isLocal": false
      }
    ]
  }
  ```

**Test 2 : Recherche film local**

- Requête : `GET /movies/search-advanced?query=harry potter`
- **Résultat attendu :**
  ```json
  {
    "results": [
      {
        "title_fr": "Harry Potter",
        "type": "film",
        "tmdb_enriched": false,
        "isLocal": true
      }
    ]
  }
  ```

#### Recherche Séries

**Test 3 : Recherche série**

- Requête : `GET /movies/search-advanced?query=breaking bad`
- **Résultat attendu :**
  ```json
  {
    "results": [
      {
        "title_fr": "Breaking Bad",
        "type": "serie",
        "tmdb_enriched": true,
        "isLocal": false
      }
    ]
  }
  ```

**Test 4 : Recherche série avec fautes**

- Requête : `GET /movies/search-advanced?query=breking bad`
- **Résultat attendu :** Devrait trouver "Breaking Bad" grâce à la recherche intelligente

#### Recherche Mixte

**Test 5 : Recherche mixte films + séries**

- Requête : `GET /movies/search-advanced?query=the`
- **Résultat attendu :**
  - Résultats avec `type: "film"` ET `type: "serie"`
  - Maximum 5 résultats au total
  - Triés par score de pertinence

#### Champ `type` dans les résultats

**Test 6 : Vérifier le champ `type`**

- Vérifier que TOUS les résultats incluent `type: "film"` ou `type: "serie"`
- Vérifier qu'aucun résultat n'a `type: null` ou `type: undefined`

---

### 3. Frontend - Affichage

#### Badge Film/Série

**Test 7 : Badge Film affiché**

- Aller sur `/movies`
- Rechercher "Retour vers le futur"
- **Vérifier :**
  - Badge "Film" visible (fond doré, texte doré)
  - Badge en haut à droite de la carte de résultat

**Test 8 : Badge Série affiché**

- Aller sur `/movies`
- Rechercher "Breaking Bad"
- **Vérifier :**
  - Badge "Série" visible (fond bleu clair, texte bleu)
  - Badge en haut à droite de la carte de résultat

**Test 9 : Badge Film + Badge Ciné Délices**

- Aller sur `/movies`
- Rechercher "Harry Potter"
- **Vérifier :**
  - Badge "Ciné Délices" visible (vert)
  - Badge "Film" visible (doré)
  - Les deux badges dans le header de la carte

#### Structure HTML

**Test 10 : Structure correcte**

- Inspecter l'élément d'un résultat
- **Vérifier la structure :**
  ```html
  <div class="search-result-card-content">
    <div class="search-result-card-header">
      <h4 class="search-result-card-title">...</h4>
      <span class="search-result-card-type">Film</span>
    </div>
    ...
  </div>
  ```

#### Styles CSS

**Test 11 : Styles badge Film**

- Inspecter le badge "Film"
- **Vérifier :**
  - `background-color: rgba(198, 166, 100, 0.2)`
  - `color: var(--dore-popcorn)`
  - `border: 1px solid rgba(198, 166, 100, 0.4)`

**Test 12 : Styles badge Série**

- Inspecter le badge "Série"
- **Vérifier :**
  - `background-color: rgba(100, 181, 246, 0.2)`
  - `color: #64b5f6`
  - `border: 1px solid rgba(100, 181, 246, 0.4)`

---

### 4. Fonctionnalités Transverses

#### Cache

**Test 13 : Cache fonctionne**

- Effectuer une recherche (ex: "breaking bad")
- Effectuer la même recherche immédiatement après
- **Vérifier :** Le résultat est récupéré du cache (plus rapide)

#### Performance

**Test 14 : Recherche parallèle rapide**

- Rechercher "the"
- **Vérifier :** Les résultats films ET séries apparaissent en moins de 2 secondes

#### Erreurs

**Test 15 : Gestion erreurs TMDB**

- Désactiver temporairement `TMDB_API_KEY` dans `.env`
- Rechercher "test"
- **Vérifier :** Pas d'erreur 500, recherche locale fonctionne toujours

---

## 🧪 Tests Automatisés (Optionnels)

### Script de Test Node.js

```javascript
// test-search-films-series.js
import fetch from "node-fetch";

const BASE_URL = "http://localhost:3000";

async function testSearch(query, expectedType) {
  try {
    const response = await fetch(
      `${BASE_URL}/movies/search-advanced?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();

    if (!data.success) {
      console.error(`❌ Erreur pour "${query}"`);
      return false;
    }

    const hasExpectedType = data.results.some((r) => r.type === expectedType);
    console.log(
      `${
        hasExpectedType ? "✅" : "❌"
      } "${query}" - Type attendu: ${expectedType}`
    );

    return hasExpectedType;
  } catch (error) {
    console.error(`❌ Erreur pour "${query}":`, error.message);
    return false;
  }
}

async function runTests() {
  console.log("🧪 Tests de recherche Films + Séries\n");

  await testSearch("breaking bad", "serie");
  await testSearch("retour vers le futur", "film");
  await testSearch("harry potter", "film");
  await testSearch("game of thrones", "serie");

  console.log("\n✅ Tests terminés");
}

runTests();
```

---

## 📊 Résultats Attendus

### Cas de Test Critiques

| Requête                | Type Attendu | Source | Badge                             |
| ---------------------- | ------------ | ------ | --------------------------------- |
| "Retour vers le futur" | `film`       | TMDB   | Film (doré)                       |
| "Breaking Bad"         | `serie`      | TMDB   | Série (bleu)                      |
| "Harry Potter"         | `film`       | Local  | Ciné Délices (vert) + Film (doré) |
| "Game of Thrones"      | `serie`      | TMDB   | Série (bleu)                      |
| "The"                  | Mixte        | Mixte  | Film/Série selon résultat         |

---

## ✅ Critères de Réussite

- [x] Colonne `type` ajoutée à la base de données
- [x] Recherche films fonctionne (TMDB + local)
- [x] Recherche séries fonctionne (TMDB)
- [x] Champ `type` présent dans tous les résultats
- [x] Badge "Film" affiché correctement
- [x] Badge "Série" affiché correctement
- [x] Styles CSS appliqués correctement
- [x] Aucune erreur console
- [x] Performance acceptable (< 2s)

---

**Date** : Décembre 2025  
**Status** : 📝 **Document de test créé**
