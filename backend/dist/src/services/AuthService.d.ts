import { UserService } from './UserService';
import { User, UserCreateData, IEventBus, AuthResponse } from '../types/interfaces';
export declare class AuthService {
    private userService;
    private eventBus;
    constructor(userService: UserService, eventBus: IEventBus);
    /**
      * Registrar un nuevo usuario
      */
    register(userData: Omit<UserCreateData, 'username'>): Promise<AuthResponse>;
    /**
     * Generar username único
     */
    private generateUniqueUsername;
    /**
      * Autenticar usuario para Passport
      */
    login(email: string, password: string): Promise<User>;
    /**
      * Generar tokens JWT (access y refresh)
      */
    generateTokens(userId: string): {
        accessToken: string;
        refreshToken: string;
    };
    /**
     * @deprecated Usar generateTokens en su lugar
     */
    private generateToken;
    /**
      * Verificar token JWT
      */
    verifyToken(token: string): {
        userId: string;
    };
    /**
     * Refrescar tokens usando refresh token con rotación automática
     */
    refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
      * Generar tokens JWT con rotación de refresh token
      */
    private generateTokensWithRotation;
    /**
     * Verificar si un token está próximo a expirar (menos de 5 minutos)
     */
    isTokenNearExpiry(token: string): boolean;
    /**
     * Obtener información del token sin verificar (para debugging)
     */
    getTokenInfo(token: string): any;
    /**
     * Invalidar sesión de usuario (logout forzado)
     */
    invalidateUserSession(userId: string): Promise<void>;
    /**
     * Obtener sesiones activas del usuario (para futuras mejoras)
     */
    getUserSessions(userId: string): Promise<any[]>;
    /**
     * Verificar si el usuario tiene sesiones múltiples sospechosas
     */
    checkSuspiciousActivity(userId: string): Promise<boolean>;
    /**
     * Extender sesión automáticamente (sliding sessions)
     * Se llama cuando hay actividad del usuario para extender la sesión
     */
    extendSession(userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
        extended: boolean;
    }>;
    /**
     * Verificar si la sesión debe extenderse automáticamente
     * Se basa en la actividad reciente del usuario
     */
    shouldExtendSession(lastActivity: Date): boolean;
    /**
     * Actualizar timestamp de última actividad del usuario
     */
    updateLastActivity(userId: string): Promise<void>;
}
//# sourceMappingURL=AuthService.d.ts.map