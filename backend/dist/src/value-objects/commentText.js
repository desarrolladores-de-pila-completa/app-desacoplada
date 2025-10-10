"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentText = void 0;
const result_1 = require("./result");
/**
 * Value Object para Texto de Comentario con validación incorporada.
 */
class CommentText {
    value;
    constructor(value) {
        this.value = value;
    }
    /**
     * Crea una instancia de CommentText validada.
     */
    static create(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return (0, result_1.err)('El comentario no puede estar vacío');
        }
        if (trimmed.length > 10000) {
            return (0, result_1.err)('El comentario es demasiado largo');
        }
        return (0, result_1.ok)(new CommentText(trimmed));
    }
    /**
     * Obtiene el valor del comentario.
     */
    getValue() {
        return this.value;
    }
    /**
     * Compara con otro CommentText.
     */
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Representación string (truncada para display).
     */
    toString() {
        return this.value.length > 30 ? `${this.value.substring(0, 30)}...` : this.value;
    }
}
exports.CommentText = CommentText;
//# sourceMappingURL=commentText.js.map