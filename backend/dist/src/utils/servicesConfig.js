"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureServices = configureServices;
exports.getService = getService;
const diContainer_1 = require("./diContainer");
const UserService_1 = require("../services/UserService");
const PageService_1 = require("../services/PageService");
const CommentService_1 = require("../services/CommentService");
const FeedService_1 = require("../services/FeedService");
const ChatService_1 = require("../services/ChatService");
const AuthService_1 = require("../services/AuthService");
const eventBus_1 = require("./eventBus");
const repositories_1 = require("../repositories");
const PublicacionService_1 = require("../services/PublicacionService");
const PrivateMessageService_1 = require("../services/PrivateMessageService");
/**
 * Configuración de servicios para el container de DI
 * Registra todos los servicios como singletons
 */
function configureServices() {
    // EventBus
    diContainer_1.container.registerSingleton('IEventBus', () => eventBus_1.eventBus);
    // Repositorios base
    diContainer_1.container.registerSingleton('IUserRepository', () => new repositories_1.UserRepository());
    diContainer_1.container.registerSingleton('IPageRepository', () => new repositories_1.PageRepository());
    diContainer_1.container.registerSingleton('ICommentRepository', () => new repositories_1.CommentRepository());
    diContainer_1.container.registerSingleton('IFeedRepository', () => new repositories_1.FeedRepository());
    diContainer_1.container.registerSingleton('IChatRepository', () => new repositories_1.ChatRepository());
    diContainer_1.container.registerSingleton('IPrivateMessageRepository', () => new repositories_1.PrivateMessageRepository());
    // Servicios con dependencias de repositorios
    diContainer_1.container.registerSingleton('UserService', (c) => {
        const userRepository = c.resolve('IUserRepository');
        const pageRepository = c.resolve('IPageRepository');
        return new UserService_1.UserService(userRepository, pageRepository);
    });
    diContainer_1.container.registerSingleton('PageService', (c) => {
        const pageRepository = c.resolve('IPageRepository');
        const feedRepository = c.resolve('IFeedRepository');
        const eventBus = c.resolve('IEventBus');
        return new PageService_1.PageService(pageRepository, feedRepository, eventBus);
    });
    diContainer_1.container.registerSingleton('CommentService', (c) => {
        const commentRepository = c.resolve('ICommentRepository');
        return new CommentService_1.CommentService(commentRepository);
    });
    diContainer_1.container.registerSingleton('FeedService', (c) => {
        const feedRepository = c.resolve('IFeedRepository');
        return new FeedService_1.FeedService(feedRepository);
    });
    diContainer_1.container.registerSingleton('ChatService', (c) => {
        const chatRepository = c.resolve('IChatRepository');
        return new ChatService_1.ChatService(chatRepository);
    });
    diContainer_1.container.registerSingleton('PrivateMessageService', (c) => {
        const privateMessageRepository = c.resolve('IPrivateMessageRepository');
        return new PrivateMessageService_1.PrivateMessageService(privateMessageRepository);
    });
    diContainer_1.container.registerSingleton('PublicacionService', (c) => {
        const publicacionRepository = new repositories_1.PublicacionRepository();
        return new PublicacionService_1.PublicacionService(publicacionRepository);
    });
    // Servicios con dependencias
    diContainer_1.container.registerSingleton('AuthService', (c) => {
        const userService = c.resolve('UserService');
        const feedService = c.resolve('FeedService');
        const eventBus = c.resolve('IEventBus');
        return new AuthService_1.AuthService(userService, feedService, eventBus);
    });
}
/**
 * Función helper para obtener servicios del container
 */
function getService(key) {
    return diContainer_1.container.resolve(key);
}
//# sourceMappingURL=servicesConfig.js.map