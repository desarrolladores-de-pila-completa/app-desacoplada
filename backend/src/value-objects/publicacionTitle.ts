import { Result, ok, err } from './result';

/**
 * Value Object para Título de Publicación con validación incorporada.
 */
export class PublicacionTitle {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de PublicacionTitle validada.
   */
  static create(value: string): Result<PublicacionTitle, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El título es requerido');
    }

    if (trimmed.length > 200) {
      return err('El título es demasiado largo (máximo 200 caracteres)');
    }

    return ok(new PublicacionTitle(trimmed));
  }

  /**
   * Obtiene el valor del título.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro PublicacionTitle.
   */
  equals(other: PublicacionTitle): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string.
   */
  toString(): string {
    return this.value;
  }
}