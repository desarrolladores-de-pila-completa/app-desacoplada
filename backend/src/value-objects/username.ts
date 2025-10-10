import { Result, ok, err } from './result';

/**
 * Value Object para Username con validación incorporada.
 */
export class Username {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de Username validada.
   */
  static create(value: string): Result<Username, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El username no puede estar vacío');
    }

    if (trimmed.length < 3) {
      return err('El username debe tener al menos 3 caracteres');
    }

    if (trimmed.length > 20) {
      return err('El username es demasiado largo');
    }

    // Solo letras, números y guiones bajos
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmed)) {
      return err('El username solo puede contener letras, números y guiones bajos');
    }

    return ok(new Username(trimmed));
  }

  /**
   * Obtiene el valor del username.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro Username.
   */
  equals(other: Username): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string.
   */
  toString(): string {
    return this.value;
  }
}