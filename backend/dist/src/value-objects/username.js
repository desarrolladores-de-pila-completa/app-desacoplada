"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Username = void 0;
const result_1 = require("./result");
/**
 * Value Object para Username con validación incorporada.
 */
class Username {
    value;
    constructor(value) {
        this.value = value;
    }
    /**
     * Crea una instancia de Username validada.
     */
    static create(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return (0, result_1.err)('El username no puede estar vacío');
        }
        if (trimmed.length < 3) {
            return (0, result_1.err)('El username debe tener al menos 3 caracteres');
        }
        if (trimmed.length > 20) {
            return (0, result_1.err)('El username es demasiado largo');
        }
        // Permitir letras, números, guiones bajos, espacios, acentos y guiones
        const usernameRegex = /^[a-zA-Z0-9_\sáéíóúÁÉÍÓÚñÑ-]+$/;
        if (!usernameRegex.test(trimmed)) {
            return (0, result_1.err)('El username solo puede contener letras, números y guiones bajos');
        }
        return (0, result_1.ok)(new Username(trimmed));
    }
    /**
     * Obtiene el valor del username.
     */
    getValue() {
        return this.value;
    }
    /**
     * Compara con otro Username.
     */
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Representación string.
     */
    toString() {
        return this.value;
    }
}
exports.Username = Username;
//# sourceMappingURL=username.js.map