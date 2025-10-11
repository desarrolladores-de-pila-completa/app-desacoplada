"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PageService_1 = require("../src/services/PageService");
describe('PageService', () => {
    let pageService;
    let mockPageRepository;
    let mockFeedRepository;
    let mockEventBus;
    const mockPage = {
        id: 1,
        user_id: 'user-123',
        propietario: true,
        usuario: 'testuser',
        oculto: false,
        creado_en: new Date()
    };
    const mockPageWithImages = {
        ...mockPage,
        imagenes: []
    };
    beforeEach(() => {
        // Crear mocks
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
            guardarComentario: jest.fn(),
            findWithImages: jest.fn(),
            findByUsername: jest.fn(),
            findPublic: jest.fn(),
            addImage: jest.fn(),
            removeImage: jest.fn(),
            exists: jest.fn(),
            getOwner: jest.fn(),
            toggleVisibility: jest.fn(),
            getStats: jest.fn()
        };
        mockFeedRepository = {
            findAll: jest.fn(),
            findByUser: jest.fn(),
            findById: jest.fn(),
            createForUser: jest.fn(),
            createForPage: jest.fn(),
            updateForPage: jest.fn(),
            deleteByPage: jest.fn(),
            deleteByUser: jest.fn(),
            search: jest.fn(),
            getStats: jest.fn(),
            syncWithPages: jest.fn(),
            cleanOrphaned: jest.fn(),
            findFollowing: jest.fn()
        };
        mockEventBus = {
            emit: jest.fn(),
            on: jest.fn(),
            off: jest.fn(),
            removeAllListeners: jest.fn()
        };
        pageService = new PageService_1.PageService(mockPageRepository, mockFeedRepository, mockEventBus);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('getPageWithImages', () => {
        it('should return page with images from cache if available', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(mockPageWithImages);
            // Act
            const result = await pageService.getPageWithImages(1);
            // Assert
            expect(cacheGetSpy).toHaveBeenCalledWith('page:withImages:1');
            expect(mockPageRepository.findWithImages).not.toHaveBeenCalled();
            expect(result).toEqual(mockPageWithImages);
            cacheGetSpy.mockRestore();
        });
        it('should fetch page with images from repository and cache it', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
            const cacheSetSpy = jest.spyOn(cacheService, 'set');
            mockPageRepository.findWithImages.mockResolvedValue(mockPageWithImages);
            // Act
            const result = await pageService.getPageWithImages(1);
            // Assert
            expect(mockPageRepository.findWithImages).toHaveBeenCalledWith(1);
            expect(cacheSetSpy).toHaveBeenCalledWith('page:withImages:1', mockPageWithImages);
            expect(result).toEqual(mockPageWithImages);
            cacheGetSpy.mockRestore();
            cacheSetSpy.mockRestore();
        });
    });
    describe('getPageByUsername', () => {
        it('should return page by username from cache if available', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(mockPage);
            // Act
            const result = await pageService.getPageByUsername('testuser');
            // Assert
            expect(cacheGetSpy).toHaveBeenCalledWith('page:byUsername:testuser');
            expect(mockPageRepository.findByUsername).not.toHaveBeenCalled();
            expect(result).toEqual(mockPage);
            cacheGetSpy.mockRestore();
        });
        it('should fetch page by username from repository and cache it', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
            const cacheSetSpy = jest.spyOn(cacheService, 'set');
            mockPageRepository.findByUsername.mockResolvedValue(mockPage);
            // Act
            const result = await pageService.getPageByUsername('testuser');
            // Assert
            expect(mockPageRepository.findByUsername).toHaveBeenCalledWith('testuser');
            expect(cacheSetSpy).toHaveBeenCalledWith('page:byUsername:testuser', mockPage);
            expect(result).toEqual(mockPage);
            cacheGetSpy.mockRestore();
            cacheSetSpy.mockRestore();
        });
    });
    describe('getPublicPages', () => {
        it('should return public pages from cache if available', async () => {
            // Arrange
            const pages = [mockPage];
            const cacheService = require('../src/services/CacheService').cacheService;
            const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(pages);
            // Act
            const result = await pageService.getPublicPages(20, 0);
            // Assert
            expect(cacheGetSpy).toHaveBeenCalledWith('page:public:20:0');
            expect(mockPageRepository.findPublic).not.toHaveBeenCalled();
            expect(result).toEqual(pages);
            cacheGetSpy.mockRestore();
        });
        it('should fetch public pages from repository and cache them', async () => {
            // Arrange
            const pages = [mockPage];
            const cacheService = require('../src/services/CacheService').cacheService;
            const cacheGetSpy = jest.spyOn(cacheService, 'get').mockReturnValue(null);
            const cacheSetSpy = jest.spyOn(cacheService, 'set');
            mockPageRepository.findPublic.mockResolvedValue(pages);
            // Act
            const result = await pageService.getPublicPages(20, 0);
            // Assert
            expect(mockPageRepository.findPublic).toHaveBeenCalledWith(20, 0);
            expect(cacheSetSpy).toHaveBeenCalledWith('page:public:20:0', pages);
            expect(result).toEqual(pages);
            cacheGetSpy.mockRestore();
            cacheSetSpy.mockRestore();
        });
    });
    describe('createPage', () => {
        const createData = {
            usuario: 'newuser'
        };
        it('should create page successfully', async () => {
            // Arrange
            mockPageRepository.create.mockResolvedValue(1);
            mockFeedRepository.createForUser.mockResolvedValue(1);
            mockEventBus.emit.mockResolvedValue();
            // Act
            const result = await pageService.createPage('user-123', createData);
            // Assert
            expect(mockPageRepository.create).toHaveBeenCalledWith('user-123', createData);
            expect(mockFeedRepository.createForUser).toHaveBeenCalledWith('user-123', 'newuser');
            expect(mockEventBus.emit).toHaveBeenCalledWith('page.created', {
                pageId: 1,
                userId: 'user-123',
                username: 'newuser'
            });
            expect(result).toBe(1);
        });
        it('should handle event bus errors gracefully', async () => {
            // Arrange
            mockPageRepository.create.mockResolvedValue(1);
            mockFeedRepository.createForPage.mockResolvedValue(1);
            mockEventBus.emit.mockRejectedValue(new Error('Event bus error'));
            // Act
            const result = await pageService.createPage('user-123', createData);
            // Assert
            expect(result).toBe(1);
        });
    });
    describe('updatePage', () => {
        it('should update page and invalidate cache', async () => {
            // Arrange
            const updateData = { titulo: 'Updated Title' };
            const cacheService = require('../src/services/CacheService').cacheService;
            const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
            mockPageRepository.update.mockResolvedValue();
            // Act
            await pageService.updatePage(1, updateData);
            // Assert
            expect(mockPageRepository.update).toHaveBeenCalledWith(1, updateData);
            expect(invalidateSpy).toHaveBeenCalledWith('page:withImages:1');
            expect(invalidateSpy).toHaveBeenCalledWith('page:byUsername:');
            invalidateSpy.mockRestore();
        });
        // Test eliminado: las páginas ya no tienen contenido propio para actualizar en el feed
    });
    describe('deletePage', () => {
        it('should delete page and invalidate cache', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
            mockPageRepository.delete.mockResolvedValue();
            mockFeedRepository.deleteByPage.mockResolvedValue();
            // Act
            await pageService.deletePage(1);
            // Assert
            expect(mockPageRepository.delete).toHaveBeenCalled();
            expect(mockFeedRepository.deleteByPage).toHaveBeenCalledWith(1);
            expect(invalidateSpy).toHaveBeenCalledWith('page:withImages:1');
            expect(invalidateSpy).toHaveBeenCalledWith('page:byUsername:');
            expect(invalidateSpy).toHaveBeenCalledWith('page:public:');
            invalidateSpy.mockRestore();
        });
    });
    describe('addImageToPage', () => {
        it('should add image to page', async () => {
            // Arrange
            const imageBuffer = Buffer.from('fake-image');
            const cacheService = require('../src/services/CacheService').cacheService;
            const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
            mockPageRepository.addImage.mockResolvedValue(1);
            // Act
            const result = await pageService.addImageToPage(1, imageBuffer, 'image/jpeg');
            // Assert
            expect(mockPageRepository.addImage).toHaveBeenCalledWith(1, imageBuffer, 'image/jpeg');
            expect(invalidateSpy).toHaveBeenCalledWith('page:withImages:1');
            expect(result).toBe(1);
            invalidateSpy.mockRestore();
        });
    });
    describe('removeImage', () => {
        it('should remove image', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
            mockPageRepository.removeImage.mockResolvedValue();
            // Act
            await pageService.removeImage(1, 1);
            // Assert
            expect(mockPageRepository.removeImage).toHaveBeenCalledWith(1, 1);
            expect(invalidateSpy).toHaveBeenCalledWith('page:withImages:1');
            invalidateSpy.mockRestore();
        });
    });
    describe('pageExists', () => {
        it('should check if page exists', async () => {
            // Arrange
            mockPageRepository.exists.mockResolvedValue(true);
            // Act
            const result = await pageService.pageExists(1);
            // Assert
            expect(mockPageRepository.exists).toHaveBeenCalledWith(1);
            expect(result).toBe(true);
        });
    });
    describe('getPageOwner', () => {
        it('should get page owner', async () => {
            // Arrange
            mockPageRepository.getOwner.mockResolvedValue('user-123');
            // Act
            const result = await pageService.getPageOwner(1);
            // Assert
            expect(mockPageRepository.getOwner).toHaveBeenCalledWith(1);
            expect(result).toBe('user-123');
        });
    });
    describe('togglePageVisibility', () => {
        it('should toggle page visibility and invalidate cache', async () => {
            // Arrange
            const cacheService = require('../src/services/CacheService').cacheService;
            const invalidateSpy = jest.spyOn(cacheService, 'invalidatePattern');
            mockPageRepository.toggleVisibility.mockResolvedValue('visible');
            // Act
            const result = await pageService.togglePageVisibility(1);
            // Assert
            expect(mockPageRepository.toggleVisibility).toHaveBeenCalledWith(1);
            expect(invalidateSpy).toHaveBeenCalledWith('page:withImages:1');
            expect(invalidateSpy).toHaveBeenCalledWith('page:public:');
            expect(result).toBe('visible');
            invalidateSpy.mockRestore();
        });
    });
    describe('getPageStats', () => {
        it('should get page stats', async () => {
            // Arrange
            const stats = { comentarios: 5, imagenes: 3, visitas: 100 };
            mockPageRepository.getStats.mockResolvedValue(stats);
            // Act
            const result = await pageService.getPageStats(1);
            // Assert
            expect(mockPageRepository.getStats).toHaveBeenCalledWith(1);
            expect(result).toEqual(stats);
        });
    });
});
//# sourceMappingURL=page-service.test.js.map