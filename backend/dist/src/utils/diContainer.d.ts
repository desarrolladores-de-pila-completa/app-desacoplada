/**
 * Container básico de inyección de dependencias
 * Permite registrar y resolver dependencias de manera centralizada
 */
export declare class DIContainer {
    private services;
    private singletons;
    /**
     * Registrar un servicio como singleton
     * @param key Clave única del servicio
     * @param factory Función que crea la instancia del servicio
     */
    registerSingleton<T>(key: string, factory: (container: DIContainer) => T): void;
    /**
     * Registrar un servicio que se instancia cada vez
     * @param key Clave única del servicio
     * @param factory Función que crea la instancia del servicio
     */
    registerTransient<T>(key: string, factory: (container: DIContainer) => T): void;
    /**
     * Resolver una dependencia
     * @param key Clave del servicio
     * @returns Instancia del servicio
     */
    resolve<T>(key: string): T;
    /**
     * Verificar si un servicio está registrado
     * @param key Clave del servicio
     * @returns true si está registrado
     */
    has(key: string): boolean;
    /**
     * Limpiar todas las instancias singleton (útil para testing)
     */
    clear(): void;
}
export declare const container: DIContainer;
//# sourceMappingURL=diContainer.d.ts.map