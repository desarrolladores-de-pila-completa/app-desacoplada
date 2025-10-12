import { IChatRepository, ChatMessage } from '../repositories';
import { cacheService } from './CacheService';

export class ChatService {
  constructor(private chatRepository: IChatRepository) {}

  /**
   * Obtener mensajes de chat global con paginación
   */
  async getGlobalChat(limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    const cacheKey = `chat:global:${limit}:${offset}`;
    const cached = cacheService.get<ChatMessage[]>(cacheKey);
    if (cached) return cached;

    const messages = await this.chatRepository.findAll(limit, offset);
    cacheService.set(cacheKey, messages, 30000); // TTL de 30 segundos
    return messages;
  }

  /**
   * Crear un nuevo mensaje en el chat global
   */
  async createMessage(userId: string, message: string): Promise<number> {
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
    cacheService.invalidatePattern(`chat:global:`);

    return messageId;
  }

  /**
   * Eliminar todos los mensajes de un usuario
   */
  async deleteUserMessages(userId: string): Promise<void> {
    await this.chatRepository.deleteByUser(userId);
    // Invalidar caché
    cacheService.invalidatePattern(`chat:global:`);
  }
}