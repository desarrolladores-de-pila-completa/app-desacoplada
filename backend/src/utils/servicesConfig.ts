import { container } from './diContainer';
import { UserService } from '../services/UserService';
import { PageService } from '../services/PageService';
import { CommentService } from '../services/CommentService';
import { AuthService } from '../services/AuthService';
import { PublicacionService } from '../services/PublicacionService';
import { eventBus } from './eventBus';
import { IEventBus } from '../types/interfaces';
import {
  UserRepository,
  PageRepository,
  CommentRepository,
  PrivateMessageRepository,
  PublicacionRepository,
  IUserRepository,
  IPageRepository,
  ICommentRepository,
  IPrivateMessageRepository
} from '../repositories';
import { PrivateMessageService } from '../services/PrivateMessageService';

/**
 * Configuración de servicios para el container de DI
 * Registra todos los servicios como singletons
 */
export function configureServices(): void {
  // EventBus
  container.registerSingleton('IEventBus', () => eventBus);

  // Repositorios base
  container.registerSingleton('IUserRepository', () => new UserRepository());
  container.registerSingleton('IPageRepository', () => new PageRepository());
  container.registerSingleton('ICommentRepository', () => new CommentRepository());
  container.registerSingleton('IPrivateMessageRepository', () => new PrivateMessageRepository());
  container.registerSingleton('PublicacionRepository', () => new PublicacionRepository());

  // Servicios con dependencias de repositorios
  container.registerSingleton('UserService', (c) => {
    const userRepository = c.resolve<IUserRepository>('IUserRepository');
    const pageRepository = c.resolve<IPageRepository>('IPageRepository');
    return new UserService(userRepository, pageRepository);
  });

  container.registerSingleton('PageService', (c) => {
    const pageRepository = c.resolve<IPageRepository>('IPageRepository');
    const eventBus = c.resolve<IEventBus>('IEventBus');
    return new PageService(pageRepository, eventBus);
  });

  container.registerSingleton('CommentService', (c) => {
    const commentRepository = c.resolve<ICommentRepository>('ICommentRepository');
    return new CommentService(commentRepository);
  });


  container.registerSingleton('PrivateMessageService', (c) => {
    const privateMessageRepository = c.resolve<IPrivateMessageRepository>('IPrivateMessageRepository');
    return new PrivateMessageService(privateMessageRepository);
  });

  container.registerSingleton('PublicacionService', (c) => {
    const publicacionRepository = c.resolve<PublicacionRepository>('PublicacionRepository');
    return new PublicacionService(publicacionRepository);
  });

  // Servicios con dependencias
  container.registerSingleton('AuthService', (c) => {
    const userService = c.resolve<UserService>('UserService');
    const eventBus = c.resolve<IEventBus>('IEventBus');
    return new AuthService(userService, eventBus);
  });
}

/**
 * Función helper para obtener servicios del container
 */
export function getService<T>(key: string): T {
  return container.resolve<T>(key);
}