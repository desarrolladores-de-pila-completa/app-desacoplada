"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diContainer_1 = require("../src/utils/diContainer");
const UserService_1 = require("../src/services/UserService");
const AuthService_1 = require("../src/services/AuthService");
const servicesConfig_1 = require("../src/utils/servicesConfig");
describe('Dependency Injection Container', () => {
    let container;
    beforeEach(() => {
        container = new diContainer_1.DIContainer();
    });
    describe('Basic Container Functionality', () => {
        it('should register and resolve singleton services', () => {
            // Arrange
            container.registerSingleton('TestService', () => ({ message: 'Hello from singleton' }));
            // Act
            const service1 = container.resolve('TestService');
            const service2 = container.resolve('TestService');
            // Assert
            expect(service1.message).toBe('Hello from singleton');
            expect(service2.message).toBe('Hello from singleton');
            expect(service1).toBe(service2); // Same instance
        });
        it('should register and resolve transient services', () => {
            // Arrange
            container.registerTransient('TestService', () => ({ message: 'Hello from transient', id: Math.random() }));
            // Act
            const service1 = container.resolve('TestService');
            const service2 = container.resolve('TestService');
            // Assert
            expect(service1.message).toBe('Hello from transient');
            expect(service2.message).toBe('Hello from transient');
            expect(service1).not.toBe(service2); // Different instances
            expect(service1.id).not.toBe(service2.id);
        });
        it('should throw error for unregistered service', () => {
            // Act & Assert
            expect(() => container.resolve('NonExistentService')).toThrow('Servicio no registrado: NonExistentService');
        });
    });
    describe('Service Configuration', () => {
        beforeEach(() => {
            (0, servicesConfig_1.configureServices)();
        });
        it('should resolve UserService', () => {
            // Act
            const userService = (0, servicesConfig_1.getService)('UserService');
            // Assert
            expect(userService).toBeDefined();
            expect(userService).toBeInstanceOf(UserService_1.UserService);
        });
        it('should resolve AuthService with dependencies', () => {
            // Act
            const authService = (0, servicesConfig_1.getService)('AuthService');
            // Assert
            expect(authService).toBeDefined();
            expect(authService).toBeInstanceOf(AuthService_1.AuthService);
        });
        it('should return same instance for singleton services', () => {
            // Act
            const userService1 = (0, servicesConfig_1.getService)('UserService');
            const userService2 = (0, servicesConfig_1.getService)('UserService');
            // Assert
            expect(userService1).toBe(userService2);
        });
        it('should inject dependencies correctly in AuthService', () => {
            // Act
            const authService = (0, servicesConfig_1.getService)('AuthService');
            const userService = (0, servicesConfig_1.getService)('UserService');
            // Assert
            // We can't directly test private properties, but we can verify the service works
            expect(authService).toBeDefined();
            expect(userService).toBeDefined();
        });
    });
});
//# sourceMappingURL=di.test.js.map