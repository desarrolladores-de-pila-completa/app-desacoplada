"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageContent = void 0;
const result_1 = require("./result");
/**
 * Value Object para Contenido de Página con validación incorporada.
 */
class PageContent {
    value;
    constructor(value) {
        this.value = value;
    }
    /**
     * Crea una instancia de PageContent validada.
     */
    static create(value) {
        const trimmed = value.trim();
        if (!trimmed) {
            return (0, result_1.err)('El contenido es requerido');
        }
        return (0, result_1.ok)(new PageContent(value)); // No limitar longitud para contenido
    }
    /**
     * Obtiene el valor del contenido.
     */
    getValue() {
        return this.value;
    }
    /**
     * Compara con otro PageContent.
     */
    equals(other) {
        return this.value === other.value;
    }
    /**
     * Representación string (truncada para display).
     */
    toString() {
        return this.value.length > 50 ? `${this.value.substring(0, 50)}...` : this.value;
    }
}
exports.PageContent = PageContent;
//# sourceMappingURL=pageContent.js.map