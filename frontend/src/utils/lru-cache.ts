/**
 * Least Recently Used (LRU) Cache
 * 
 * A simple, type-safe LRU cache implementation that evicts the least recently
 * accessed item when the cache reaches its maximum size.
 * 
 * @example
 * ```typescript
 * const cache = new LRUCache<string, User>(100);
 * 
 * cache.set('user1', { id: 1, name: 'Alice' });
 * const user = cache.get('user1'); // Updates last access time
 * 
 * cache.delete('user1');
 * cache.clear();
 * ```
 */

interface CacheEntry<V> {
  value: V;
  lastAccess: number;
}

export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>>;
  private maxSize: number;

  /**
   * Create a new LRU cache
   * @param maxSize Maximum number of entries to store
   */
  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('LRU cache size must be greater than 0');
    }
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a value from the cache
   * Updates the last access time if the key exists
   * @param key The key to look up
   * @returns The cached value, or undefined if not found
   */
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      // Update last access time on cache hit
      entry.lastAccess = Date.now();
      return entry.value;
    }
    return undefined;
  }

  /**
   * Check if a key exists in the cache without updating access time
   * @param key The key to check
   * @returns True if the key exists
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Add or update a value in the cache
   * Evicts the least recently accessed entry if cache is full
   * @param key The key to set
   * @param value The value to store
   */
  set(key: K, value: V): void {
    this.cache.set(key, {
      value,
      lastAccess: Date.now(),
    });
    this.evictIfNeeded();
  }

  /**
   * Remove a specific entry from the cache
   * @param key The key to remove
   * @returns True if the key existed and was removed
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Remove all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys currently in the cache
   * @returns Array of keys
   */
  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values currently in the cache
   * @returns Array of values
   */
  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * Get all entries currently in the cache
   * @returns Array of [key, value] tuples
   */
  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  /**
   * Evict the least recently accessed entry if cache exceeds max size
   * @private
   */
  private evictIfNeeded(): void {
    if (this.cache.size > this.maxSize) {
      let lruKey: K | null = null;
      let lruTime = Infinity;

      // Find the entry with the oldest access time
      for (const [key, entry] of this.cache.entries()) {
        if (entry.lastAccess < lruTime) {
          lruTime = entry.lastAccess;
          lruKey = key;
        }
      }

      // Evict the least recently used entry
      if (lruKey !== null) {
        this.cache.delete(lruKey);
      }
    }
  }

  /**
   * Get cache statistics for debugging
   * @returns Object with cache stats
   */
  getStats(): {
    size: number;
    maxSize: number;
    utilizationPercent: number;
    oldestAccessTime: number | null;
    newestAccessTime: number | null;
  } {
    let oldestTime: number | null = null;
    let newestTime: number | null = null;

    for (const entry of this.cache.values()) {
      if (oldestTime === null || entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
      }
      if (newestTime === null || entry.lastAccess > newestTime) {
        newestTime = entry.lastAccess;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: (this.cache.size / this.maxSize) * 100,
      oldestAccessTime: oldestTime,
      newestAccessTime: newestTime,
    };
  }
}

