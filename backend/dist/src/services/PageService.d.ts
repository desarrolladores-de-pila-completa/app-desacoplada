import { Pagina, CreatePaginaData, UpdatePaginaData, PaginaWithImages, IEventBus } from '../types/interfaces';
import { IPageRepository } from '../repositories';
export declare class PageService {
    private pageRepository;
    private eventBus;
    constructor(pageRepository: IPageRepository, eventBus: IEventBus);
    /**
     * Obtener página por ID con imágenes
     */
    /**
     * Obtiene una página por ID con imágenes.
     */
    getPageWithImages(pageId: number): Promise<PaginaWithImages | null>;
    /**
      * Obtener página por usuario (username)
      */
    getPageByUsername(username: string): Promise<Pagina | null>;
    /**
      * Obtener página por usuario y número de página
      */
    getPageByUsernameAndPageNumber(username: string, pageNumber: number): Promise<Pagina | null>;
    /**
     * Obtener todas las páginas públicas con paginación
     */
    getPublicPages(limit?: number, offset?: number): Promise<Pagina[]>;
    /**
     * Crear nueva página
     */
    createPage(userId: string, pageData: CreatePaginaData): Promise<number>;
    /**
     * Actualizar página existente
     */
    updatePage(pageId: number, updateData: UpdatePaginaData): Promise<void>;
    /**
     * Eliminar página y todas sus imágenes
     */
    deletePage(pageId: number): Promise<void>;
    /**
     * Agregar imagen a una página
     */
    addImageToPage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number>;
    /**
     * Eliminar imagen específica
     */
    removeImage(imageId: number, pageId: number): Promise<void>;
    /**
     * Verificar si una página existe
     */
    pageExists(pageId: number): Promise<boolean>;
    /**
     * Obtener el propietario de una página
     */
    getPageOwner(pageId: number): Promise<string | null>;
    /**
     * Cambiar visibilidad de página
     */
    togglePageVisibility(pageId: number): Promise<string>;
    /**
      * Obtener estadísticas de página
      */
    getPageStats(pageId: number): Promise<{
        comentarios: number;
        imagenes: number;
        visitas: number;
    }>;
    /**
      * Obtener el número de página de una página específica
      */
    getPageNumber(pageId: number): Promise<number | null>;
}
//# sourceMappingURL=PageService.d.ts.map