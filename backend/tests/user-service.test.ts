import { UserService } from '../src/services/UserService';
import { IUserRepository } from '../src/repositories/IUserRepository';
import { IPageRepository } from '../src/repositories/IPageRepository';
import { User, UserCreateData } from '../src/types/interfaces';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockPageRepository: jest.Mocked<IPageRepository>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    foto_perfil: Buffer.from('fake-avatar'),
    creado_en: new Date()
  };

  beforeEach(() => {
    // Crear mocks
    mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findWithPassword: jest.fn(),
      updateProfilePhoto: jest.fn(),
      updateUsername: jest.fn(),
      delete: jest.fn(),
      isPageOwner: jest.fn()
    } as any;

    mockPageRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      findByUserIdAndTitle: jest.fn(),
      updateVisibility: jest.fn(),
      updateContent: jest.fn(),
      updateTitle: jest.fn(),
      updateDescription: jest.fn(),
      updateComments: jest.fn(),
      updateUsername: jest.fn(),
      updatePropietario: jest.fn(),
      consultarVisibilidad: jest.fn(),
      consultarPropietario: jest.fn(),
      consultarDescripcion: jest.fn(),
      consultarUsuario: jest.fn(),
      consultarComentarios: jest.fn(),
      actualizarVisibilidad: jest.fn(),
      actualizarPropietario: jest.fn(),
      actualizarDescripcion: jest.fn(),
      actualizarUsuario: jest.fn(),
      actualizarComentarios: jest.fn(),
      obtenerPagina: jest.fn(),
      paginasPublicas: jest.fn(),
      guardarComentario: jest.fn()
    } as any;

    userService = new UserService(mockUserRepository, mockPageRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const userData: UserCreateData = {
      email: 'test@example.com',
      password: 'SecurePass123',
      username: 'testuser'
    };

    it('should create a new user successfully', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Mock crypto.randomUUID
      const mockRandomUUID = jest.spyOn(require('crypto'), 'randomUUID');
      mockRandomUUID.mockReturnValue('user-123');

      // Mock bcrypt.hash
      const bcryptHash = jest.spyOn(require('bcryptjs'), 'hash');
      bcryptHash.mockResolvedValue('$2b$10$hashedpassword');

      // Mock generarAvatarBuffer
      const mockGenerarAvatarBuffer = jest.spyOn(require('../src/utils/generarAvatarBuffer'), 'generarAvatarBuffer');
      mockGenerarAvatarBuffer.mockResolvedValue(Buffer.from('fake-avatar'));

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(userData.username);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: '$2b$10$hashedpassword'
      });
      expect(result).toEqual(mockUser);

      mockRandomUUID.mockRestore();
      bcryptHash.mockRestore();
      mockGenerarAvatarBuffer.mockRestore();
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('email ya registrado');
    });

    it('should throw error if username already exists', async () => {
      // Arrange
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.createUser(userData))
        .rejects.toThrow('El username ya está en uso');
    });
  });

  describe('getUserById', () => {
    it('should return user from cache if available', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(mockUser);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');

      // Act
      const result = await userService.getUserById('user-123');

      // Assert
      expect(cacheGetSpy).toHaveBeenCalledWith('user:id:user-123');
      expect(cacheSetSpy).not.toHaveBeenCalled();
      expect(mockUserRepository.findById).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });

    it('should fetch user from repository and cache it', async () => {
      // Arrange
      const cacheService = require('../src/services/CacheService').cacheService;
      const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
      const cacheSetSpy = jest.spyOn(cacheService, 'set');
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserById('user-123');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(cacheSetSpy).toHaveBeenCalledWith('user:id:user-123', mockUser);
      expect(result).toEqual(mockUser);

      cacheGetSpy.mockRestore();
      cacheSetSpy.mockRestore();
    });
  });

  describe('getUserWithPassword', () => {
    it('should return user with password', async () => {
      // Arrange
      const userWithPassword = { ...mockUser, password: 'hashedpassword' };
      mockUserRepository.findWithPassword.mockResolvedValue(userWithPassword);

      // Act
      const result = await userService.getUserWithPassword('test@example.com');

      // Assert
      expect(mockUserRepository.findWithPassword).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(userWithPassword);
    });
  });

  describe('updateUsername', () => {
    it('should update username successfully', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.updateUsername.mockResolvedValue();

      // Act
      await userService.updateUsername('user-123', 'newusername');

      // Assert
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('newusername');
      expect(mockUserRepository.updateUsername).toHaveBeenCalledWith('user-123', 'newusername');
    });

    it('should throw error if username already exists', async () => {
      // Arrange
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(userService.updateUsername('user-123', 'existingusername'))
        .rejects.toThrow('El username ya está en uso');
    });
  });

  describe('deleteUserCompletely', () => {
    it('should delete user completely', async () => {
      // Arrange
      mockUserRepository.delete.mockResolvedValue();

      // Act
      await userService.deleteUserCompletely('user-123');

      // Assert
      expect(mockUserRepository.delete).toHaveBeenCalledWith('user-123');
    });
  });

  describe('isPageOwner', () => {
    it('should check if user is page owner', async () => {
      // Arrange
      mockUserRepository.isPageOwner.mockResolvedValue(true);

      // Act
      const result = await userService.isPageOwner('user-123', 1);

      // Assert
      expect(mockUserRepository.isPageOwner).toHaveBeenCalledWith('user-123', 1);
      expect(result).toBe(true);
    });
  });
});