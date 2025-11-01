import { Result, ok, err } from './result';

/**
 * Value Object para Contenido de Publicación con validación incorporada.
 */
export class PublicacionContent {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de PublicacionContent validada.
   */
  static create(value: string): Result<PublicacionContent, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El contenido es requerido');
    }

    if (trimmed.length > 10000) {
      return err('El contenido es demasiado largo (máximo 10000 caracteres)');
    }

    return ok(new PublicacionContent(value));
  }

  /**
   * Obtiene el valor del contenido.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro PublicacionContent.
   */
  equals(other: PublicacionContent): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string (truncada para display).
   */
  toString(): string {
    return this.value.length > 100 ? `${this.value.substring(0, 100)}...` : this.value;
  }
}