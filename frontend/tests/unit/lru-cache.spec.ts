import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LRUCache } from '@/utils/lru-cache';

describe('LRUCache', () => {
  describe('constructor', () => {
    it('should create a cache with the specified max size', () => {
      const cache = new LRUCache<string, number>(5);
      expect(cache.size).toBe(0);
      expect(cache.getStats().maxSize).toBe(5);
    });

    it('should throw error if max size is 0 or negative', () => {
      expect(() => new LRUCache<string, number>(0)).toThrow();
      expect(() => new LRUCache<string, number>(-1)).toThrow();
    });
  });

  describe('set and get', () => {
    let cache: LRUCache<string, number>;

    beforeEach(() => {
      cache = new LRUCache<string, number>(3);
    });

    it('should store and retrieve values', () => {
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      expect(cache.get('a')).toBe(1);
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should update existing values', () => {
      cache.set('a', 1);
      cache.set('a', 100);
      expect(cache.get('a')).toBe(100);
    });

    it('should track cache size correctly', () => {
      expect(cache.size).toBe(0);
      cache.set('a', 1);
      expect(cache.size).toBe(1);
      cache.set('b', 2);
      expect(cache.size).toBe(2);
      cache.set('c', 3);
      expect(cache.size).toBe(3);
    });
  });

  describe('has', () => {
    it('should check if key exists without updating access time', () => {
      const cache = new LRUCache<string, number>(2);
      cache.set('a', 1);
      
      expect(cache.has('a')).toBe(true);
      expect(cache.has('b')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove entries', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      expect(cache.delete('a')).toBe(true);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.size).toBe(1);
    });

    it('should return false when deleting non-existent key', () => {
      const cache = new LRUCache<string, number>(3);
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      cache.clear();
      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBeUndefined();
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when cache is full', () => {
      vi.useFakeTimers();
      const cache = new LRUCache<string, number>(3);

      // Fill cache
      vi.setSystemTime(1000);
      cache.set('a', 1);
      
      vi.setSystemTime(2000);
      cache.set('b', 2);
      
      vi.setSystemTime(3000);
      cache.set('c', 3);

      // Access 'a' to make it more recently used than 'b'
      vi.setSystemTime(4000);
      cache.get('a');

      // Add new item - should evict 'b' (least recently used)
      vi.setSystemTime(5000);
      cache.set('d', 4);

      expect(cache.get('a')).toBe(1); // Still in cache
      expect(cache.get('b')).toBeUndefined(); // Evicted
      expect(cache.get('c')).toBe(3); // Still in cache
      expect(cache.get('d')).toBe(4); // Newly added

      vi.useRealTimers();
    });

    it('should evict based on access time, not insertion time', () => {
      vi.useFakeTimers();
      const cache = new LRUCache<string, number>(3);

      // Insert in order: a, b, c
      vi.setSystemTime(1000);
      cache.set('a', 1);
      
      vi.setSystemTime(2000);
      cache.set('b', 2);
      
      vi.setSystemTime(3000);
      cache.set('c', 3);

      // Access in reverse order: c, b, a
      vi.setSystemTime(4000);
      cache.get('c');
      
      vi.setSystemTime(5000);
      cache.get('b');
      
      vi.setSystemTime(6000);
      cache.get('a');

      // Add new item - should evict 'c' (accessed at 4000, oldest access)
      vi.setSystemTime(7000);
      cache.set('d', 4);

      expect(cache.get('a')).toBe(1); // Accessed at 6000
      expect(cache.get('b')).toBe(2); // Accessed at 5000
      expect(cache.get('c')).toBeUndefined(); // Evicted (accessed at 4000)
      expect(cache.get('d')).toBe(4); // Newly added

      vi.useRealTimers();
    });

    it('should handle multiple evictions correctly', () => {
      const cache = new LRUCache<string, number>(2);

      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3); // Evicts 'a'
      cache.set('d', 4); // Evicts 'b'

      expect(cache.get('a')).toBeUndefined();
      expect(cache.get('b')).toBeUndefined();
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });
  });

  describe('keys, values, entries', () => {
    it('should return all keys', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      const keys = cache.keys();
      expect(keys).toHaveLength(3);
      expect(keys).toContain('a');
      expect(keys).toContain('b');
      expect(keys).toContain('c');
    });

    it('should return all values', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);
      cache.set('c', 3);

      const values = cache.values();
      expect(values).toHaveLength(3);
      expect(values).toContain(1);
      expect(values).toContain(2);
      expect(values).toContain(3);
    });

    it('should return all entries', () => {
      const cache = new LRUCache<string, number>(3);
      cache.set('a', 1);
      cache.set('b', 2);

      const entries = cache.entries();
      expect(entries).toHaveLength(2);
      expect(entries).toContainEqual(['a', 1]);
      expect(entries).toContainEqual(['b', 2]);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      vi.useFakeTimers();
      const cache = new LRUCache<string, number>(5);

      vi.setSystemTime(1000);
      cache.set('a', 1);
      
      vi.setSystemTime(2000);
      cache.set('b', 2);

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
      expect(stats.utilizationPercent).toBe(40);
      expect(stats.oldestAccessTime).toBe(1000);
      expect(stats.newestAccessTime).toBe(2000);

      vi.useRealTimers();
    });

    it('should return null times for empty cache', () => {
      const cache = new LRUCache<string, number>(5);
      const stats = cache.getStats();
      
      expect(stats.size).toBe(0);
      expect(stats.oldestAccessTime).toBeNull();
      expect(stats.newestAccessTime).toBeNull();
    });
  });

  describe('complex types', () => {
    it('should work with object values', () => {
      interface User {
        id: number;
        name: string;
      }

      const cache = new LRUCache<string, User>(3);
      cache.set('user1', { id: 1, name: 'Alice' });
      cache.set('user2', { id: 2, name: 'Bob' });

      expect(cache.get('user1')).toEqual({ id: 1, name: 'Alice' });
      expect(cache.get('user2')).toEqual({ id: 2, name: 'Bob' });
    });

    it('should work with number keys', () => {
      const cache = new LRUCache<number, string>(3);
      cache.set(1, 'one');
      cache.set(2, 'two');

      expect(cache.get(1)).toBe('one');
      expect(cache.get(2)).toBe('two');
    });
  });
});

