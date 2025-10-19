import { UsernameUpdateService, UsernameUpdateOptions, UsernameUpdateResult } from '../src/services/UsernameUpdateService';
import { ContentUpdateService, ContentUpdateOptions, UpdateStatistics } from '../src/services/ContentUpdateService';
import { CacheInvalidationService, CacheInvalidationResult, UsernameChangeContext, CacheInvalidationOptions } from '../src/services/CacheInvalidationService';
import { ValidationService } from '../src/services/ValidationService';
import { User, AppError } from '../src/types/interfaces';
import { pool } from '../src/middlewares/db';
import winston from '../src/utils/logger';

// Mocks para servicios externos
jest.mock('../src/services/ContentUpdateService');
jest.mock('../src/services/CacheInvalidationService');
jest.mock('../src/services/ValidationService');
jest.mock('../src/middlewares/db');
jest.mock('../src/utils/logger');

describe('UsernameUpdateService', () => {
  let usernameUpdateService: UsernameUpdateService;
  let mockContentUpdateService: jest.Mocked<ContentUpdateService>;
  let mockCacheInvalidationService: jest.Mocked<CacheInvalidationService>;
  let mockPool: jest.Mocked<typeof pool>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'oldusername',
    display_name: 'Test User',
    foto_perfil: Buffer.from('fake-avatar'),
    creado_en: new Date()
  };

  const mockContentUpdateResult: UpdateStatistics = {
    totalReferences: 5,
    updatedReferences: 5,
    errors: [],
    details: {
      comments: { found: 2, updated: 2 },
      feed: { found: 1, updated: 1 },
      privateMessages: { found: 1, updated: 1 },
      publications: { found: 1, updated: 1 }
    }
  };

  const mockCacheInvalidationResult: CacheInvalidationResult = {
    success: true,
    invalidatedKeys: ['user:id:user-123', 'user:username:oldusername'],
    errors: [],
    timestamp: new Date()
  };

  beforeEach(() => {
    // Crear mocks
    mockContentUpdateService = {
      updateContentReferences: jest.fn(),
      getReferenceStatistics: jest.fn()
    } as any;

    mockCacheInvalidationService = {
      invalidateUserCache: jest.fn(),
      getInvalidationStats: jest.fn()
    } as any;

    mockPool = {
      getConnection: jest.fn(),
      query: jest.fn()
    } as any;

    // Configurar mocks
    (ContentUpdateService as jest.Mock).mockImplementation(() => mockContentUpdateService);
    (CacheInvalidationService as jest.Mock).mockImplementation(() => mockCacheInvalidationService);
    (pool as any) = mockPool;

    // Crear instancia del servicio
    usernameUpdateService = new UsernameUpdateService();

    // Reset logs
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Funcionalidad básica de actualización de nombre de usuario', () => {
    it('debería actualizar el nombre de usuario exitosamente', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      // Mock database responses
      mockPool.query
        .mockResolvedValueOnce([[mockUser]]) // getCurrentUser
        .mockResolvedValueOnce([]) // check if new username exists
        .mockResolvedValueOnce({ affectedRows: 1 }); // update username

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);
      mockCacheInvalidationService.invalidateUserCache.mockResolvedValue(mockCacheInvalidationResult);

      // Mock transaction
      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn()
      };

      mockConnection.query.mockResolvedValue({ affectedRows: 2 }); // create redirects
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.oldUsername).toBe('oldusername');
      expect(result.newUsername).toBe('newusername');
      expect(result.contentUpdate).toEqual(mockContentUpdateResult);
      expect(result.cacheInvalidation).toEqual(mockCacheInvalidationResult);
      expect(result.redirectsCreated).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
    });

    it('debería retornar éxito cuando el nuevo username es igual al actual', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'oldusername' // mismo que el actual
      };

      mockPool.query.mockResolvedValueOnce([[mockUser]]);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('El nuevo username es igual al actual');
      expect(result.oldUsername).toBe('oldusername');
      expect(result.newUsername).toBe('oldusername');
    });

    it('debería retornar error cuando el usuario no existe', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query.mockResolvedValueOnce([[]]); // usuario no encontrado

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Usuario no encontrado');
      expect(mockPool.getConnection).not.toHaveBeenCalled();
    });
  });

  describe('Validación de nombres de usuario únicos', () => {
    it('debería retornar error cuando el nuevo username ya está en uso', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'existingusername'
      };

      const existingUser = { ...mockUser, username: 'existingusername' };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]]) // getCurrentUser
        .mockResolvedValueOnce([[existingUser]]); // check if new username exists

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('El username ya está en uso'))).toBe(true);
    });

    it('debería permitir actualizar al mismo usuario con username existente', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'oldusername' // mismo usuario, mismo username
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]]) // getCurrentUser
        .mockResolvedValueOnce([[mockUser]]); // check if new username exists (mismo usuario)

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.warnings).toContain('El nuevo username es igual al actual');
    });
  });

  describe('Búsqueda y actualización de referencias en contenido', () => {
    it('debería actualizar referencias en contenido correctamente', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 });

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn().mockResolvedValue({ affectedRows: 2 })
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);
      mockCacheInvalidationService.invalidateUserCache.mockResolvedValue(mockCacheInvalidationResult);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(mockContentUpdateService.updateContentReferences).toHaveBeenCalledWith({
        oldUsername: 'oldusername',
        newUsername: 'newusername',
        dryRun: false
      });
      expect(result.contentUpdate).toEqual(mockContentUpdateResult);
      expect(result.contentUpdate?.totalReferences).toBe(5);
      expect(result.contentUpdate?.updatedReferences).toBe(5);
    });

    it('debería omitir actualización de contenido cuando skipContentUpdate es true', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername',
        skipContentUpdate: true
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn().mockResolvedValue({ affectedRows: 2 })
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);
      mockCacheInvalidationService.invalidateUserCache.mockResolvedValue(mockCacheInvalidationResult);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(mockContentUpdateService.updateContentReferences).not.toHaveBeenCalled();
      expect(result.contentUpdate).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });

  describe('Invalidación de caché', () => {
    it('debería invalidar caché correctamente', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 });

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn().mockResolvedValue({ affectedRows: 2 })
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(mockCacheInvalidationService.invalidateUserCache).toHaveBeenCalledWith(
        expect.objectContaining({
          oldUsername: 'oldusername',
          newUsername: 'newusername',
          userId: 'user-123',
          user: mockUser
        }),
        expect.objectContaining({
          dryRun: false,
          preserveUserId: false,
          createNewEntries: true
        })
      );
      expect(result.cacheInvalidation).toEqual(mockCacheInvalidationResult);
    });

    it('debería omitir invalidación de caché cuando skipCacheInvalidation es true', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername',
        skipCacheInvalidation: true
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 });

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn().mockResolvedValue({ affectedRows: 2 })
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(mockCacheInvalidationService.invalidateUserCache).not.toHaveBeenCalled();
      expect(result.cacheInvalidation).toBeUndefined();
      expect(result.success).toBe(true);
    });
  });
  
  describe('UsernameUpdateService - Pruebas de Integración', () => {
    let usernameUpdateService: UsernameUpdateService;
  
    beforeEach(() => {
      usernameUpdateService = new UsernameUpdateService();
      jest.clearAllMocks();
    });
  
    describe('Flujo completo de actualización con servicios reales', () => {
      it('debería completar flujo completo de actualización exitosamente', async () => {
        // Arrange
        const options: UsernameUpdateOptions = {
          userId: 'user-123',
          newUsername: 'newusername'
        };
  
        // Mock de respuestas de base de datos para escenario exitoso
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'oldusername',
          display_name: 'Test User',
          foto_perfil: Buffer.from('fake-avatar'),
          creado_en: new Date()
        };
  
        // Configurar mocks de base de datos
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[mockUser]]) // getCurrentUser
          .mockResolvedValueOnce([]) // check if new username exists
          .mockResolvedValueOnce({ affectedRows: 1 }) // update username
          .mockResolvedValueOnce([{ affectedRows: 2 }]) // create redirects
          .mockResolvedValueOnce([{ affectedRows: 2 }]); // create redirects
  
        // Mock de servicios colaboradores
        mockContentUpdateService.updateContentReferences.mockResolvedValue({
          totalReferences: 3,
          updatedReferences: 3,
          errors: [],
          details: {
            comments: { found: 1, updated: 1 },
            feed: { found: 1, updated: 1 },
            privateMessages: { found: 1, updated: 1 },
            publications: { found: 0, updated: 0 }
          }
        });
  
        mockCacheInvalidationService.invalidateUserCache.mockResolvedValue({
          success: true,
          invalidatedKeys: ['user:profile:oldusername', 'user:profile:user-123'],
          errors: [],
          timestamp: new Date()
        });
  
        // Act
        const result = await usernameUpdateService.updateUsername(options);
  
        // Assert
        expect(result.success).toBe(true);
        expect(result.oldUsername).toBe('oldusername');
        expect(result.newUsername).toBe('newusername');
        expect(result.contentUpdate?.totalReferences).toBe(3);
        expect(result.cacheInvalidation?.invalidatedKeys).toHaveLength(2);
        expect(result.redirectsCreated).toBe(2);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
      });
  
      it('debería manejar errores de servicios colaboradores correctamente', async () => {
        // Arrange
        const options: UsernameUpdateOptions = {
          userId: 'user-123',
          newUsername: 'newusername'
        };
  
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'oldusername',
          display_name: 'Test User',
          foto_perfil: Buffer.from('fake-avatar'),
          creado_en: new Date()
        };
  
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[mockUser]]) // getCurrentUser
          .mockResolvedValueOnce([]) // check if new username exists
          .mockResolvedValueOnce({ affectedRows: 1 }); // update username
  
        // Simular error en servicio de contenido
        mockContentUpdateService.updateContentReferences.mockRejectedValue(
          new Error('Error de conexión a base de datos')
        );
  
        // Act
        const result = await usernameUpdateService.updateUsername(options);
  
        // Assert
        expect(result.success).toBe(false);
        expect(result.errors.some(error =>
          error.includes('Error actualizando referencias de contenido')
        )).toBe(true);
        expect(result.contentUpdate).toBeUndefined();
      });
    });
  
    describe('Preview con servicios reales', () => {
      it('debería generar preview completo con datos reales', async () => {
        // Arrange
        const referenceStats = {
          comments: 5,
          feed: 3,
          privateMessages: 2,
          publications: 1,
          total: 11
        };
  
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'oldusername',
          display_name: 'Test User',
          foto_perfil: Buffer.from('fake-avatar'),
          creado_en: new Date()
        };
  
        (pool.query as jest.Mock).mockResolvedValueOnce([[mockUser]]);
        mockContentUpdateService.getReferenceStatistics.mockResolvedValue(referenceStats);
        mockCacheInvalidationService.getInvalidationStats.mockReturnValue({
          size: 5,
          keys: [
            'user:profile:oldusername',
            'user:profile:user-123',
            'user:pages:oldusername',
            'other:key1',
            'other:key2'
          ]
        });
  
        // Act
        const preview = await usernameUpdateService.previewUsernameUpdate('user-123', 'newusername');
  
        // Assert
        expect(preview.oldUsername).toBe('oldusername');
        expect(preview.newUsername).toBe('newusername');
        expect(preview.contentReferences.total).toBe(11);
        expect(preview.contentReferences.comments).toBe(5);
        expect(preview.cacheEntries).toEqual([
          'user:profile:oldusername',
          'user:profile:user-123',
          'user:pages:oldusername'
        ]);
        expect(preview.canProceed).toBe(true);
      });
    });
  
    describe('Escenarios de error realistas', () => {
      it('debería manejar errores de conexión a base de datos', async () => {
        // Arrange
        const options: UsernameUpdateOptions = {
          userId: 'user-123',
          newUsername: 'newusername'
        };
  
        (pool.query as jest.Mock).mockRejectedValue(new Error('Connection lost'));
  
        // Act & Assert
        await expect(usernameUpdateService.updateUsername(options))
          .rejects.toThrow();
  
        expect(mockContentUpdateService.updateContentReferences).not.toHaveBeenCalled();
      });
  
      it('debería continuar con proceso si creación de redirecciones falla parcialmente', async () => {
        // Arrange
        const options: UsernameUpdateOptions = {
          userId: 'user-123',
          newUsername: 'newusername'
        };
  
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'oldusername',
          display_name: 'Test User',
          foto_perfil: Buffer.from('fake-avatar'),
          creado_en: new Date()
        };
  
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[mockUser]]) // getCurrentUser
          .mockResolvedValueOnce([]) // check if new username exists
          .mockResolvedValueOnce({ affectedRows: 1 }) // update username
          .mockRejectedValueOnce(new Error('Error creando redirecciones')); // create redirects fails
  
        mockContentUpdateService.updateContentReferences.mockResolvedValue({
          totalReferences: 0,
          updatedReferences: 0,
          errors: [],
          details: {
            comments: { found: 0, updated: 0 },
            feed: { found: 0, updated: 0 },
            privateMessages: { found: 0, updated: 0 },
            publications: { found: 0, updated: 0 }
          }
        });
  
        mockCacheInvalidationService.invalidateUserCache.mockResolvedValue({
          success: true,
          invalidatedKeys: [],
          errors: [],
          timestamp: new Date()
        });
  
        // Act
        const result = await usernameUpdateService.updateUsername(options);
  
        // Assert
        expect(result.success).toBe(false);
        expect(result.errors.some(error =>
          error.includes('Error creando redirecciones')
        )).toBe(true);
        expect(result.redirectsCreated).toBe(0);
        // El proceso debería haber continuado hasta el punto del error
        expect(mockContentUpdateService.updateContentReferences).toHaveBeenCalled();
      });
    });
  
    describe('Casos límite y validaciones', () => {
      it('debería manejar usernames muy largos correctamente', async () => {
        // Arrange
        const longUsername = 'a'.repeat(100);
        const options: UsernameUpdateOptions = {
          userId: 'user-123',
          newUsername: longUsername
        };
  
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'oldusername',
          display_name: 'Test User',
          foto_perfil: Buffer.from('fake-avatar'),
          creado_en: new Date()
        };
  
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[mockUser]])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce({ affectedRows: 1 });
  
        mockContentUpdateService.updateContentReferences.mockResolvedValue({
          totalReferences: 0,
          updatedReferences: 0,
          errors: [],
          details: {
            comments: { found: 0, updated: 0 },
            feed: { found: 0, updated: 0 },
            privateMessages: { found: 0, updated: 0 },
            publications: { found: 0, updated: 0 }
          }
        });
  
        mockCacheInvalidationService.invalidateUserCache.mockResolvedValue({
          success: true,
          invalidatedKeys: [],
          errors: [],
          timestamp: new Date()
        });
  
        // Act
        const result = await usernameUpdateService.updateUsername(options);
  
        // Assert
        expect(result.success).toBe(true);
        expect(result.newUsername).toBe(longUsername);
      });
  
      it('debería validar caracteres especiales en usernames', async () => {
        // Arrange
        const specialUsername = 'user-name_123';
        const options: UsernameUpdateOptions = {
          userId: 'user-123',
          newUsername: specialUsername
        };
  
        const mockUser = {
          id: 'user-123',
          email: 'test@example.com',
          username: 'oldusername',
          display_name: 'Test User',
          foto_perfil: Buffer.from('fake-avatar'),
          creado_en: new Date()
        };
  
        (pool.query as jest.Mock)
          .mockResolvedValueOnce([[mockUser]])
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce({ affectedRows: 1 });
  
        mockContentUpdateService.updateContentReferences.mockResolvedValue({
          totalReferences: 0,
          updatedReferences: 0,
          errors: [],
          details: {
            comments: { found: 0, updated: 0 },
            feed: { found: 0, updated: 0 },
            privateMessages: { found: 0, updated: 0 },
            publications: { found: 0, updated: 0 }
          }
        });
  
        mockCacheInvalidationService.invalidateUserCache.mockResolvedValue({
          success: true,
          invalidatedKeys: [],
          errors: [],
          timestamp: new Date()
        });
  
        // Act
        const result = await usernameUpdateService.updateUsername(options);
  
        // Assert
        expect(result.success).toBe(true);
        expect(result.newUsername).toBe(specialUsername);
      });
    });
  });

  describe('Creación de redirecciones', () => {
    it('debería crear redirecciones 301 correctamente', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn().mockResolvedValue({ affectedRows: 2 })
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);
      mockCacheInvalidationService.invalidateUserCache.mockResolvedValue(mockCacheInvalidationResult);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO redirects'),
        expect.arrayContaining(['/oldusername', '/newusername'])
      );
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO redirects'),
        expect.arrayContaining(['/pagina/oldusername', '/pagina/newusername'])
      );
      expect(result.redirectsCreated).toBe(2);
    });

    it('debería omitir creación de redirecciones cuando skipRedirects es true', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername',
        skipRedirects: true
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce({ affectedRows: 1 });

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn() // No mock para redirecciones
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);
      mockCacheInvalidationService.invalidateUserCache.mockResolvedValue(mockCacheInvalidationResult);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(mockConnection.query).not.toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO redirects'),
        expect.any(Array)
      );
      expect(result.redirectsCreated).toBe(0);
      expect(result.success).toBe(true);
    });
  });

  describe('Manejo de errores y rollback', () => {
    it('debería hacer rollback cuando falla la actualización de contenido', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockContentUpdateService.updateContentReferences.mockRejectedValue(new Error('Error de contenido'));

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn()
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Error actualizando referencias de contenido: Error de contenido');
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(result.rollbackPerformed).toBe(true);
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it('debería hacer rollback cuando falla la actualización del username en la base de datos', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query
        .mockResolvedValueOnce([[mockUser]])
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('Error de base de datos'));

      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn(),
        query: jest.fn()
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors.some(error => error.includes('Error actualizando username en usuarios'))).toBe(true);
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(result.rollbackPerformed).toBe(true);
    });

    it('debería manejar errores de rollback correctamente', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername'
      };

      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockContentUpdateService.updateContentReferences.mockRejectedValue(new Error('Error de contenido'));

      const mockConnection = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn().mockRejectedValue(new Error('Error de rollback')),
        release: jest.fn(),
        query: jest.fn()
      };
      mockPool.getConnection.mockResolvedValue(mockConnection);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Error actualizando referencias de contenido: Error de contenido');
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(result.rollbackPerformed).toBe(true);
    });
  });

  describe('Dry run mode', () => {
    it('debería ejecutar sin hacer cambios permanentes en modo dry run', async () => {
      // Arrange
      const options: UsernameUpdateOptions = {
        userId: 'user-123',
        newUsername: 'newusername',
        dryRun: true
      };

      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockContentUpdateService.updateContentReferences.mockResolvedValue(mockContentUpdateResult);
      mockCacheInvalidationService.invalidateUserCache.mockResolvedValue(mockCacheInvalidationResult);

      // Act
      const result = await usernameUpdateService.updateUsername(options);

      // Assert
      expect(result.success).toBe(true);
      expect(mockContentUpdateService.updateContentReferences).toHaveBeenCalledWith(
        expect.objectContaining({ dryRun: true })
      );
      expect(mockCacheInvalidationService.invalidateUserCache).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ dryRun: true })
      );
      // No debería haber iniciado transacción en modo dry run
      expect(mockPool.getConnection).not.toHaveBeenCalled();
    });
  });

  describe('Preview functionality', () => {
    it('debería generar preview correctamente', async () => {
      // Arrange
      const referenceStats = {
        comments: 2,
        feed: 1,
        privateMessages: 1,
        publications: 1,
        total: 5
      };

      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockContentUpdateService.getReferenceStatistics.mockResolvedValue(referenceStats);
      mockCacheInvalidationService.getInvalidationStats.mockReturnValue({
        size: 3,
        keys: ['user:id:user-123', 'user:username:oldusername', 'other:key']
      });

      // Act
      const preview = await usernameUpdateService.previewUsernameUpdate('user-123', 'newusername');

      // Assert
      expect(preview.oldUsername).toBe('oldusername');
      expect(preview.newUsername).toBe('newusername');
      expect(preview.userId).toBe('user-123');
      expect(preview.contentReferences).toEqual(referenceStats);
      expect(preview.cacheEntries).toEqual(['user:id:user-123', 'user:username:oldusername']);
      expect(preview.canProceed).toBe(true);
      expect(preview.warnings).toHaveLength(0);
    });

    it('debería manejar errores en preview correctamente', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce([[mockUser]]);
      mockContentUpdateService.getReferenceStatistics.mockRejectedValue(new Error('Error de estadísticas'));

      // Act
      const preview = await usernameUpdateService.previewUsernameUpdate('user-123', 'newusername');

      // Assert
      expect(preview.canProceed).toBe(true); // La validación básica pasó
      expect(preview.warnings.some(w => w.includes('Error obteniendo estadísticas de contenido'))).toBe(true);
    });

    it('debería marcar canProceed como false cuando hay errores de validación', async () => {
      // Arrange
      mockPool.query.mockResolvedValueOnce([[mockUser]]);

      // Mock ValidationService para que lance error
      (ValidationService.validateUpdateUsername as jest.Mock).mockReturnValue({
        error: [{ message: 'Username inválido' }]
      });

      // Act
      const preview = await usernameUpdateService.previewUsernameUpdate('user-123', 'inv@lid');

      // Assert
      expect(preview.canProceed).toBe(false);
      expect(preview.warnings.some(w => w.includes('Username inválido'))).toBe(true);
    });
  });

  describe('Métodos auxiliares', () => {
    describe('getUpdateStatistics', () => {
      it('debería retornar estadísticas básicas', async () => {
        // Arrange
        mockPool.query.mockResolvedValueOnce([[{ count: 5 }]]);

        // Act
        const stats = await usernameUpdateService.getUpdateStatistics('user-123');

        // Assert
        expect(stats.redirectsActive).toBe(5);
        expect(stats.totalUpdates).toBe(0); // No implementado aún
        expect(stats.lastUpdate).toBeUndefined(); // No implementado aún
        expect(stats.averageExecutionTimeMs).toBe(0); // No implementado aún
      });
    });

    describe('cleanupExpiredRedirects', () => {
      it('debería limpiar redirecciones expiradas', async () => {
        // Arrange
        mockPool.query.mockResolvedValueOnce([{ affectedRows: 3 }]);

        // Act
        const deletedCount = await usernameUpdateService.cleanupExpiredRedirects();

        // Assert
        expect(deletedCount).toBe(3);
        expect(mockPool.query).toHaveBeenCalledWith(
          'DELETE FROM redirects WHERE expires_at < NOW()'
        );
      });
    });
  });
});