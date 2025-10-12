import { IPrivateMessageRepository, PrivateMessage } from './IPrivateMessageRepository';
export declare class PrivateMessageRepository implements IPrivateMessageRepository {
    findBetweenUsers(userId1: string, userId2: string, limit?: number, offset?: number): Promise<PrivateMessage[]>;
    create(senderId: string, receiverId: string, message: string): Promise<number>;
    deleteByUser(userId: string): Promise<void>;
}
//# sourceMappingURL=PrivateMessageRepository.d.ts.map