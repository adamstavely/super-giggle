import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { CacheEntry } from '../../search/search.models';

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly maxCacheSize = 50;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private cache = new Map<string, CacheEntry<any>>();

  constructor() {
    // Clean up expired entries periodically
    setInterval(() => this.cleanExpiredEntries(), 60000); // Every minute
  }

  /**
   * Get cached data by key
   */
  get<T>(key: string): Observable<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return of(null);
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return of(null);
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = new Date();

    // Move to end (LRU - most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return of(entry.data);
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (ttl || this.defaultTTL));

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxCacheSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      expiresAt,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists in cache and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete cached entry
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }

  /**
   * Generate cache key from search query
   */
  generateSearchKey(query: string, filters?: any, sort?: string, page?: number, pageSize?: number): string {
    const parts = [query];

    if (filters) {
      const filterStr = JSON.stringify(filters, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      });
      parts.push(`filters:${filterStr}`);
    }

    if (sort) {
      parts.push(`sort:${sort}`);
    }

    if (page) {
      parts.push(`page:${page}`);
    }

    if (pageSize) {
      parts.push(`pageSize:${pageSize}`);
    }

    return parts.join('|');
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.cache.size === 0) {
      return;
    }

    let lruKey: string | null = null;
    let lruTime = new Date();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanExpiredEntries(): void {
    const now = new Date();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}
