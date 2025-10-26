import { Result, ok, err } from './result';

/**
 * Value Object para Contenido de Página con validación incorporada.
 */
export class PageContent {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de PageContent validada.
   */
  static create(value: string): Result<PageContent, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El contenido es requerido');
    }

    return ok(new PageContent(value)); // No limitar longitud para contenido
  }

  /**
   * Obtiene el valor del contenido.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro PageContent.
   */
  equals(other: PageContent): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string (truncada para display).
   */
  toString(): string {
    return this.value.length > 50 ? `${this.value.substring(0, 50)}...` : this.value;
  }
}