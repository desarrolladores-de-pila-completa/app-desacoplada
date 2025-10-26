import { Result, ok, err } from './result';

/**
 * Value Object para Texto de Comentario con validación incorporada.
 */
export class CommentText {
  private constructor(private readonly value: string) {}

  /**
   * Crea una instancia de CommentText validada.
   */
  static create(value: string): Result<CommentText, string> {
    const trimmed = value.trim();

    if (!trimmed) {
      return err('El comentario no puede estar vacío');
    }

    if (trimmed.length > 10000) {
      return err('El comentario es demasiado largo');
    }

    return ok(new CommentText(trimmed));
  }

  /**
   * Obtiene el valor del comentario.
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Compara con otro CommentText.
   */
  equals(other: CommentText): boolean {
    return this.value === other.value;
  }

  /**
   * Representación string (truncada para display).
   */
  toString(): string {
    return this.value.length > 30 ? `${this.value.substring(0, 30)}...` : this.value;
  }
}