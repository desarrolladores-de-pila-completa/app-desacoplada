export interface IChatRepository {
    findAll(limit: number, offset: number): Promise<ChatMessage[]>;
    create(userId: string, message: string): Promise<number>;
    deleteByUser(userId: string): Promise<void>;
}
export interface ChatMessage {
    id: number;
    user_id: string;
    message: string;
    created_at: string;
    username: string;
    display_name?: string;
    foto_perfil_url?: string | null;
}
//# sourceMappingURL=IChatRepository.d.ts.map