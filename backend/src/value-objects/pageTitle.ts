import { Result, ok, err } from './result';

/**
 * Value Object para Título de Página con validación incorporada.
 */
export class PageTitle {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de PageTitle validada.
   */
  static create(value: string): Result<PageTitle, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El título es requerido');
    }

    if (trimmed.length > 100) {
      return err('El título es demasiado largo');
    }

    return ok(new PageTitle(trimmed));
  }

  /**
   * Obtiene el valor del título.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro PageTitle.
   */
  equals(other: PageTitle): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string.
   */
  toString(): string {
    return this.value;
  }
}