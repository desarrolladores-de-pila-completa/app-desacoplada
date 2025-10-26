"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateMessageService = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const CacheService_1 = require("./CacheService");
class PrivateMessageService {
    privateMessageRepository;
    constructor(privateMessageRepository) {
        this.privateMessageRepository = privateMessageRepository;
    }
    /**
     * Obtiene los mensajes privados entre dos usuarios.
     */
    async getPrivateMessages(userId1, userId2, limit = 50, offset = 0) {
        logger_1.default.info('PrivateMessageService.getPrivateMessages', { userId1, userId2, limit, offset });
        const cacheKey = `private:${userId1}:${userId2}:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const messages = await this.privateMessageRepository.findBetweenUsers(userId1, userId2, limit, offset);
        CacheService_1.cacheService.set(cacheKey, messages, 30000);
        return messages;
    }
    /**
     * Crea un mensaje privado entre dos usuarios.
     */
    async createPrivateMessage(senderId, receiverId, message) {
        logger_1.default.info('PrivateMessageService.createPrivateMessage', { senderId, receiverId });
        if (!message || message.trim().length === 0) {
            logger_1.default.warn('El mensaje no puede estar vacío', { senderId, receiverId });
            throw new Error('El mensaje no puede estar vacío');
        }
        const trimmedMessage = message.trim();
        const messageId = await this.privateMessageRepository.create(senderId, receiverId, trimmedMessage);
        CacheService_1.cacheService.invalidatePattern(`private:${senderId}:${receiverId}:`);
        CacheService_1.cacheService.invalidatePattern(`private:${receiverId}:${senderId}:`);
        return messageId;
    }
    /**
     * Elimina todos los mensajes privados de un usuario.
     */
    async deleteUserMessages(userId) {
        logger_1.default.info('PrivateMessageService.deleteUserMessages', { userId });
        await this.privateMessageRepository.deleteByUser(userId);
        CacheService_1.cacheService.invalidatePattern(`private:*`);
    }
}
exports.PrivateMessageService = PrivateMessageService;
//# sourceMappingURL=PrivateMessageService.js.map