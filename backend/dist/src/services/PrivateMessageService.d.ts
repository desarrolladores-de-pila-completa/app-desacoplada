import { IPrivateMessageRepository, PrivateMessage } from '../repositories/IPrivateMessageRepository';
export declare class PrivateMessageService {
    private privateMessageRepository;
    constructor(privateMessageRepository: IPrivateMessageRepository);
    /**
     * Obtiene los mensajes privados entre dos usuarios.
     */
    getPrivateMessages(userId1: string, userId2: string, limit?: number, offset?: number): Promise<PrivateMessage[]>;
    /**
     * Crea un mensaje privado entre dos usuarios.
     */
    createPrivateMessage(senderId: string, receiverId: string, message: string): Promise<number>;
    /**
     * Elimina todos los mensajes privados de un usuario.
     */
    deleteUserMessages(userId: string): Promise<void>;
}
//# sourceMappingURL=PrivateMessageService.d.ts.map