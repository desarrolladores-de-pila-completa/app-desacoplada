"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = exports.DIContainer = void 0;
/**
 * Container básico de inyección de dependencias
 * Permite registrar y resolver dependencias de manera centralizada
 */
class DIContainer {
    services = new Map();
    singletons = new Map();
    /**
     * Registrar un servicio como singleton
     * @param key Clave única del servicio
     * @param factory Función que crea la instancia del servicio
     */
    registerSingleton(key, factory) {
        this.services.set(key, { type: 'singleton', factory });
    }
    /**
     * Registrar un servicio que se instancia cada vez
     * @param key Clave única del servicio
     * @param factory Función que crea la instancia del servicio
     */
    registerTransient(key, factory) {
        this.services.set(key, { type: 'transient', factory });
    }
    /**
     * Resolver una dependencia
     * @param key Clave del servicio
     * @returns Instancia del servicio
     */
    resolve(key) {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Servicio no registrado: ${key}`);
        }
        if (service.type === 'singleton') {
            if (!this.singletons.has(key)) {
                this.singletons.set(key, service.factory(this));
            }
            return this.singletons.get(key);
        }
        else {
            return service.factory(this);
        }
    }
    /**
     * Verificar si un servicio está registrado
     * @param key Clave del servicio
     * @returns true si está registrado
     */
    has(key) {
        return this.services.has(key);
    }
    /**
     * Limpiar todas las instancias singleton (útil para testing)
     */
    clear() {
        this.singletons.clear();
    }
}
exports.DIContainer = DIContainer;
// Instancia global del container
exports.container = new DIContainer();
//# sourceMappingURL=diContainer.js.map