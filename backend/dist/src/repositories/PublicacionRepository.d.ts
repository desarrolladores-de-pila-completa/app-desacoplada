export interface Publicacion {
    id: number;
    user_id: string;
    titulo: string;
    contenido: string;
    created_at: Date;
    updated_at: Date;
}
export interface CreatePublicacionData {
    titulo: string;
    contenido: string;
}
export declare class PublicacionRepository {
    /**
     * Crea una nueva publicación para el usuario especificado.
     * @param userId ID del usuario
     * @param data Datos de la publicación
     * @returns ID de la nueva publicación
     */
    create(userId: string, data: CreatePublicacionData): Promise<number>;
    /**
     * Busca una publicación por su ID.
     * @param id ID de la publicación
     * @returns Publicación encontrada o null
     */
    findById(id: number): Promise<Publicacion | null>;
    /**
     * Busca publicaciones de un usuario con paginación.
     * @param userId ID del usuario
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de publicaciones
     */
    findByUser(userId: string, limit?: number, offset?: number): Promise<Publicacion[]>;
    /**
     * Busca todas las publicaciones con paginación.
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de publicaciones
     */
    findAll(limit?: number, offset?: number): Promise<Publicacion[]>;
    /**
     * Actualiza una publicación por su ID.
     * @param id ID de la publicación
     * @param data Datos a actualizar
     */
    update(id: number, data: Partial<CreatePublicacionData>): Promise<void>;
    /**
     * Elimina una publicación por su ID.
     * @param id ID de la publicación
     */
    delete(id: number): Promise<void>;
}
//# sourceMappingURL=PublicacionRepository.d.ts.map