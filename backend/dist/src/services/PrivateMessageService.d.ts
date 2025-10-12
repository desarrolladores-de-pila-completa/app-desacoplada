import { IPrivateMessageRepository, PrivateMessage } from '../repositories/IPrivateMessageRepository';
export declare class PrivateMessageService {
    private privateMessageRepository;
    constructor(privateMessageRepository: IPrivateMessageRepository);
    getPrivateMessages(userId1: string, userId2: string, limit?: number, offset?: number): Promise<PrivateMessage[]>;
    createPrivateMessage(senderId: string, receiverId: string, message: string): Promise<number>;
    deleteUserMessages(userId: string): Promise<void>;
}
//# sourceMappingURL=PrivateMessageService.d.ts.map