"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthService_1 = require("../src/services/AuthService");
describe('AuthService', () => {
    let authService;
    let mockUserService;
    let mockFeedService;
    let mockEventBus;
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
        foto_perfil: Buffer.from('fake-avatar'),
        creado_en: new Date()
    };
    beforeEach(() => {
        // Crear mocks
        mockUserService = {
            createUser: jest.fn(),
            getUserById: jest.fn(),
            getUserByEmail: jest.fn(),
            getUserByUsername: jest.fn(),
            getUserWithPassword: jest.fn(),
            updateProfilePhoto: jest.fn(),
            updateUsername: jest.fn(),
            deleteUserCompletely: jest.fn(),
            isPageOwner: jest.fn()
        };
        mockFeedService = {
            getFeed: jest.fn(),
            getUserFeed: jest.fn(),
            getFeedEntry: jest.fn(),
            createUserRegistrationEntry: jest.fn(),
            createFeedEntry: jest.fn(),
            updateFeedEntry: jest.fn(),
            deleteFeedEntry: jest.fn(),
            deleteUserFeedEntries: jest.fn(),
            searchFeed: jest.fn(),
            getFeedStats: jest.fn(),
            syncFeedWithPages: jest.fn(),
            cleanOrphanedEntries: jest.fn(),
            getFollowingFeed: jest.fn()
        };
        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            removeAllListeners: jest.fn()
        };
        // Configurar variables de entorno para JWT
        process.env.JWT_SECRET = 'test-secret';
        authService = new AuthService_1.AuthService(mockUserService, mockFeedService, mockEventBus);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('register', () => {
        const userData = {
            email: 'test@example.com',
            password: 'SecurePass123'
        };
        it('should register a new user successfully', async () => {
            // Arrange
            const expectedUser = { ...mockUser };
            const expectedToken = 'mock-jwt-token';
            mockUserService.createUser.mockResolvedValue(expectedUser);
            mockFeedService.createUserRegistrationEntry.mockResolvedValue(1);
            mockEventBus.emit.mockResolvedValue();
            // Mock crypto.randomUUID
            const mockRandomUUID = jest.spyOn(require('crypto'), 'randomUUID');
            mockRandomUUID.mockReturnValue('unique-username');
            // Act
            const result = await authService.register(userData);
            // Assert
            expect(mockUserService.createUser).toHaveBeenCalledWith({
                ...userData,
                username: 'unique-username'
            });
            expect(mockFeedService.createUserRegistrationEntry).toHaveBeenCalledWith(expectedUser.id, expectedUser.username);
            expect(mockEventBus.emit).toHaveBeenCalledWith('user.registered', {
                userId: expectedUser.id,
                username: expectedUser.username,
                email: userData.email
            });
            expect(result).toEqual({
                user: expectedUser,
                token: expect.any(String),
                username: expectedUser.username
            });
            mockRandomUUID.mockRestore();
        });
        it('should handle feed service errors gracefully', async () => {
            // Arrange
            const expectedUser = { ...mockUser };
            mockUserService.createUser.mockResolvedValue(expectedUser);
            mockFeedService.createUserRegistrationEntry.mockRejectedValue(new Error('Feed error'));
            mockEventBus.emit.mockResolvedValue();
            const mockRandomUUID = jest.spyOn(require('crypto'), 'randomUUID');
            mockRandomUUID.mockReturnValue('unique-username');
            // Act
            const result = await authService.register(userData);
            // Assert
            expect(result.user).toEqual(expectedUser);
            expect(result.token).toBeDefined();
            mockRandomUUID.mockRestore();
        });
        it('should handle event bus errors gracefully', async () => {
            // Arrange
            const expectedUser = { ...mockUser };
            mockUserService.createUser.mockResolvedValue(expectedUser);
            mockFeedService.createUserRegistrationEntry.mockResolvedValue(1);
            mockEventBus.emit.mockRejectedValue(new Error('Event bus error'));
            const mockRandomUUID = jest.spyOn(require('crypto'), 'randomUUID');
            mockRandomUUID.mockReturnValue('unique-username');
            // Act
            const result = await authService.register(userData);
            // Assert
            expect(result.user).toEqual(expectedUser);
            expect(result.token).toBeDefined();
            mockRandomUUID.mockRestore();
        });
    });
    describe('login', () => {
        const loginData = {
            email: 'test@example.com',
            password: 'SecurePass123'
        };
        const userWithPassword = {
            ...mockUser,
            password: '$2b$10$hashedpassword'
        };
        it('should login user successfully', async () => {
            // Arrange
            mockUserService.getUserWithPassword.mockResolvedValue(userWithPassword);
            // Mock bcrypt.compare
            const bcryptCompare = jest.spyOn(require('bcryptjs'), 'compare');
            bcryptCompare.mockResolvedValue(true);
            // Act
            const result = await authService.login(loginData.email, loginData.password);
            // Assert
            expect(mockUserService.getUserWithPassword).toHaveBeenCalledWith(loginData.email);
            expect(bcryptCompare).toHaveBeenCalledWith(loginData.password, userWithPassword.password);
            expect(result).toEqual({
                user: {
                    id: mockUser.id,
                    email: mockUser.email,
                    username: mockUser.username,
                    foto_perfil: mockUser.foto_perfil,
                    creado_en: mockUser.creado_en
                },
                token: expect.any(String)
            });
            bcryptCompare.mockRestore();
        });
        it('should throw error for non-existent user', async () => {
            // Arrange
            mockUserService.getUserWithPassword.mockResolvedValue(null);
            // Act & Assert
            await expect(authService.login(loginData.email, loginData.password))
                .rejects.toThrow('Credenciales inválidas');
        });
        it('should throw error for invalid password', async () => {
            // Arrange
            mockUserService.getUserWithPassword.mockResolvedValue(userWithPassword);
            const bcryptCompare = jest.spyOn(require('bcryptjs'), 'compare');
            bcryptCompare.mockResolvedValue(false);
            // Act & Assert
            await expect(authService.login(loginData.email, loginData.password))
                .rejects.toThrow('Credenciales inválidas');
            bcryptCompare.mockRestore();
        });
    });
    describe('verifyToken', () => {
        it('should verify valid token', () => {
            // Arrange
            const userId = 'user-123';
            const token = require('jsonwebtoken').sign({ userId }, 'test-secret');
            // Act
            const result = authService.verifyToken(token);
            // Assert
            expect(result.userId).toBe(userId);
        });
        it('should throw error for invalid token', () => {
            // Arrange
            const invalidToken = 'invalid-token';
            // Act & Assert
            expect(() => authService.verifyToken(invalidToken))
                .toThrow('Token inválido');
        });
        it('should throw error for expired token', () => {
            // Arrange
            const expiredToken = require('jsonwebtoken').sign({ userId: 'user-123' }, 'test-secret', { expiresIn: '-1h' });
            // Act & Assert
            expect(() => authService.verifyToken(expiredToken))
                .toThrow('Token inválido');
        });
    });
});
//# sourceMappingURL=auth-service.test.js.map