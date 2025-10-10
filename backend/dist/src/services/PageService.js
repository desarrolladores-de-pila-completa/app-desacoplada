"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageService = void 0;
const CacheService_1 = require("./CacheService");
class PageService {
    pageRepository;
    feedRepository;
    eventBus;
    constructor(pageRepository, feedRepository, eventBus) {
        this.pageRepository = pageRepository;
        this.feedRepository = feedRepository;
        this.eventBus = eventBus;
    }
    /**
     * Obtener página por ID con imágenes
     */
    async getPageWithImages(pageId) {
        const cacheKey = `page:withImages:${pageId}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const page = await this.pageRepository.findWithImages(pageId);
        if (page) {
            CacheService_1.cacheService.set(cacheKey, page);
        }
        return page;
    }
    /**
     * Obtener página por usuario (username)
     */
    async getPageByUsername(username) {
        const cacheKey = `page:byUsername:${username}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const page = await this.pageRepository.findByUsername(username);
        if (page) {
            CacheService_1.cacheService.set(cacheKey, page);
        }
        return page;
    }
    /**
     * Obtener todas las páginas públicas con paginación
     */
    async getPublicPages(limit = 20, offset = 0) {
        const cacheKey = `page:public:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const pages = await this.pageRepository.findPublic(limit, offset);
        CacheService_1.cacheService.set(cacheKey, pages);
        return pages;
    }
    /**
     /**
      * Crear nueva página
      */
    async createPage(userId, pageData) {
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
        }
        catch (error) {
            console.error('Error emitiendo evento page.created:', error);
            // No fallar la creación por esto
        }
        return pageId;
    }
    /**
     * Actualizar página existente
     */
    async updatePage(pageId, updateData) {
        await this.pageRepository.update(pageId, updateData);
        // Invalidar caché de la página
        CacheService_1.cacheService.invalidatePattern(`page:withImages:${pageId}`);
        CacheService_1.cacheService.invalidatePattern(`page:byUsername:`); // Invalidar todas las búsquedas por username, ya que podría cambiar
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
    async deletePage(pageId) {
        await this.pageRepository.delete(pageId);
        await this.feedRepository.deleteByPage(pageId);
        // Invalidar caché de la página
        CacheService_1.cacheService.invalidatePattern(`page:withImages:${pageId}`);
        CacheService_1.cacheService.invalidatePattern(`page:byUsername:`); // Invalidar búsquedas por username
        CacheService_1.cacheService.invalidatePattern(`page:public:`); // Invalidar listas públicas
    }
    /**
     * Agregar imagen a una página
     */
    async addImageToPage(pageId, imageBuffer, mimeType) {
        const imageId = await this.pageRepository.addImage(pageId, imageBuffer, mimeType);
        // Invalidar caché de la página
        CacheService_1.cacheService.invalidatePattern(`page:withImages:${pageId}`);
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
    async removeImage(imageId, pageId) {
        await this.pageRepository.removeImage(imageId, pageId);
        // Invalidar caché de la página
        CacheService_1.cacheService.invalidatePattern(`page:withImages:${pageId}`);
        // Actualizar el feed
        const page = await this.pageRepository.findById(pageId);
        if (page) {
            await this.feedRepository.updateForPage(pageId, page.titulo, page.contenido);
        }
    }
    /**
     * Verificar si una página existe
     */
    async pageExists(pageId) {
        return await this.pageRepository.exists(pageId);
    }
    /**
     * Obtener el propietario de una página
     */
    async getPageOwner(pageId) {
        return await this.pageRepository.getOwner(pageId);
    }
    /**
     * Cambiar visibilidad de página
     */
    async togglePageVisibility(pageId) {
        const result = await this.pageRepository.toggleVisibility(pageId);
        // Invalidar caché de la página y listas públicas
        CacheService_1.cacheService.invalidatePattern(`page:withImages:${pageId}`);
        CacheService_1.cacheService.invalidatePattern(`page:public:`);
        return result;
    }
    /**
     * Obtener estadísticas de página
     */
    async getPageStats(pageId) {
        return await this.pageRepository.getStats(pageId);
    }
}
exports.PageService = PageService;
//# sourceMappingURL=PageService.js.map