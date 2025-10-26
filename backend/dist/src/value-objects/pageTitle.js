"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageTitle = void 0;
const result_1 = require("./result");
/**
 * Value Object para Título de Página con validación incorporada.
 */
class PageTitle {
    value;
    constructor(value) {
        this.value = value;
    }
    /**
     * Crea una instancia de PageTitle validada.
     */
    static create(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return (0, result_1.err)('El título es requerido');
        }
        if (trimmed.length > 100) {
            return (0, result_1.err)('El título es demasiado largo');
        }
        return (0, result_1.ok)(new PageTitle(trimmed));
    }
    /**
     * Obtiene el valor del título.
     */
    getValue() {
        return this.value;
    }
    /**
     * Compara con otro PageTitle.
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
exports.PageTitle = PageTitle;
//# sourceMappingURL=pageTitle.js.map