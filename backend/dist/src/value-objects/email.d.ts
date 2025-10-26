import { Result } from './result';
/**
 * Value Object para Email con validación incorporada.
 */
export declare class Email {
    private readonly value;
    private constructor();
    /**
     * Crea una instancia de Email validada.
     */
    static create(value: string): Result<Email, string>;
    /**
     * Obtiene el valor del email.
     */
    getValue(): string;
    /**
     * Compara con otro Email.
     */
    equals(other: Email): boolean;
    /**
     * Representación string.
     */
    toString(): string;
}
//# sourceMappingURL=email.d.ts.map