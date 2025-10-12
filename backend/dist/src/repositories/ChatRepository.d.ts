import { IChatRepository, ChatMessage } from './IChatRepository';
export declare class ChatRepository implements IChatRepository {
    findAll(limit?: number, offset?: number): Promise<ChatMessage[]>;
    create(userId: string | null, message: string, guestUsername?: string): Promise<number>;
    deleteByUser(userId: string): Promise<void>;
}
//# sourceMappingURL=ChatRepository.d.ts.map