import { container } from './diContainer';
import { UserService } from '../services/UserService';
import { PageService } from '../services/PageService';
import { CommentService } from '../services/CommentService';
import { FeedService } from '../services/FeedService';
import { AuthService } from '../services/AuthService';

/**
 * Configuración de servicios para el container de DI
 * Registra todos los servicios como singletons
 */
export function configureServices(): void {
  // Servicios base (sin dependencias)
  container.registerSingleton('UserService', () => new UserService());
  container.registerSingleton('PageService', () => new PageService());
  container.registerSingleton('CommentService', () => new CommentService());
  container.registerSingleton('FeedService', () => new FeedService());

  // Servicios con dependencias
  container.registerSingleton('AuthService', (c) => {
    const userService = c.resolve<UserService>('UserService');
    const feedService = c.resolve<FeedService>('FeedService');
    return new AuthService(userService, feedService);
  });
}

/**
 * Función helper para obtener servicios del container
 */
export function getService<T>(key: string): T {
  return container.resolve<T>(key);
}