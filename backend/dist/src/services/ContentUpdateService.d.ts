export interface ContentUpdateOptions {
    oldUsername: string;
    newUsername: string;
    dryRun?: boolean;
    caseSensitive?: boolean;
}
export interface ContentReference {
    id: number;
    type: 'comment' | 'private_message' | 'publication';
    content: string;
    userId?: string;
    tableName: string;
    columnName: string;
}
export interface UpdateStatistics {
    totalReferences: number;
    updatedReferences: number;
    errors: Array<{
        type: string;
        id: number;
        error: string;
    }>;
    details: {
        comments: {
            found: number;
            updated: number;
        };
        privateMessages: {
            found: number;
            updated: number;
        };
        publications: {
            found: number;
            updated: number;
        };
    };
}
export interface SearchPattern {
    pattern: RegExp;
    replacement: string;
    description: string;
}
export declare class ContentUpdateService {
    private commentRepository;
    private privateMessageRepository;
    private publicacionRepository;
    constructor();
    /**
     * Método principal para actualizar referencias de username en todo el contenido
     */
    updateContentReferences(options: ContentUpdateOptions): Promise<UpdateStatistics>;
    /**
     * Validar entrada del usuario
     */
    private validateInput;
    /**
     * Generar patrones de búsqueda seguros para diferentes contextos
     */
    private generateSearchPatterns;
    /**
     * Escapar caracteres especiales para uso en expresiones regulares
     */
    private escapeRegex;
    /**
     * Actualizar referencias en comentarios
     */
    private updateCommentsReferences;
    /**
     * Actualizar referencias en mensajes privados
     */
    private updatePrivateMessagesReferences;
    /**
     * Actualizar referencias en publicaciones
     */
    private updatePublicationsReferences;
    /**
     * Método para hacer una prueba sin actualizar (dry run)
     */
    previewContentUpdates(options: ContentUpdateOptions): Promise<UpdateStatistics>;
    /**
     * Obtener estadísticas detalladas de referencias sin actualizar
     */
    getReferenceStatistics(oldUsername: string): Promise<{
        comments: number;
        privateMessages: number;
        publications: number;
        total: number;
    }>;
}
//# sourceMappingURL=ContentUpdateService.d.ts.map