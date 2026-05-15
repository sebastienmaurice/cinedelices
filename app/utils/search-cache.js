/**
 * Système de cache LRU avec TTL pour les résultats de recherche
 * TTL par défaut : 1 heure
 */

class SearchCache {
  constructor(maxSize = 100, defaultTTL = 3600000) {
    // maxSize : nombre maximum d'entrées dans le cache
    // defaultTTL : TTL par défaut en millisecondes (1h = 3600000ms)
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.cache = new Map(); // Structure: key -> { data, timestamp, ttl }
  }

  /**
   * Génère une clé de cache à partir d'une requête et de filtres
   * 
   * @param {string} query - Requête de recherche
   * @param {object} filters - Filtres optionnels (genre, year, etc.)
   * @returns {string} - Clé de cache
   */
  generateKey(query, filters = {}) {
    const normalizedQuery = (query || "").toLowerCase().trim();
    const filtersStr = JSON.stringify(filters);
    return `search:${normalizedQuery}:${filtersStr}`;
  }

  /**
   * Récupère une valeur du cache si elle existe et n'est pas expirée
   * 
   * @param {string} key - Clé de cache
   * @returns {*} - Données en cache ou null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Vérifier si l'entrée est expirée
    const now = Date.now();
    const age = now - entry.timestamp;
    
    if (age >= entry.ttl) {
      // Entrée expirée, la supprimer
      this.cache.delete(key);
      return null;
    }
    
    // Réorganiser : déplacer en fin (LRU)
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  /**
   * Stocke une valeur dans le cache
   * 
   * @param {string} key - Clé de cache
   * @param {*} data - Données à mettre en cache
   * @param {number} ttl - TTL en millisecondes (optionnel, utilise defaultTTL si non fourni)
   */
  set(key, data, ttl = null) {
    // Si le cache est plein, supprimer la plus ancienne entrée (LRU)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      // Supprimer la première entrée (la plus ancienne)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    
    // Si la clé existe déjà, la supprimer d'abord
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Ajouter la nouvelle entrée en fin (LRU)
    this.cache.set(key, entry);
  }

  /**
   * Supprime une entrée du cache
   * 
   * @param {string} key - Clé de cache
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Vide complètement le cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Supprime toutes les entrées expirées
   * Utile pour un nettoyage périodique
   */
  cleanExpired() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age >= entry.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach((key) => this.cache.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Retourne la taille actuelle du cache
   * 
   * @returns {number} - Nombre d'entrées dans le cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Retourne les statistiques du cache
   * 
   * @returns {object} - Statistiques (size, maxSize, defaultTTL)
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      defaultTTL: this.defaultTTL,
    };
  }
}

// Instance singleton du cache de recherche
export const searchCache = new SearchCache(100, 3600000); // 100 entrées max, TTL 1h

// Nettoyage automatique toutes les 30 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const cleaned = searchCache.cleanExpired();
    // Log uniquement en développement
    if (cleaned > 0 && process.env.NODE_ENV !== "production") {
      console.log(`🧹 Cache nettoyé : ${cleaned} entrées expirées supprimées`);
    }
  }, 30 * 60 * 1000); // 30 minutes
}

export default searchCache;
