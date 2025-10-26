"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedService = void 0;
const CacheService_1 = require("./CacheService");
const logger_1 = __importDefault(require("../utils/logger"));
class FeedService {
    feedRepository;
    constructor(feedRepository) {
        this.feedRepository = feedRepository;
    }
    /**
     * Obtener feed completo con paginación
     */
    /**
     * Obtiene el feed completo con paginación.
     */
    async getFeed(limit = 20, offset = 0) {
        logger_1.default.info('FeedService.getFeed', { limit, offset });
        const cacheKey = `feed:all:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const feed = await this.feedRepository.findAll(limit, offset);
        CacheService_1.cacheService.set(cacheKey, feed);
        return feed;
    }
    /**
     * Obtener feed de un usuario específico
     */
    async getUserFeed(userId, limit = 20, offset = 0) {
        const cacheKey = `feed:user:${userId}:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const feed = await this.feedRepository.findByUser(userId, limit, offset);
        CacheService_1.cacheService.set(cacheKey, feed);
        return feed;
    }
    /**
     * Obtener entrada específica del feed
     */
    async getFeedEntry(feedId) {
        const cacheKey = `feed:entry:${feedId}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const entry = await this.feedRepository.findById(feedId);
        if (entry) {
            CacheService_1.cacheService.set(cacheKey, entry);
        }
        return entry;
    }
    /**
     * Crear entrada en el feed para registro de usuario
     */
    async createUserRegistrationEntry(userId, username) {
        return await this.feedRepository.createForUser(userId, username);
    }
    /**
     * Crear entrada en el feed cuando se crea una página
     */
    async createFeedEntry(userId, pageId, titulo, contenido) {
        const feedId = await this.feedRepository.createForPage(userId, pageId, titulo, contenido);
        // Invalidar caché de feeds
        CacheService_1.cacheService.invalidatePattern(`feed:all:`);
        CacheService_1.cacheService.invalidatePattern(`feed:user:${userId}:`);
        CacheService_1.cacheService.invalidatePattern(`feed:stats`);
        return feedId;
    }
    /**
     * Actualizar entrada del feed cuando se modifica una página
     */
    async updateFeedEntry(pageId, titulo, contenido) {
        await this.feedRepository.updateForPage(pageId, titulo, contenido);
        // Invalidar caché de la entrada específica y feeds
        CacheService_1.cacheService.invalidatePattern(`feed:entry:`);
        CacheService_1.cacheService.invalidatePattern(`feed:all:`);
        CacheService_1.cacheService.invalidatePattern(`feed:user:`);
    }
    /**
     * Eliminar entrada del feed
     */
    async deleteFeedEntry(pageId) {
        await this.feedRepository.deleteByPage(pageId);
        // Invalidar caché
        CacheService_1.cacheService.invalidatePattern(`feed:entry:`);
        CacheService_1.cacheService.invalidatePattern(`feed:all:`);
        CacheService_1.cacheService.invalidatePattern(`feed:user:`);
        CacheService_1.cacheService.invalidatePattern(`feed:stats`);
    }
    /**
     * Eliminar todas las entradas de un usuario
     */
    async deleteUserFeedEntries(userId) {
        await this.feedRepository.deleteByUser(userId);
        // Invalidar caché
        CacheService_1.cacheService.invalidatePattern(`feed:user:${userId}:`);
        CacheService_1.cacheService.invalidatePattern(`feed:all:`);
        CacheService_1.cacheService.invalidatePattern(`feed:stats`);
    }
    /**
     * Buscar en el feed
     */
    async searchFeed(searchTerm, limit = 20, offset = 0) {
        const cacheKey = `feed:search:${searchTerm}:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const results = await this.feedRepository.search(searchTerm, limit, offset);
        CacheService_1.cacheService.set(cacheKey, results);
        return results;
    }
    /**
     * Obtener estadísticas del feed
     */
    async getFeedStats() {
        const cacheKey = `feed:stats`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const stats = await this.feedRepository.getStats();
        CacheService_1.cacheService.set(cacheKey, stats, 60000); // TTL de 1 minuto para stats
        return stats;
    }
    /**
     * Sincronizar feed con páginas existentes
     * Útil para migración o corrección de datos
     */
    async syncFeedWithPages() {
        return await this.feedRepository.syncWithPages();
    }
    /**
     * Limpiar entradas huérfanas del feed
     */
    async cleanOrphanedEntries() {
        return await this.feedRepository.cleanOrphaned();
    }
    /**
     * Obtener feed de páginas seguidas por un usuario
     * TODO: Implementar sistema de follows
     */
    async getFollowingFeed(userId, limit = 20, offset = 0) {
        return await this.feedRepository.findFollowing(userId, limit, offset);
    }
}
exports.FeedService = FeedService;
//# sourceMappingURL=FeedService.js.map