"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateMessageService = void 0;
const CacheService_1 = require("./CacheService");
class PrivateMessageService {
    privateMessageRepository;
    constructor(privateMessageRepository) {
        this.privateMessageRepository = privateMessageRepository;
    }
    async getPrivateMessages(userId1, userId2, limit = 50, offset = 0) {
        const cacheKey = `private:${userId1}:${userId2}:${limit}:${offset}`;
        const cached = CacheService_1.cacheService.get(cacheKey);
        if (cached)
            return cached;
        const messages = await this.privateMessageRepository.findBetweenUsers(userId1, userId2, limit, offset);
        CacheService_1.cacheService.set(cacheKey, messages, 30000);
        return messages;
    }
    async createPrivateMessage(senderId, receiverId, message) {
        if (!message || message.trim().length === 0) {
            throw new Error('El mensaje no puede estar vacío');
        }
        const trimmedMessage = message.trim();
        const messageId = await this.privateMessageRepository.create(senderId, receiverId, trimmedMessage);
        CacheService_1.cacheService.invalidatePattern(`private:${senderId}:${receiverId}:`);
        CacheService_1.cacheService.invalidatePattern(`private:${receiverId}:${senderId}:`);
        return messageId;
    }
    async deleteUserMessages(userId) {
        await this.privateMessageRepository.deleteByUser(userId);
        CacheService_1.cacheService.invalidatePattern(`private:*`);
    }
}
exports.PrivateMessageService = PrivateMessageService;
//# sourceMappingURL=PrivateMessageService.js.map