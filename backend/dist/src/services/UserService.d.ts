import { User, UserCreateData } from '../types/interfaces';
import { IUserRepository, IPageRepository } from '../repositories';
export declare class UserService {
    private userRepository;
    private pageRepository;
    constructor(userRepository: IUserRepository, pageRepository: IPageRepository);
    /**
     * Crear un nuevo usuario con página personal
     */
    createUser(userData: UserCreateData): Promise<User>;
    /**
     * Obtener usuario por ID
     */
    getUserById(userId: string): Promise<User | null>;
    /**
     * Obtener usuario por email
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Obtener usuario por username
     */
    getUserByUsername(username: string): Promise<User | null>;
    /**
     * Obtener usuario con contraseña para login
     */
    getUserWithPassword(email: string): Promise<(User & {
        password: string;
    }) | null>;
    /**
     * Actualizar foto de perfil
     */
    updateProfilePhoto(userId: string, photoBuffer: Buffer): Promise<void>;
    /**
     * Actualizar username
     */
    updateUsername(userId: string, newUsername: string): Promise<void>;
    /**
     * Eliminar usuario completamente (cascada)
     */
    deleteUserCompletely(userId: string): Promise<void>;
    /**
     * Crear página personal para usuario nuevo
     */
    private createUserPage;
    /**
     * Verificar si un usuario es propietario de una página
     */
    isPageOwner(userId: string, pageId: number): Promise<boolean>;
}
//# sourceMappingURL=UserService.d.ts.map