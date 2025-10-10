"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = exports.EventBus = void 0;
const logger_1 = __importDefault(require("./logger"));
/**
 * EventBus para manejar eventos del sistema de manera desacoplada.
 * Permite emitir eventos y registrar listeners para procesarlos.
 */
class EventBus {
    listeners = new Map();
    /**
     * Emite un evento con su payload correspondiente.
     * Ejecuta todos los listeners registrados para ese evento de forma asíncrona.
     */
    async emit(event, payload) {
        const eventListeners = this.listeners.get(event);
        if (!eventListeners || eventListeners.size === 0) {
            logger_1.default.debug(`No listeners registered for event: ${event}`, { context: 'eventBus' });
            return;
        }
        logger_1.default.debug(`Emitting event: ${event}`, { payload, listenerCount: eventListeners.size, context: 'eventBus' });
        // Ejecutar todos los listeners de forma asíncrona
        const promises = Array.from(eventListeners).map(async (listener) => {
            try {
                await listener(payload);
            }
            catch (error) {
                logger_1.default.error(`Error in event listener for ${event}`, {
                    error: error.message,
                    stack: error.stack,
                    context: 'eventBus'
                });
                // No propagar el error para no detener otros listeners
            }
        });
        await Promise.all(promises);
    }
    /**
     * Registra un listener para un evento específico.
     */
    on(event, listener) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(listener);
        logger_1.default.debug(`Listener registered for event: ${event}`, { context: 'eventBus' });
    }
    /**
     * Remueve un listener específico para un evento.
     */
    off(event, listener) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(listener);
            if (eventListeners.size === 0) {
                this.listeners.delete(event);
            }
            logger_1.default.debug(`Listener removed for event: ${event}`, { context: 'eventBus' });
        }
    }
    /**
     * Remueve todos los listeners para un evento específico, o todos si no se especifica.
     */
    removeAllListeners(event) {
        if (event) {
            this.listeners.delete(event);
            logger_1.default.debug(`All listeners removed for event: ${event}`, { context: 'eventBus' });
        }
        else {
            this.listeners.clear();
            logger_1.default.debug('All listeners removed for all events', { context: 'eventBus' });
        }
    }
    /**
     * Obtiene el número de listeners registrados para un evento.
     * Útil para debugging y testing.
     */
    getListenerCount(event) {
        return this.listeners.get(event)?.size || 0;
    }
    /**
     * Obtiene todos los eventos que tienen listeners registrados.
     */
    getRegisteredEvents() {
        return Array.from(this.listeners.keys());
    }
}
exports.EventBus = EventBus;
// Instancia singleton del EventBus
exports.eventBus = new EventBus();
//# sourceMappingURL=eventBus.js.map