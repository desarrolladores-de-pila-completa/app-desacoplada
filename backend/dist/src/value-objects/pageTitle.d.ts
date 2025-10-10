import { Result } from './result';
/**
 * Value Object para Título de Página con validación incorporada.
 */
export declare class PageTitle {
    private readonly value;
    private constructor();
    /**
     * Crea una instancia de PageTitle validada.
     */
    static create(value: string): Result<PageTitle, string>;
    /**
     * Obtiene el valor del título.
     */
    getValue(): string;
    /**
     * Compara con otro PageTitle.
     */
    equals(other: PageTitle): boolean;
    /**
     * Representación string.
     */
    toString(): string;
}
//# sourceMappingURL=pageTitle.d.ts.map