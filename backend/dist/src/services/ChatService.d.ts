import { IChatRepository, ChatMessage } from '../repositories';
export declare class ChatService {
    private chatRepository;
    constructor(chatRepository: IChatRepository);
    /**
     * Obtener mensajes de chat global con paginación
     */
    getGlobalChat(limit?: number, offset?: number): Promise<ChatMessage[]>;
    /**
     * Crear un nuevo mensaje en el chat global (soporta invitados)
     */
    createMessage(userId: string | null, message: string, guestUsername?: string): Promise<number>;
    /**
     * Eliminar todos los mensajes de un usuario
     */
    deleteUserMessages(userId: string): Promise<void>;
}
//# sourceMappingURL=ChatService.d.ts.map