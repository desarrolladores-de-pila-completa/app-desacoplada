import { EventName, EventListener, EventDataMap, IEventBus } from '../types/interfaces';
import logger from './logger';

/**
 * EventBus para manejar eventos del sistema de manera desacoplada.
 * Permite emitir eventos y registrar listeners para procesarlos.
 */
export class EventBus implements IEventBus {
  private listeners: Map<EventName, Set<EventListener<any>>> = new Map();

  /**
   * Emite un evento con su payload correspondiente.
   * Ejecuta todos los listeners registrados para ese evento de forma asíncrona.
   */
  async emit<T extends EventName>(event: T, payload: EventDataMap[T]): Promise<void> {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      logger.debug(`No listeners registered for event: ${event}`, { context: 'eventBus' });
      return;
    }

    logger.debug(`Emitting event: ${event}`, { payload, listenerCount: eventListeners.size, context: 'eventBus' });

    // Ejecutar todos los listeners de forma asíncrona
    const promises = Array.from(eventListeners).map(async (listener) => {
      try {
        await listener(payload);
      } catch (error) {
        logger.error(`Error in event listener for ${event}`, {
          error: (error as Error).message,
          stack: (error as Error).stack,
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
  on<T extends EventName>(event: T, listener: EventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    logger.debug(`Listener registered for event: ${event}`, { context: 'eventBus' });
  }

  /**
   * Remueve un listener específico para un evento.
   */
  off<T extends EventName>(event: T, listener: EventListener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
      logger.debug(`Listener removed for event: ${event}`, { context: 'eventBus' });
    }
  }

  /**
   * Remueve todos los listeners para un evento específico, o todos si no se especifica.
   */
  removeAllListeners(event?: EventName): void {
    if (event) {
      this.listeners.delete(event);
      logger.debug(`All listeners removed for event: ${event}`, { context: 'eventBus' });
    } else {
      this.listeners.clear();
      logger.debug('All listeners removed for all events', { context: 'eventBus' });
    }
  }

  /**
   * Obtiene el número de listeners registrados para un evento.
   * Útil para debugging y testing.
   */
  getListenerCount(event: EventName): number {
    return this.listeners.get(event)?.size || 0;
  }

  /**
   * Obtiene todos los eventos que tienen listeners registrados.
   */
  getRegisteredEvents(): EventName[] {
    return Array.from(this.listeners.keys());
  }
}

// Instancia singleton del EventBus
export const eventBus = new EventBus();