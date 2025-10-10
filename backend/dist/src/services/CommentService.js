"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentService = void 0;
const sanitize_html_1 = __importDefault(require("sanitize-html"));
class CommentService {
    commentRepository;
    constructor(commentRepository) {
        this.commentRepository = commentRepository;
    }
    sanitizeComment(text) {
        // Allow only img tags for images, strip other HTML
        return (0, sanitize_html_1.default)(text, {
            allowedTags: ['img'],
            allowedAttributes: {
                'img': ['src', 'alt']
            },
            allowedSchemes: ['http', 'https']
        }).trim();
    }
    /**
     * Crear un nuevo comentario
     */
    async createComment(userId, pageId, comentario) {
        const sanitizedComment = this.sanitizeComment(comentario);
        return await this.commentRepository.create({ pagina_id: pageId, user_id: userId, comentario: sanitizedComment });
    }
    /**
     * Obtener comentarios de una página con información de usuario
     */
    async getPageComments(pageId, limit = 50, offset = 0) {
        return await this.commentRepository.findByPage(pageId, limit, offset);
    }
    /**
     * Obtener comentario por ID
     */
    async getCommentById(commentId) {
        return await this.commentRepository.findById(commentId);
    }
    /**
     * Actualizar comentario (solo el propietario)
     */
    async updateComment(commentId, userId, nuevoComentario) {
        const sanitizedComment = this.sanitizeComment(nuevoComentario);
        await this.commentRepository.update(commentId, userId, sanitizedComment);
    }
    /**
     * Eliminar comentario
     */
    async deleteComment(commentId, userId) {
        await this.commentRepository.delete(commentId, userId);
    }
    /**
     * Obtener comentarios de un usuario
     */
    async getUserComments(userId, limit = 20, offset = 0) {
        return await this.commentRepository.findByUser(userId, limit, offset);
    }
    /**
     * Contar comentarios de una página
     */
    async countPageComments(pageId) {
        return await this.commentRepository.countByPage(pageId);
    }
    /**
     * Eliminar todos los comentarios de una página
     */
    async deleteAllPageComments(pageId) {
        await this.commentRepository.deleteAllByPage(pageId);
    }
    /**
     * Verificar si un usuario es propietario de un comentario
     */
    async isCommentOwner(commentId, userId) {
        return await this.commentRepository.isOwner(commentId, userId);
    }
    /**
     * Verificar si un usuario puede eliminar un comentario
     * (propietario del comentario o propietario de la página)
     */
    async canDeleteComment(commentId, userId) {
        return await this.commentRepository.canDelete(commentId, userId);
    }
    /**
     * Obtener comentarios recientes del sistema
     */
    async getRecentComments(limit = 10) {
        return await this.commentRepository.findRecent(limit);
    }
    /**
     * Buscar comentarios por texto
     */
    async searchComments(searchTerm, limit = 20, offset = 0) {
        return await this.commentRepository.search(searchTerm, limit, offset);
    }
}
exports.CommentService = CommentService;
//# sourceMappingURL=CommentService.js.map