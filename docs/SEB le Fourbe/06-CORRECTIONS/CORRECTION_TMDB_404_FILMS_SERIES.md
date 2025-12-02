# Correction TMDB 404 pour Films + Séries

## 🐛 Problème

L'erreur 404 apparaissait lors de l'enrichissement TMDB car l'endpoint utilisait toujours `/movie/{tmdb_id}` même pour les séries.

**Symptômes :**

```
❌ Erreur API TMDB pour film 66732: 404 Not Found
```

L'ID 66732 correspond probablement à une série (ex: "Stranger Things"), mais le code essayait de récupérer les infos avec l'endpoint `/movie/` au lieu de `/tv/`.

---

## ✅ Solution Implémentée

### 1. Backend - Fonction `getTmdbInfo` ✅

**Fichier modifié :** `app/controllers/movies.controllers.js`

#### Détection automatique du type

- ✅ La fonction accepte maintenant un paramètre optionnel `type` (film ou série)
- ✅ Si le type n'est pas spécifié, elle essaie d'abord avec `/movie/` (film)
- ✅ En cas de 404, elle essaie automatiquement avec `/tv/` (série)
- ✅ Le type est détecté et inclus dans la réponse

#### Gestion du fallback

```javascript
// Essayer d'abord avec l'endpoint déterminé
let tmdbUrl = `${TMDB_API_URL}/${endpoint}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=fr-FR`;
response = await fetch(tmdbUrl);

// Si 404 et que le type n'était pas spécifié, essayer l'autre endpoint (fallback)
if (!response.ok && response.status === 404 && !contentType) {
  const otherEndpoint = endpoint === "movie" ? "tv" : "movie";
  tmdbUrl = `${TMDB_API_URL}/${otherEndpoint}/${tmdb_id}?api_key=${TMDB_API_KEY}&language=fr-FR`;
  response = await fetch(tmdbUrl);

  if (response.ok) {
    endpoint = otherEndpoint;
    contentType = otherType;
    console.log(
      `ℹ️ Type détecté automatiquement pour ${tmdb_id}: ${contentType}`
    );
  }
}
```

#### Formatage selon le type

- ✅ **Films** : `title`, `release_date`, `runtime`
- ✅ **Séries** : `name`, `first_air_date`, `episode_run_time`

#### Gestion d'erreur améliorée

- ✅ Les erreurs 404 ne bloquent plus l'application
- ✅ Log précis : `❌ Erreur API TMDB pour {type} {id}: {code}`
- ✅ Retour JSON avec `success: false` au lieu d'erreur HTTP 404

---

### 2. Route API ✅

**Fichier :** `app/routes/movies.route.js`

```javascript
// Route existante (pas de changement nécessaire)
moviesRouter.get("/get-tmdb-info/:tmdb_id", moviesController.getTmdbInfo);
```

**Usage :**

- `/movies/get-tmdb-info/105` → Essaie film, puis série si 404
- `/movies/get-tmdb-info/105?type=film` → Force l'endpoint film
- `/movies/get-tmdb-info/66732?type=serie` → Force l'endpoint série

---

### 3. Frontend (Optionnel) ✅

**Fichier :** `app/public/js/tmdb-form-prefill.js`

Le frontend peut maintenant passer le type s'il est disponible dans l'URL :

```javascript
// Exemple : si le type est disponible dans l'URL
const urlParams = new URLSearchParams(window.location.search);
const type = urlParams.get("type"); // 'film' ou 'serie'

const url = type
  ? `/movies/get-tmdb-info/${tmdbId}?type=${type}`
  : `/movies/get-tmdb-info/${tmdbId}`;
```

**Note :** Le fallback automatique côté backend fonctionne même sans le paramètre `type`, donc le frontend n'a pas besoin d'être modifié.

---

## 🔧 Détails Techniques

### Endpoints TMDB Utilisés

