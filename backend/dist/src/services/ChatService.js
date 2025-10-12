"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const CacheService_1 = require("./CacheService");
class ChatService {
    chatRepository;
    constructor(chatRepository) {
        this.chatRepository = chatRepository;
    }
    /**
     * Obtener mensajes de chat global con paginación
     */
    async getGlobalChat(limit = 50, offset = 0) {
        const cacheKey = `chat:global:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const messages = await this.chatRepository.findAll(limit, offset);
        CacheService_1.cacheService.set(cacheKey, messages, 30000); // TTL de 30 segundos
        return messages;
    }
    /**
     * Crear un nuevo mensaje en el chat global
     */
    async createMessage(userId, message) {
        console.log('ChatService.createMessage:', { userId, message });
        // Validar mensaje (longitud, etc.)
        if (!message || message.trim().length === 0) {
            throw new Error('El mensaje no puede estar vacío');
        }
        const trimmedMessage = message.trim();
        console.log('Llamando a repository.create:', { userId, trimmedMessage });
        const messageId = await this.chatRepository.create(userId, trimmedMessage);
        console.log('Repository.create retornó:', messageId);
        // Invalidar caché
        CacheService_1.cacheService.invalidatePattern(`chat:global:`);
        return messageId;
    }
    /**
     * Eliminar todos los mensajes de un usuario
     */
    async deleteUserMessages(userId) {
        await this.chatRepository.deleteByUser(userId);
        // Invalidar caché
        CacheService_1.cacheService.invalidatePattern(`chat:global:`);
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=ChatService.js.map