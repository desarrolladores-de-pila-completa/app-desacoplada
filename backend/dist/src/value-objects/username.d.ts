import { Result } from './result';
/**
 * Value Object para Username con validación incorporada.
 */
export declare class Username {
    private readonly value;
    private constructor();
    /**
     * Crea una instancia de Username validada.
     */
    static create(value: string): Result<Username, string>;
    /**
     * Obtiene el valor del username.
     */
    getValue(): string;
    /**
     * Compara con otro Username.
     */
    equals(other: Username): boolean;
    /**
     * Representación string.
     */
    toString(): string;
}
//# sourceMappingURL=username.d.ts.map