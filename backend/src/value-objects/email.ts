import { Result, ok, err } from './result';

/**
 * Value Object para Email con validación incorporada.
 */
export class Email {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de Email validada.
   */
  static create(value: string): Result<Email, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El email no puede estar vacío');
    }

    // Regex básica para validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return err('Email inválido');
    }

    return ok(new Email(trimmed));
  }

  /**
   * Obtiene el valor del email.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro Email.
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string.
   */
  toString(): string {
    return this.value;
  }
}