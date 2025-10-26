import { User, UserCreateData } from '../types/interfaces';
import { IUserRepository } from './IUserRepository';
export declare class UserRepository implements IUserRepository {
    /**
     * Crea un nuevo usuario en la base de datos.
     */
    create(userData: UserCreateData): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findWithPassword(email: string): Promise<(User & {
        password: string;
    }) | null>;
    findAll(): Promise<User[]>;
    updateProfilePhoto(userId: string, photoBuffer: Buffer): Promise<void>;
    updateUsername(userId: string, newUsername: string): Promise<void>;
    delete(userId: string): Promise<void>;
    isPageOwner(userId: string, pageId: number): Promise<boolean>;
}
//# sourceMappingURL=UserRepository.d.ts.map