import { IPrivateMessageRepository, PrivateMessage } from './IPrivateMessageRepository';
export declare class PrivateMessageRepository implements IPrivateMessageRepository {
    /**
     * Busca mensajes privados entre dos usuarios con paginación.
     * @param userId1 ID del usuario 1
     * @param userId2 ID del usuario 2
     * @param limit Límite de resultados
     * @param offset Offset de paginación
     * @returns Array de mensajes privados
     */
    findBetweenUsers(userId1: string, userId2: string, limit?: number, offset?: number): Promise<PrivateMessage[]>;
    /**
     * Crea un nuevo mensaje privado.
     * @param senderId ID del remitente
     * @param receiverId ID del destinatario
     * @param message Mensaje
     * @returns ID del nuevo mensaje
     */
    create(senderId: string, receiverId: string, message: string): Promise<number>;
    /**
     * Elimina todos los mensajes privados de un usuario (como remitente o destinatario).
     * @param userId ID del usuario
     */
    deleteByUser(userId: string): Promise<void>;
}
//# sourceMappingURL=PrivateMessageRepository.d.ts.map