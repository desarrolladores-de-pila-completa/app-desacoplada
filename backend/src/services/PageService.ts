import {
  Pagina,
  CreatePaginaData,
  UpdatePaginaData,
  PaginaWithImages,
  ImagenData,
  FeedEntry,
  IEventBus
} from '../types/interfaces';
import { IPageRepository, IFeedRepository } from '../repositories';
import { cacheService } from './CacheService';

export class PageService {
  constructor(
    private pageRepository: IPageRepository,
    private feedRepository: IFeedRepository,
    private eventBus: IEventBus
  ) {}
  /**
   * Obtener página por ID con imágenes
   */
  async getPageWithImages(pageId: number): Promise<PaginaWithImages | null> {
    const cacheKey = `page:withImages:${pageId}`;
    const cached = cacheService.get<PaginaWithImages>(cacheKey);
    if (cached) return cached;

    const page = await this.pageRepository.findWithImages(pageId);
    if (page) {
      cacheService.set(cacheKey, page);
    }
    return page;
  }

  /**
   * Obtener página por usuario (username)
   */
  async getPageByUsername(username: string): Promise<Pagina | null> {
    const cacheKey = `page:byUsername:${username}`;
    const cached = cacheService.get<Pagina>(cacheKey);
    if (cached) return cached;

    const page = await this.pageRepository.findByUsername(username);
    if (page) {
      cacheService.set(cacheKey, page);
    }
    return page;
  }

  /**
   * Obtener todas las páginas públicas con paginación
   */
  async getPublicPages(limit: number = 20, offset: number = 0): Promise<Pagina[]> {
    const cacheKey = `page:public:${limit}:${offset}`;
    const cached = cacheService.get<Pagina[]>(cacheKey);
    if (cached) return cached;

    const pages = await this.pageRepository.findPublic(limit, offset);
    cacheService.set(cacheKey, pages);
    return pages;
  }

  /**
   /**
    * Crear nueva página
    */
   async createPage(userId: string, pageData: CreatePaginaData): Promise<number> {
     const pageId = await this.pageRepository.create(userId, pageData);

     // Crear entrada en el feed
     await this.feedRepository.createForPage(userId, pageId, pageData.titulo, pageData.contenido);

     // Emitir evento de página creada
     try {
       await this.eventBus.emit('page.created', {
         pageId,
         userId,
         title: pageData.titulo,
         content: pageData.contenido,
       });
     } catch (error) {
       console.error('Error emitiendo evento page.created:', error);
       // No fallar la creación por esto
     }

     return pageId;
   }

  /**
   * Actualizar página existente
   */
  async updatePage(pageId: number, updateData: UpdatePaginaData): Promise<void> {
    await this.pageRepository.update(pageId, updateData);

    // Invalidar caché de la página
    cacheService.invalidatePattern(`page:withImages:${pageId}`);
    cacheService.invalidatePattern(`page:byUsername:`); // Invalidar todas las búsquedas por username, ya que podría cambiar

    // Actualizar el feed si cambió titulo o contenido
    if (updateData.titulo || updateData.contenido) {
      const page = await this.pageRepository.findById(pageId);
      if (page) {
        await this.feedRepository.updateForPage(pageId, page.titulo, page.contenido);
      }
    }
  }

  /**
   * Eliminar página y todas sus imágenes
   */
  async deletePage(pageId: number): Promise<void> {
    await this.pageRepository.delete(pageId);
    await this.feedRepository.deleteByPage(pageId);
    // Invalidar caché de la página
    cacheService.invalidatePattern(`page:withImages:${pageId}`);
    cacheService.invalidatePattern(`page:byUsername:`); // Invalidar búsquedas por username
    cacheService.invalidatePattern(`page:public:`); // Invalidar listas públicas
  }

  /**
   * Agregar imagen a una página
   */
  async addImageToPage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number> {
    const imageId = await this.pageRepository.addImage(pageId, imageBuffer, mimeType);

    // Invalidar caché de la página
    cacheService.invalidatePattern(`page:withImages:${pageId}`);

    // Actualizar el feed si es necesario
    const page = await this.pageRepository.findById(pageId);
    if (page) {
      await this.feedRepository.updateForPage(pageId, page.titulo, page.contenido);
    }

    return imageId;
  }

  /**
   * Eliminar imagen específica
   */
  async removeImage(imageId: number, pageId: number): Promise<void> {
    await this.pageRepository.removeImage(imageId, pageId);

    // Invalidar caché de la página
    cacheService.invalidatePattern(`page:withImages:${pageId}`);

    // Actualizar el feed
    const page = await this.pageRepository.findById(pageId);
    if (page) {
      await this.feedRepository.updateForPage(pageId, page.titulo, page.contenido);
    }
  }

  /**
   * Verificar si una página existe
   */
  async pageExists(pageId: number): Promise<boolean> {
    return await this.pageRepository.exists(pageId);
  }

  /**
   * Obtener el propietario de una página
   */
  async getPageOwner(pageId: number): Promise<string | null> {
    return await this.pageRepository.getOwner(pageId);
  }

  /**
   * Cambiar visibilidad de página
   */
  async togglePageVisibility(pageId: number): Promise<string> {
    const result = await this.pageRepository.toggleVisibility(pageId);
    // Invalidar caché de la página y listas públicas
    cacheService.invalidatePattern(`page:withImages:${pageId}`);
    cacheService.invalidatePattern(`page:public:`);
    return result;
  }

  /**
   * Obtener estadísticas de página
   */
  async getPageStats(pageId: number): Promise<{ comentarios: number; imagenes: number; visitas: number }> {
    return await this.pageRepository.getStats(pageId);
  }
}