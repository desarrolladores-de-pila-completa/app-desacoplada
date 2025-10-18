"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class CacheService {
    cache = new Map();
    defaultTTL = 300000; // 5 minutos en ms
    /**
     * Obtener un valor del caché
     */
    /**
     * Obtener un valor del caché
     */
    get(key) {
        logger_1.default.debug('CacheService.get', { key });
        const entry = this.cache.get(key);
        if (!entry)
            return null;
        if (Date.now() > entry.expiry) {
            this.delete(key);
            return null;
        }
        return entry.value;
    }
    /**
     * Establecer un valor en el caché con TTL opcional
     */
    /**
     * Establecer un valor en el caché con TTL opcional
     */
    set(key, value, ttlMs = this.defaultTTL) {
        logger_1.default.debug('CacheService.set', { key, ttlMs });
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
    delete(key) {
        const entry = this.cache.get(key);
        if (entry) {
            clearTimeout(entry.timeoutId);
            this.cache.delete(key);
        }
    }
    /**
     * Invalidar todas las claves que coincidan con un patrón
     */
    invalidatePattern(pattern) {
        const keysToDelete = [];
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
    clear() {
        for (const entry of this.cache.values()) {
            clearTimeout(entry.timeoutId);
        }
        this.cache.clear();
    }
    /**
     * Obtener estadísticas del caché
     */
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * Verificar si una clave existe y no ha expirado
     */
    has(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
        if (Date.now() > entry.expiry) {
            this.delete(key);
            return false;
        }
        return true;
    }
}
exports.CacheService = CacheService;
// Instancia singleton del servicio de caché
exports.cacheService = new CacheService();
//# sourceMappingURL=CacheService.js.map