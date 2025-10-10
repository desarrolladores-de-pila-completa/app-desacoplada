/**
 * Patrón Result para manejar operaciones que pueden fallar sin excepciones.
 * Usando union types para mejor type safety.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;
export declare class Ok<T, E> {
    readonly value: T;
    readonly success = true;
    readonly error?: E;
    constructor(value: T);
}
export declare class Err<T, E> {
    readonly error: E;
    readonly success = false;
    readonly value?: T;
    constructor(error: E);
}
/**
 * Crea un Result exitoso.
 */
export declare function ok<T>(value: T): Result<T, never>;
/**
 * Crea un Result de error.
 */
export declare function err<E>(error: E): Result<never, E>;
/**
 * Verifica si es Ok.
 */
export declare function isOk<T, E>(result: Result<T, E>): result is Ok<T, E>;
/**
 * Verifica si es Err.
 */
export declare function isErr<T, E>(result: Result<T, E>): result is Err<T, E>;
/**
 * Obtiene el valor si es Ok.
 */
export declare function unwrap<T>(result: Result<T, never>): T;
/**
 * Obtiene el error si es Err.
 */
export declare function unwrapErr<E>(result: Result<never, E>): E;
/**
 * Transforma el valor si es Ok.
 */
export declare function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E>;
/**
 * Transforma el error si es Err.
 */
export declare function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F>;
//# sourceMappingURL=result.d.ts.map