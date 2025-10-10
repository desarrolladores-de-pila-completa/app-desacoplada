"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureServices = configureServices;
exports.getService = getService;
const diContainer_1 = require("./diContainer");
const UserService_1 = require("../services/UserService");
const PageService_1 = require("../services/PageService");
const CommentService_1 = require("../services/CommentService");
const FeedService_1 = require("../services/FeedService");
const AuthService_1 = require("../services/AuthService");
/**
 * Configuración de servicios para el container de DI
 * Registra todos los servicios como singletons
 */
function configureServices() {
    // Servicios base (sin dependencias)
    diContainer_1.container.registerSingleton('UserService', () => new UserService_1.UserService());
    diContainer_1.container.registerSingleton('PageService', () => new PageService_1.PageService());
    diContainer_1.container.registerSingleton('CommentService', () => new CommentService_1.CommentService());
    diContainer_1.container.registerSingleton('FeedService', () => new FeedService_1.FeedService());
    // Servicios con dependencias
    diContainer_1.container.registerSingleton('AuthService', (c) => {
        const userService = c.resolve('UserService');
        const feedService = c.resolve('FeedService');
        return new AuthService_1.AuthService(userService, feedService);
    });
}
/**
 * Función helper para obtener servicios del container
 */
function getService(key) {
    return diContainer_1.container.resolve(key);
}
//# sourceMappingURL=servicesConfig.js.map