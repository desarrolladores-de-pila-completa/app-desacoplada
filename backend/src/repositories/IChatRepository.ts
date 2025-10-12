export interface IChatRepository {
  findAll(limit: number, offset: number): Promise<ChatMessage[]>;
  create(userId: string | null, message: string, guestUsername?: string): Promise<number>;
  deleteByUser(userId: string): Promise<void>;
}

export interface ChatMessage {
  id: number;
  user_id: string | null;
  message: string;
  created_at: string;
  username: string;
  display_name?: string;
  foto_perfil_url?: string | null;
}