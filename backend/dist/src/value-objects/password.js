"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Password = void 0;
const result_1 = require("./result");
/**
 * Value Object para Password con validación incorporada.
 */
class Password {
    value;
    constructor(value) {
        this.value = value;
    }
    /**
     * Crea una instancia de Password validada.
     */
    static create(value) {
        if (!value) {
            return (0, result_1.err)('La contraseña es requerida');
        }
        if (value.length < 8) {
            return (0, result_1.err)('La contraseña debe tener al menos 8 caracteres');
        }
        // Verificar al menos una minúscula, una mayúscula y un número
        const hasLower = /[a-z]/.test(value);
        const hasUpper = /[A-Z]/.test(value);
        const hasDigit = /\d/.test(value);
        if (!hasLower || !hasUpper || !hasDigit) {
            return (0, result_1.err)('La contraseña debe contener al menos una letra minúscula, una mayúscula y un número');
        }
        return (0, result_1.ok)(new Password(value));
    }
    /**
     * Crea una instancia de Password para login (validación mínima).
     */
    static createForLogin(value) {
        if (!value) {
            return (0, result_1.err)('La contraseña es requerida');
        }
        return (0, result_1.ok)(new Password(value));
    }
    /**
     * Obtiene el valor hash de la contraseña (para comparación).
     * En producción, esto debería ser un hash.
     */
    getValue() {
        return this.value;
    }
    /**
     * Compara con otra contraseña.
     */
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Representación string (oculta el valor real).
     */
    toString() {
        return '********';
    }
}
exports.Password = Password;
//# sourceMappingURL=password.js.map