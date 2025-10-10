import { Result } from './result';
/**
 * Value Object para Contenido de Página con validación incorporada.
 */
export declare class PageContent {
    private readonly value;
    private constructor();
    /**
     * Crea una instancia de PageContent validada.
     */
    static create(value: string): Result<PageContent, string>;
    /**
     * Obtiene el valor del contenido.
     */
    getValue(): string;
    /**
     * Compara con otro PageContent.
     */
    equals(other: PageContent): boolean;
    /**
     * Representación string (truncada para display).
     */
    toString(): string;
}
//# sourceMappingURL=pageContent.d.ts.map