"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Email = void 0;
const result_1 = require("./result");
/**
 * Value Object para Email con validación incorporada.
 */
class Email {
    value;
    constructor(value) {
        this.value = value;
    }
    /**
     * Crea una instancia de Email validada.
     */
    static create(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return (0, result_1.err)('El email no puede estar vacío');
        }
        // Regex básica para validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            return (0, result_1.err)('Email inválido');
        }
        return (0, result_1.ok)(new Email(trimmed));
    }
    /**
     * Obtiene el valor del email.
     */
    getValue() {
        return this.value;
    }
    /**
     * Compara con otro Email.
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
exports.Email = Email;
//# sourceMappingURL=email.js.map