import { EventName, EventListener, EventDataMap, IEventBus } from '../types/interfaces';
/**
 * EventBus para manejar eventos del sistema de manera desacoplada.
 * Permite emitir eventos y registrar listeners para procesarlos.
 */
export declare class EventBus implements IEventBus {
    private listeners;
    /**
     * Emite un evento con su payload correspondiente.
     * Ejecuta todos los listeners registrados para ese evento de forma asíncrona.
     */
    emit<T extends EventName>(event: T, payload: EventDataMap[T]): Promise<void>;
    /**
     * Registra un listener para un evento específico.
     */
    on<T extends EventName>(event: T, listener: EventListener<T>): void;
    /**
     * Remueve un listener específico para un evento.
     */
    off<T extends EventName>(event: T, listener: EventListener<T>): void;
    /**
     * Remueve todos los listeners para un evento específico, o todos si no se especifica.
     */
    removeAllListeners(event?: EventName): void;
    /**
     * Obtiene el número de listeners registrados para un evento.
     * Útil para debugging y testing.
     */
    getListenerCount(event: EventName): number;
    /**
     * Obtiene todos los eventos que tienen listeners registrados.
     */
    getRegisteredEvents(): EventName[];
}
export declare const eventBus: EventBus;
//# sourceMappingURL=eventBus.d.ts.map