import { Result } from './result';
/**
 * Value Object para Texto de Comentario con validación incorporada.
 */
export declare class CommentText {
    private readonly value;
    private constructor();
    /**
     * Crea una instancia de CommentText validada.
     */
    static create(value: string): Result<CommentText, string>;
    /**
     * Obtiene el valor del comentario.
     */
    getValue(): string;
    /**
     * Compara con otro CommentText.
     */
    equals(other: CommentText): boolean;
    /**
     * Representación string (truncada para display).
     */
    toString(): string;
}
//# sourceMappingURL=commentText.d.ts.map