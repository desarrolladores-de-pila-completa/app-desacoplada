import { Result, ok, err } from './result';

/**
 * Value Object para Password con validación incorporada.
 */
export class Password {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de Password validada.
   */
  static create(value: string): Result<Password, string> {
    if (!value) {
      return err('La contraseña es requerida');
    }

    if (value.length < 8) {
      return err('La contraseña debe tener al menos 8 caracteres');
    }

    // Verificar al menos una minúscula, una mayúscula y un número
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasDigit = /\d/.test(value);

    if (!hasLower || !hasUpper || !hasDigit) {
      return err('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número');
    }

    return ok(new Password(value));
  }

  /**
   * Crea una instancia de Password para login (validación mínima).
   */
  static createForLogin(value: string): Result<Password, string> {
    if (!value) {
      return err('La contraseña es requerida');
    }

    return ok(new Password(value));
  }

  /**
   * Obtiene el valor hash de la contraseña (para comparación).
   * En producción, esto debería ser un hash.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otra contraseña.
   */
  equals(other: Password): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string (oculta el valor real).
   */
  toString(): string {
    return '********';
  }
}