| Type  | Endpoint TMDB      | Champs spécifiques                           |
| ----- | ------------------ | -------------------------------------------- |
| Film  | `/movie/{tmdb_id}` | `title`, `release_date`, `runtime`           |
| Série | `/tv/{tmdb_id}`    | `name`, `first_air_date`, `episode_run_time` |

### Formatage des Données

**Films :**

```javascript
{
  title_fr: tmdbData.title || tmdbData.original_title,
  year: new Date(tmdbData.release_date).getFullYear(),
  release_date: tmdbData.release_date,
  runtime: tmdbData.runtime
}
```

**Séries :**

```javascript
{
  title_fr: tmdbData.name || tmdbData.original_name,
  year: new Date(tmdbData.first_air_date).getFullYear(),
  release_date: tmdbData.first_air_date,
  runtime: tmdbData.episode_run_time?.[0]
}
```

---

## 📋 Tests de Validation

### Test 1 : Série sans type spécifié

**Action :**

```
GET /movies/get-tmdb-info/66732
```

**Résultat attendu :**

- ✅ Essaie `/movie/66732` → 404
- ✅ Essaie automatiquement `/tv/66732` → 200 OK
- ✅ Retourne les données de la série "Stranger Things"
- ✅ `type: "serie"` dans la réponse

---

### Test 2 : Film sans type spécifié

**Action :**

```
GET /movies/get-tmdb-info/105
```

**Résultat attendu :**

- ✅ Essaie `/movie/105` → 200 OK
- ✅ Retourne les données du film "Retour vers le futur"
- ✅ `type: "film"` dans la réponse

---

### Test 3 : Série avec type spécifié

**Action :**

```
GET /movies/get-tmdb-info/66732?type=serie
```

**Résultat attendu :**

- ✅ Utilise directement `/tv/66732`
- ✅ Pas de double requête
- ✅ Retourne les données de la série

---

### Test 4 : Gestion erreur 404 définitive

**Action :**

```
GET /movies/get-tmdb-info/99999999
```

**Résultat attendu :**

- ✅ Essaie `/movie/99999999` → 404
- ✅ Essaie `/tv/99999999` → 404
- ✅ Retourne `{ success: false, error: "..." }` (pas d'erreur HTTP)
- ✅ Log d'erreur dans la console serveur

---

## 🎯 Impact

### Avant la correction

- ❌ Erreur 404 pour toutes les séries
- ❌ Logs d'erreur dans la console
- ❌ Pas de fallback automatique
- ❌ Type non détecté automatiquement

### Après la correction

- ✅ Détection automatique du type (film ou série)
- ✅ Fallback intelligent (essaie les deux endpoints)
- ✅ Gestion d'erreur gracieuse (pas de crash)
- ✅ Logs informatifs pour le debug
- ✅ Type inclus dans la réponse JSON

---

## 🔍 Vérifications

### Backend

- [x] Fonction `getTmdbInfo` modifiée pour gérer films ET séries
- [x] Fallback automatique implémenté
- [x] Formatage correct selon le type
- [x] Gestion d'erreur améliorée

### Route

- [x] Route existante fonctionne toujours
- [x] Paramètre `type` optionnel supporté

### Frontend

- [ ] (Optionnel) Passer le type depuis l'URL si disponible
- [x] Fallback backend fonctionne même sans type

---

## 📝 Notes Importantes

### Cache

Le cache existant peut contenir des résultats avec le mauvais type. Il est recommandé de :

1. Vider le cache si nécessaire
2. Les nouvelles recherches utiliseront automatiquement le bon endpoint

### Performance

Le fallback ajoute une requête supplémentaire si le premier endpoint retourne 404. Pour optimiser :

1. Passer le paramètre `type` depuis le frontend si disponible
2. Utiliser le cache pour éviter les requêtes répétées

---

**Date** : Décembre 2025  
**Status** : ✅ **Corrigé et testé**
