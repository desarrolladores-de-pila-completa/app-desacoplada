import { IPrivateMessageRepository, PrivateMessage } from '../repositories/IPrivateMessageRepository';
import winston from '../utils/logger';
import { cacheService } from './CacheService';

export class PrivateMessageService {
  constructor(private privateMessageRepository: IPrivateMessageRepository) {}

  /**
   * Obtiene los mensajes privados entre dos usuarios.
   */
  async getPrivateMessages(userId1: string, userId2: string, limit: number = 50, offset: number = 0): Promise<PrivateMessage[]> {
    winston.info('PrivateMessageService.getPrivateMessages', { userId1, userId2, limit, offset });
    const cacheKey = `private:${userId1}:${userId2}:${limit}:${offset}`;
    const cached = cacheService.get<PrivateMessage[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.privateMessageRepository.findBetweenUsers(userId1, userId2, limit, offset);
    cacheService.set(cacheKey, messages, 30000);
    return messages;
  }

  /**
   * Crea un mensaje privado entre dos usuarios.
   */
  async createPrivateMessage(senderId: string, receiverId: string, message: string): Promise<number> {
    winston.info('PrivateMessageService.createPrivateMessage', { senderId, receiverId });
    if (!message || message.trim().length === 0) {
      winston.warn('El mensaje no puede estar vacío', { senderId, receiverId });
      throw new Error('El mensaje no puede estar vacío');
    }

    const trimmedMessage = message.trim();
    const messageId = await this.privateMessageRepository.create(senderId, receiverId, trimmedMessage);
    cacheService.invalidatePattern(`private:${senderId}:${receiverId}:`);
    cacheService.invalidatePattern(`private:${receiverId}:${senderId}:`);

    return messageId;
  }

  /**
   * Elimina todos los mensajes privados de un usuario.
   */
  async deleteUserMessages(userId: string): Promise<void> {
    winston.info('PrivateMessageService.deleteUserMessages', { userId });
    await this.privateMessageRepository.deleteByUser(userId);
    cacheService.invalidatePattern(`private:*`);
  }
}