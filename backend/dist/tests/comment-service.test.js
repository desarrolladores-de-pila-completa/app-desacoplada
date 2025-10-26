"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CommentService_1 = require("../src/services/CommentService");
describe('CommentService', () => {
    let commentService;
    let mockCommentRepository;
    const mockComment = {
        id: 1,
        pagina_id: 1,
        user_id: 'user-123',
        comentario: 'Test comment',
        creado_en: new Date(),
        username: 'testuser'
    };
    beforeEach(() => {
        // Crear mock
        mockCommentRepository = {
            create: jest.fn(),
            findByPage: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findByUser: jest.fn(),
            countByPage: jest.fn(),
            deleteAllByPage: jest.fn(),
            isOwner: jest.fn(),
            canDelete: jest.fn(),
            findRecent: jest.fn(),
            search: jest.fn()
        };
        commentService = new CommentService_1.CommentService(mockCommentRepository);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('createComment', () => {
        it('should create a new comment', async () => {
            // Arrange
            mockCommentRepository.create.mockResolvedValue(1);
            // Act
            const result = await commentService.createComment('user-123', 1, 'Test comment');
            // Assert
            expect(mockCommentRepository.create).toHaveBeenCalledWith({
                pagina_id: 1,
                user_id: 'user-123',
                comentario: 'Test comment'
            });
            expect(result).toBe(1);
        });
    });
    describe('getPageComments', () => {
        it('should get comments for a page', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.findByPage.mockResolvedValue(comments);
            // Act
            const result = await commentService.getPageComments(1, 50, 0);
            // Assert
            expect(mockCommentRepository.findByPage).toHaveBeenCalledWith(1, 50, 0);
            expect(result).toEqual(comments);
        });
        it('should use default parameters', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.findByPage.mockResolvedValue(comments);
            // Act
            const result = await commentService.getPageComments(1);
            // Assert
            expect(mockCommentRepository.findByPage).toHaveBeenCalledWith(1, 50, 0);
            expect(result).toEqual(comments);
        });
    });
    describe('getCommentById', () => {
        it('should get comment by id', async () => {
            // Arrange
            mockCommentRepository.findById.mockResolvedValue(mockComment);
            // Act
            const result = await commentService.getCommentById(1);
            // Assert
            expect(mockCommentRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockComment);
        });
        it('should return null if comment not found', async () => {
            // Arrange
            mockCommentRepository.findById.mockResolvedValue(null);
            // Act
            const result = await commentService.getCommentById(1);
            // Assert
            expect(mockCommentRepository.findById).toHaveBeenCalledWith(1);
            expect(result).toBeNull();
        });
    });
    describe('updateComment', () => {
        it('should update comment', async () => {
            // Arrange
            mockCommentRepository.update.mockResolvedValue();
            // Act
            await commentService.updateComment(1, 'user-123', 'Updated comment');
            // Assert
            expect(mockCommentRepository.update).toHaveBeenCalledWith(1, 'user-123', 'Updated comment');
        });
    });
    describe('deleteComment', () => {
        it('should delete comment', async () => {
            // Arrange
            mockCommentRepository.delete.mockResolvedValue();
            // Act
            await commentService.deleteComment(1, 'user-123');
            // Assert
            expect(mockCommentRepository.delete).toHaveBeenCalledWith(1, 'user-123');
        });
    });
    describe('getUserComments', () => {
        it('should get comments by user', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.findByUser.mockResolvedValue(comments);
            // Act
            const result = await commentService.getUserComments('user-123', 20, 0);
            // Assert
            expect(mockCommentRepository.findByUser).toHaveBeenCalledWith('user-123', 20, 0);
            expect(result).toEqual(comments);
        });
        it('should use default parameters', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.findByUser.mockResolvedValue(comments);
            // Act
            const result = await commentService.getUserComments('user-123');
            // Assert
            expect(mockCommentRepository.findByUser).toHaveBeenCalledWith('user-123', 20, 0);
            expect(result).toEqual(comments);
        });
    });
    describe('countPageComments', () => {
        it('should count comments for a page', async () => {
            // Arrange
            mockCommentRepository.countByPage.mockResolvedValue(5);
            // Act
            const result = await commentService.countPageComments(1);
            // Assert
            expect(mockCommentRepository.countByPage).toHaveBeenCalledWith(1);
            expect(result).toBe(5);
        });
    });
    describe('deleteAllPageComments', () => {
        it('should delete all comments for a page', async () => {
            // Arrange
            mockCommentRepository.deleteAllByPage.mockResolvedValue();
            // Act
            await commentService.deleteAllPageComments(1);
            // Assert
            expect(mockCommentRepository.deleteAllByPage).toHaveBeenCalledWith(1);
        });
    });
    describe('isCommentOwner', () => {
        it('should check if user is comment owner', async () => {
            // Arrange
            mockCommentRepository.isOwner.mockResolvedValue(true);
            // Act
            const result = await commentService.isCommentOwner(1, 'user-123');
            // Assert
            expect(mockCommentRepository.isOwner).toHaveBeenCalledWith(1, 'user-123');
            expect(result).toBe(true);
        });
    });
    describe('canDeleteComment', () => {
        it('should check if user can delete comment', async () => {
            // Arrange
            mockCommentRepository.canDelete.mockResolvedValue(true);
            // Act
            const result = await commentService.canDeleteComment(1, 'user-123');
            // Assert
            expect(mockCommentRepository.canDelete).toHaveBeenCalledWith(1, 'user-123');
            expect(result).toBe(true);
        });
    });
    describe('getRecentComments', () => {
        it('should get recent comments', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.findRecent.mockResolvedValue(comments);
            // Act
            const result = await commentService.getRecentComments(10);
            // Assert
            expect(mockCommentRepository.findRecent).toHaveBeenCalledWith(10);
            expect(result).toEqual(comments);
        });
        it('should use default limit', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.findRecent.mockResolvedValue(comments);
            // Act
            const result = await commentService.getRecentComments();
            // Assert
            expect(mockCommentRepository.findRecent).toHaveBeenCalledWith(10);
            expect(result).toEqual(comments);
        });
    });
    describe('searchComments', () => {
        it('should search comments', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.search.mockResolvedValue(comments);
            // Act
            const result = await commentService.searchComments('test', 20, 0);
            // Assert
            expect(mockCommentRepository.search).toHaveBeenCalledWith('test', 20, 0);
            expect(result).toEqual(comments);
        });
        it('should use default parameters', async () => {
            // Arrange
            const comments = [mockComment];
            mockCommentRepository.search.mockResolvedValue(comments);
            // Act
            const result = await commentService.searchComments('test');
            // Assert
            expect(mockCommentRepository.search).toHaveBeenCalledWith('test', 20, 0);
            expect(result).toEqual(comments);
        });
    });
});
//# sourceMappingURL=comment-service.test.js.map