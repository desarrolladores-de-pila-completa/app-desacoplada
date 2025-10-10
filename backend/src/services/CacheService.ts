interface CacheEntry<T> {
  value: T;
  expiry: number;
  timeoutId: NodeJS.Timeout;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 300000; // 5 minutos en ms

  /**
   * Obtener un valor del caché
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Establecer un valor en el caché con TTL opcional
   */
  set<T>(key: string, value: T, ttlMs: number = this.defaultTTL): void {
    this.delete(key); // Limpiar entrada existente si hay

    const expiry = Date.now() + ttlMs;
    const timeoutId = setTimeout(() => {
      this.cache.delete(key);
    }, ttlMs);

    this.cache.set(key, { value, expiry, timeoutId });
  }

  /**
   * Eliminar una clave específica del caché
   */
  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      clearTimeout(entry.timeoutId);
      this.cache.delete(key);
    }
  }

  /**
   * Invalidar todas las claves que coincidan con un patrón
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Limpiar todo el caché
   */
  clear(): void {
    for (const entry of this.cache.values()) {
      clearTimeout(entry.timeoutId);
    }
    this.cache.clear();
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Verificar si una clave existe y no ha expirado
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.delete(key);
      return false;
    }

    return true;
  }
}

// Instancia singleton del servicio de caché
export const cacheService = new CacheService();