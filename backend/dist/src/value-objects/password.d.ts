import { Result } from './result';
/**
 * Value Object para Password con validación incorporada.
 */
export declare class Password {
    private readonly value;
    private constructor();
    /**
     * Crea una instancia de Password validada.
     */
    static create(value: string): Result<Password, string>;
    /**
     * Crea una instancia de Password para login (validación mínima).
     */
    static createForLogin(value: string): Result<Password, string>;
    /**
     * Obtiene el valor hash de la contraseña (para comparación).
     * En producción, esto debería ser un hash.
     */
    getValue(): string;
    /**
     * Compara con otra contraseña.
     */
    equals(other: Password): boolean;
    /**
     * Representación string (oculta el valor real).
     */
    toString(): string;
}
//# sourceMappingURL=password.d.ts.map