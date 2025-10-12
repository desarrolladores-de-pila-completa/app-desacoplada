export interface IPrivateMessageRepository {
  findBetweenUsers(userId1: string, userId2: string, limit: number, offset: number): Promise<PrivateMessage[]>;
  create(senderId: string, receiverId: string, message: string): Promise<number>;
  deleteByUser(userId: string): Promise<void>;
}

export interface PrivateMessage {
  id: number;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
  sender_username: string;
  receiver_username: string;
}