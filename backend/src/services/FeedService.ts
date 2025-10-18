import { FeedEntry } from '../types/interfaces';
import { IFeedRepository } from '../repositories';
import { cacheService } from './CacheService';
import winston from '../utils/logger';

export class FeedService {
  constructor(private feedRepository: IFeedRepository) {}
  /**
   * Obtener feed completo con paginación
   */
  /**
   * Obtiene el feed completo con paginación.
   */
  async getFeed(limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    winston.info('FeedService.getFeed', { limit, offset });
    const cacheKey = `feed:all:${limit}:${offset}`;
    const cached = cacheService.get<FeedEntry[]>(cacheKey);
    if (cached) return cached;

    const feed = await this.feedRepository.findAll(limit, offset);
    cacheService.set(cacheKey, feed);
    return feed;
  }

  /**
   * Obtener feed de un usuario específico
   */
  async getUserFeed(userId: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    const cacheKey = `feed:user:${userId}:${limit}:${offset}`;
    const cached = cacheService.get<FeedEntry[]>(cacheKey);
    if (cached) return cached;

    const feed = await this.feedRepository.findByUser(userId, limit, offset);
    cacheService.set(cacheKey, feed);
    return feed;
  }

  /**
   * Obtener entrada específica del feed
   */
  async getFeedEntry(feedId: number): Promise<FeedEntry | null> {
    const cacheKey = `feed:entry:${feedId}`;
    const cached = cacheService.get<FeedEntry>(cacheKey);
    if (cached) return cached;

    const entry = await this.feedRepository.findById(feedId);
    if (entry) {
      cacheService.set(cacheKey, entry);
    }
    return entry;
  }

  /**
   * Crear entrada en el feed para registro de usuario
   */
  async createUserRegistrationEntry(userId: string, username: string): Promise<number> {
    return await this.feedRepository.createForUser(userId, username);
  }

  /**
   * Crear entrada en el feed cuando se crea una página
   */
  async createFeedEntry(userId: string, pageId: number, titulo: string, contenido: string): Promise<number> {
    const feedId = await this.feedRepository.createForPage(userId, pageId, titulo, contenido);
    // Invalidar caché de feeds
    cacheService.invalidatePattern(`feed:all:`);
    cacheService.invalidatePattern(`feed:user:${userId}:`);
    cacheService.invalidatePattern(`feed:stats`);
    return feedId;
  }

  /**
   * Actualizar entrada del feed cuando se modifica una página
   */
  async updateFeedEntry(pageId: number, titulo: string, contenido: string): Promise<void> {
    await this.feedRepository.updateForPage(pageId, titulo, contenido);
    // Invalidar caché de la entrada específica y feeds
    cacheService.invalidatePattern(`feed:entry:`);
    cacheService.invalidatePattern(`feed:all:`);
    cacheService.invalidatePattern(`feed:user:`);
  }

  /**
   * Eliminar entrada del feed
   */
  async deleteFeedEntry(pageId: number): Promise<void> {
    await this.feedRepository.deleteByPage(pageId);
    // Invalidar caché
    cacheService.invalidatePattern(`feed:entry:`);
    cacheService.invalidatePattern(`feed:all:`);
    cacheService.invalidatePattern(`feed:user:`);
    cacheService.invalidatePattern(`feed:stats`);
  }

  /**
   * Eliminar todas las entradas de un usuario
   */
  async deleteUserFeedEntries(userId: string): Promise<void> {
    await this.feedRepository.deleteByUser(userId);
    // Invalidar caché
    cacheService.invalidatePattern(`feed:user:${userId}:`);
    cacheService.invalidatePattern(`feed:all:`);
    cacheService.invalidatePattern(`feed:stats`);
  }

  /**
   * Buscar en el feed
   */
  async searchFeed(searchTerm: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    const cacheKey = `feed:search:${searchTerm}:${limit}:${offset}`;
    const cached = cacheService.get<FeedEntry[]>(cacheKey);
    if (cached) return cached;

    const results = await this.feedRepository.search(searchTerm, limit, offset);
    cacheService.set(cacheKey, results);
    return results;
  }

  /**
   * Obtener estadísticas del feed
   */
  async getFeedStats(): Promise<{
    totalEntries: number;
    totalUsers: number;
    entriesLast24h: number;
    mostActiveUser: { username: string; entries: number } | null;
  }> {
    const cacheKey = `feed:stats`;
    const cached = cacheService.get<{
      totalEntries: number;
      totalUsers: number;
      entriesLast24h: number;
      mostActiveUser: { username: string; entries: number } | null;
    }>(cacheKey);
    if (cached) return cached;

    const stats = await this.feedRepository.getStats();
    cacheService.set(cacheKey, stats, 60000); // TTL de 1 minuto para stats
    return stats;
  }

  /**
   * Sincronizar feed con páginas existentes
   * Útil para migración o corrección de datos
   */
  async syncFeedWithPages(): Promise<{ created: number; updated: number }> {
    return await this.feedRepository.syncWithPages();
  }

  /**
   * Limpiar entradas huérfanas del feed
   */
  async cleanOrphanedEntries(): Promise<number> {
    return await this.feedRepository.cleanOrphaned();
  }

  /**
   * Obtener feed de páginas seguidas por un usuario
   * TODO: Implementar sistema de follows
   */
  async getFollowingFeed(userId: string, limit: number = 20, offset: number = 0): Promise<FeedEntry[]> {
    return await this.feedRepository.findFollowing(userId, limit, offset);
  }
}