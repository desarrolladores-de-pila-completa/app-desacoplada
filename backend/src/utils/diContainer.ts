/**
 * Container básico de inyección de dependencias
 * Permite registrar y resolver dependencias de manera centralizada
 */
export class DIContainer {
  private services: Map<string, any> = new Map();
  private singletons: Map<string, any> = new Map();

  /**
   * Registrar un servicio como singleton
   * @param key Clave única del servicio
   * @param factory Función que crea la instancia del servicio
   */
  registerSingleton<T>(key: string, factory: (container: DIContainer) => T): void {
    this.services.set(key, { type: 'singleton', factory });
  }

  /**
   * Registrar un servicio que se instancia cada vez
   * @param key Clave única del servicio
   * @param factory Función que crea la instancia del servicio
   */
  registerTransient<T>(key: string, factory: (container: DIContainer) => T): void {
    this.services.set(key, { type: 'transient', factory });
  }

  /**
   * Resolver una dependencia
   * @param key Clave del servicio
   * @returns Instancia del servicio
   */
  resolve<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Servicio no registrado: ${key}`);
    }

    if (service.type === 'singleton') {
      if (!this.singletons.has(key)) {
        this.singletons.set(key, service.factory(this));
      }
      return this.singletons.get(key);
    } else {
      return service.factory(this);
    }
  }

  /**
   * Verificar si un servicio está registrado
   * @param key Clave del servicio
   * @returns true si está registrado
   */
  has(key: string): boolean {
    return this.services.has(key);
  }

  /**
   * Limpiar todas las instancias singleton (útil para testing)
   */
  clear(): void {
    this.singletons.clear();
  }
}

// Instancia global del container
export const container = new DIContainer();