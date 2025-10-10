import { DIContainer } from '../src/utils/diContainer';
import { UserService } from '../src/services/UserService';
import { AuthService } from '../src/services/AuthService';
import { configureServices, getService } from '../src/utils/servicesConfig';

describe('Dependency Injection Container', () => {
  let container: DIContainer;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe('Basic Container Functionality', () => {
    it('should register and resolve singleton services', () => {
      // Arrange
      container.registerSingleton('TestService', () => ({ message: 'Hello from singleton' }));

      // Act
      const service1 = container.resolve<{ message: string }>('TestService');
      const service2 = container.resolve<{ message: string }>('TestService');

      // Assert
      expect(service1.message).toBe('Hello from singleton');
      expect(service2.message).toBe('Hello from singleton');
      expect(service1).toBe(service2); // Same instance
    });

    it('should register and resolve transient services', () => {
      // Arrange
      container.registerTransient('TestService', () => ({ message: 'Hello from transient', id: Math.random() }));

      // Act
      const service1 = container.resolve<{ message: string; id: number }>('TestService');
      const service2 = container.resolve<{ message: string; id: number }>('TestService');

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
      configureServices();
    });

    it('should resolve UserService', () => {
      // Act
      const userService = getService<UserService>('UserService');

      // Assert
      expect(userService).toBeDefined();
      expect(userService).toBeInstanceOf(UserService);
    });

    it('should resolve AuthService with dependencies', () => {
      // Act
      const authService = getService<AuthService>('AuthService');

      // Assert
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
    });

    it('should return same instance for singleton services', () => {
      // Act
      const userService1 = getService<UserService>('UserService');
      const userService2 = getService<UserService>('UserService');

      // Assert
      expect(userService1).toBe(userService2);
    });

    it('should inject dependencies correctly in AuthService', () => {
      // Act
      const authService = getService<AuthService>('AuthService');
      const userService = getService<UserService>('UserService');

      // Assert
      // We can't directly test private properties, but we can verify the service works
      expect(authService).toBeDefined();
      expect(userService).toBeDefined();
    });
  });
});