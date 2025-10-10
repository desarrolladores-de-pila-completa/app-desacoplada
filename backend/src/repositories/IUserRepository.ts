import { User, UserCreateData } from '../types/interfaces';

export interface IUserRepository {
  create(userData: UserCreateData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findWithPassword(email: string): Promise<(User & { password: string }) | null>;
  updateProfilePhoto(userId: string, photoBuffer: Buffer): Promise<void>;
  updateUsername(userId: string, newUsername: string): Promise<void>;
  delete(userId: string): Promise<void>;
  isPageOwner(userId: string, pageId: number): Promise<boolean>;
}