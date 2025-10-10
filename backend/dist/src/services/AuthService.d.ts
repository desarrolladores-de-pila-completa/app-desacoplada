import { UserService } from './UserService';
import { FeedService } from './FeedService';
import { User, UserCreateData, IEventBus } from '../types/interfaces';
export declare class AuthService {
    private userService;
    private feedService;
    private eventBus;
    constructor(userService: UserService, feedService: FeedService, eventBus: IEventBus);
    /**
     * Registrar un nuevo usuario
     */
    register(userData: Omit<UserCreateData, 'username'>): Promise<{
        user: User;
        token: string;
        username: string;
    }>;
    /**
     * Generar username único
     */
    private generateUniqueUsername;
    /**
     * Autenticar usuario
     */
    login(email: string, password: string): Promise<{
        user: User;
        token: string;
    }>;
    /**
     * Generar token JWT
     */
    private generateToken;
    /**
     * Verificar token JWT
     */
    verifyToken(token: string): {
        userId: string;
    };
}
//# sourceMappingURL=AuthService.d.ts.map