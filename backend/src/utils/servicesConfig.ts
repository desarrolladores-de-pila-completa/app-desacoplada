import { container } from './diContainer';
import { UserService } from '../services/UserService';
import { PageService } from '../services/PageService';
import { CommentService } from '../services/CommentService';
import { FeedService } from '../services/FeedService';
import { ChatService } from '../services/ChatService';
import { AuthService } from '../services/AuthService';
import { eventBus } from './eventBus';
import { IEventBus } from '../types/interfaces';
import {
  UserRepository,
  PageRepository,
  CommentRepository,
  FeedRepository,
  ChatRepository,
  PublicacionRepository,
  IUserRepository,
  IPageRepository,
  ICommentRepository,
  IFeedRepository,
  IChatRepository
} from '../repositories';
import { PublicacionService } from '../services/PublicacionService';

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
  container.registerSingleton('IFeedRepository', () => new FeedRepository());
  container.registerSingleton('IChatRepository', () => new ChatRepository());

  // Servicios con dependencias de repositorios
  container.registerSingleton('UserService', (c) => {
    const userRepository = c.resolve<IUserRepository>('IUserRepository');
    const pageRepository = c.resolve<IPageRepository>('IPageRepository');
    return new UserService(userRepository, pageRepository);
  });

  container.registerSingleton('PageService', (c) => {
    const pageRepository = c.resolve<IPageRepository>('IPageRepository');
    const feedRepository = c.resolve<IFeedRepository>('IFeedRepository');
    const eventBus = c.resolve<IEventBus>('IEventBus');
    return new PageService(pageRepository, feedRepository, eventBus);
  });

  container.registerSingleton('CommentService', (c) => {
    const commentRepository = c.resolve<ICommentRepository>('ICommentRepository');
    return new CommentService(commentRepository);
  });

  container.registerSingleton('FeedService', (c) => {
    const feedRepository = c.resolve<IFeedRepository>('IFeedRepository');
    return new FeedService(feedRepository);
  });

  container.registerSingleton('ChatService', (c) => {
    const chatRepository = c.resolve<IChatRepository>('IChatRepository');
    return new ChatService(chatRepository);
  });

  container.registerSingleton('PublicacionService', (c) => {
    const publicacionRepository = new PublicacionRepository();
    return new PublicacionService(publicacionRepository);
  });

  // Servicios con dependencias
  container.registerSingleton('AuthService', (c) => {
    const userService = c.resolve<UserService>('UserService');
    const feedService = c.resolve<FeedService>('FeedService');
    const eventBus = c.resolve<IEventBus>('IEventBus');
    return new AuthService(userService, feedService, eventBus);
  });
}

/**
 * Función helper para obtener servicios del container
 */
export function getService<T>(key: string): T {
  return container.resolve<T>(key);
}