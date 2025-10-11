import { Readable } from 'stream';
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
    buffer: Buffer;
    stream: Readable;
}
export interface User {
    id: string;
    email: string;
    username: string;
    display_name?: string;
    foto_perfil?: Buffer;
    creado_en: Date;
}
export interface UserCreateData {
    email: string;
    password: string;
    username: string;
    file?: MulterFile;
}
export interface Pagina {
    id: number;
    user_id: string;
    propietario: boolean;
    usuario: string;
    oculto: boolean;
    creado_en: Date;
}
export interface PaginaCreateData {
    user_id: string;
    titulo: string;
    contenido: string;
    descripcion?: string;
    usuario?: string;
}
export interface Comentario {
    id: number;
    pagina_id: number;
    user_id: string | null;
    comentario: string;
    creado_en: Date;
    username?: string;
}
export interface ComentarioCreateData {
    pagina_id: number;
    user_id: string;
    comentario: string;
}
export interface FeedEntry {
    id: number;
    user_id: string;
    pagina_id: number;
    titulo: string;
    contenido: string;
    creado_en: Date;
    actualizado_en?: Date;
    username?: string;
    imagenes?: ImagenData[];
    foto_perfil_url?: string | null;
}
export interface FeedCreateData {
    user_id: string;
    mensaje: string;
    enlace: string;
}
export interface ImagenData {
    id: number;
    pagina_id: number;
    idx: number;
    imagen: Buffer;
    creado_en: Date;
}
import { Request } from 'express';
export interface AuthenticatedRequest extends Request {
    user: User;
    userId: string;
}
export interface LoginRequest extends Request {
    body: {
        email: string;
        password: string;
    };
}
export interface RegisterRequest extends Request {
    body: {
        email: string;
        password: string;
        username: string;
    };
    file?: MulterFile;
}
export interface CreateCommentRequest extends AuthenticatedRequest {
    body: {
        comentario: string;
    };
    params: {
        id: string;
    };
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface LoginResponse {
    user: Omit<User, 'foto_perfil'>;
    message: string;
}
export interface ValidationError {
    field: string;
    message: string;
}
export interface CreatePaginaData {
    usuario: string;
}
export interface UpdatePaginaData {
}
export interface PaginaWithImages extends Pagina {
    imagenes: ImagenData[];
}
export interface UserCreateData {
    email: string;
    password: string;
    username: string;
    file?: MulterFile;
}
export interface DatabaseResult<T = any> {
    insertId?: number;
    affectedRows: number;
    changedRows: number;
}
export type QueryResult<T> = [T[], any];
export type CreateUserDTO = Omit<User, 'id' | 'creado_en' | 'foto_perfil'> & {
    password: string;
};
export type UpdateUserDTO = Partial<Omit<User, 'id' | 'creado_en'>>;
export type CreatePaginaDTO = Omit<Pagina, 'id' | 'creado_en'>;
export type UpdatePaginaDTO = Partial<Omit<Pagina, 'id' | 'user_id' | 'creado_en'>>;
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(statusCode: number, message: string, isOperational?: boolean);
}
export interface ErrorResponse {
    status: 'error';
    message: string;
    stack?: string;
}
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: ValidationError[];
}
export type EventName = 'user.registered' | 'page.created' | 'comment.created' | 'page.updated' | 'page.deleted';
export interface EventPayload {
    [key: string]: any;
}
export interface UserRegisteredEvent extends EventPayload {
    userId: string;
    username: string;
    email: string;
}
export interface PageCreatedEvent extends EventPayload {
    pageId: number;
    userId: string;
    username: string;
}
export interface CommentCreatedEvent extends EventPayload {
    commentId: number;
    pageId: number;
    userId: string;
    content: string;
}
export interface PageUpdatedEvent extends EventPayload {
    pageId: number;
    userId: string;
    changes: UpdatePaginaData;
}
export interface PageDeletedEvent extends EventPayload {
    pageId: number;
    userId: string;
}
export type EventDataMap = {
    'user.registered': UserRegisteredEvent;
    'page.created': PageCreatedEvent;
    'comment.created': CommentCreatedEvent;
    'page.updated': PageUpdatedEvent;
    'page.deleted': PageDeletedEvent;
};
export type EventListener<T extends EventName> = (payload: EventDataMap[T]) => void | Promise<void>;
export interface IEventBus {
    emit<T extends EventName>(event: T, payload: EventDataMap[T]): Promise<void>;
    on<T extends EventName>(event: T, listener: EventListener<T>): void;
    off<T extends EventName>(event: T, listener: EventListener<T>): void;
    removeAllListeners(event?: EventName): void;
}
//# sourceMappingURL=interfaces.d.ts.map