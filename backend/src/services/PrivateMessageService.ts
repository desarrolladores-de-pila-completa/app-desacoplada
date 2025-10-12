import { IPrivateMessageRepository, PrivateMessage } from '../repositories/IPrivateMessageRepository';
import { cacheService } from './CacheService';

export class PrivateMessageService {
  constructor(private privateMessageRepository: IPrivateMessageRepository) {}

  async getPrivateMessages(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    const cacheKey = `private:${userId1}:${userId2}:${limit}:${offset}`;
    const cached = cacheService.get<PrivateMessage[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.privateMessageRepository.findBetweenUsers(userId1, userId2, limit, offset);
    cacheService.set(cacheKey, messages, 30000);
    return messages;
  }

  async createPrivateMessage(senderId: string, receiverId: string, message: string): Promise<number> {
    if (!message || message.trim().length === 0) {
      throw new Error('El mensaje no puede estar vacío');
    }

    const trimmedMessage = message.trim();
    const messageId = await this.privateMessageRepository.create(senderId, receiverId, trimmedMessage);
    cacheService.invalidatePattern(`private:${senderId}:${receiverId}:`);
    cacheService.invalidatePattern(`private:${receiverId}:${senderId}:`);

    return messageId;
  }

  async deleteUserMessages(userId: string): Promise<void> {
    await this.privateMessageRepository.deleteByUser(userId);
    cacheService.invalidatePattern(`private:*`);
  }
}