/**
 * Patrón Result para manejar operaciones que pueden fallar sin excepciones.
 * Usando union types para mejor type safety.
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

export class Ok<T, E> {
  readonly success = true;
  readonly error?: E;

  constructor(readonly value: T) {}
}

export class Err<T, E> {
  readonly success = false;
  readonly value?: T;

  constructor(readonly error: E) {}
}

/**
 * Crea un Result exitoso.
 */
export function ok<T>(value: T): Result<T, never> {
  return new Ok(value);
}

/**
 * Crea un Result de error.
 */
export function err<E>(error: E): Result<never, E> {
  return new Err(error);
}

/**
 * Verifica si es Ok.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T, E> {
  return result.success;
}

/**
 * Verifica si es Err.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<T, E> {
  return !result.success;
}

/**
 * Obtiene el valor si es Ok.
 */
export function unwrap<T>(result: Result<T, never>): T {
  if (isErr(result)) {
    throw new Error(`Called unwrap on Err: ${result.error}`);
  }
  return result.value;
}

/**
 * Obtiene el error si es Err.
 */
export function unwrapErr<E>(result: Result<never, E>): E {
  if (isOk(result)) {
    throw new Error('Called unwrapErr on Ok');
  }
  return result.error;
}

/**
 * Transforma el valor si es Ok.
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : err(result.error);
}

/**
 * Transforma el error si es Err.
 */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isOk(result) ? ok(result.value) : err(fn(result.error));
}