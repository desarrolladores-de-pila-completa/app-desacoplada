import { Pagina, CreatePaginaData, UpdatePaginaData, PaginaWithImages } from '../types/interfaces';
import { IPageRepository } from './IPageRepository';
export declare class PageRepository implements IPageRepository {
    /**
     * Crea una nueva página para el usuario especificado.
     * @param userId ID del usuario propietario
     * @param pageData Datos de la página a crear
     * @returns ID de la nueva página
     */
    create(userId: string, pageData: CreatePaginaData): Promise<number>;
    /**
     * Busca una página por su ID.
     * @param pageId ID de la página
     * @returns Página encontrada o null
     */
    findById(pageId: number): Promise<Pagina | null>;
    /**
     * Busca una página y sus imágenes asociadas.
     * @param pageId ID de la página
     * @returns Página con imágenes o null
     */
    findWithImages(pageId: number): Promise<PaginaWithImages | null>;
    /**
     * Busca la última página de un usuario por su username.
     * @param username Username del usuario
     * @returns Página encontrada o null
     */
    findByUsername(username: string): Promise<Pagina | null>;
    /**
     * Busca la página número N de un usuario por su username.
     * @param username Username del usuario
     * @param pageNumber Número de página (1-based)
     * @returns Página encontrada o null
     */
    findByUsernameAndPageNumber(username: string, pageNumber: number): Promise<Pagina | null>;
    /**
     * Obtiene páginas públicas (visibles) con paginación.
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de páginas públicas
     */
    findPublic(limit?: number, offset?: number): Promise<Pagina[]>;
    /**
     * Actualiza una página (sin efecto, compatibilidad).
     * @param pageId ID de la página
     * @param updateData Datos a actualizar
     */
    update(pageId: number, updateData: UpdatePaginaData): Promise<void>;
    /**
     * Elimina una página y sus imágenes/comentarios asociados.
     * @param pageId ID de la página
     */
    delete(pageId: number): Promise<void>;
    /**
     * Verifica si existe una página por su ID.
     * @param pageId ID de la página
     * @returns true si existe, false si no
     */
    exists(pageId: number): Promise<boolean>;
    /**
     * Obtiene el user_id propietario de una página.
     * @param pageId ID de la página
     * @returns user_id o null
     */
    getOwner(pageId: number): Promise<string | null>;
    /**
     * Alterna la visibilidad de una página (visible/oculta).
     * @param pageId ID de la página
     * @returns Nuevo estado de visibilidad
     */
    toggleVisibility(pageId: number): Promise<string>;
    /**
     * Agrega una imagen a una página.
     * @param pageId ID de la página
     * @param imageBuffer Buffer de la imagen
     * @param mimeType Tipo MIME de la imagen
     * @returns ID de la imagen agregada
     */
    addImage(pageId: number, imageBuffer: Buffer, mimeType: string): Promise<number>;
    /**
     * Elimina una imagen de una página.
     * @param imageId ID de la imagen
     * @param pageId ID de la página
     */
    removeImage(imageId: number, pageId: number): Promise<void>;
    /**
     * Obtiene estadísticas de una página (comentarios, imágenes, visitas).
     * @param pageId ID de la página
     * @returns Objeto con estadísticas
     */
    getStats(pageId: number): Promise<{
        comentarios: number;
        imagenes: number;
        visitas: number;
    }>;
    /**
     * Obtiene el número de página (posición) de una página para un usuario.
     * @param pageId ID de la página
     * @returns Número de página o null
     */
    getPageNumber(pageId: number): Promise<number | null>;
}
//# sourceMappingURL=PageRepository.d.ts.map