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
    titulo: string;
    contenido: string;
    descripcion: string;
    usuario: string;
    comentarios: string;
    oculto: boolean;
    visible_titulo: boolean;
    visible_contenido: boolean;
    visible_descripcion: boolean;
    visible_usuario: boolean;
    visible_comentarios: boolean;
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
    titulo: string;
    contenido: string;
    descripcion?: string;
    usuario: string;
    comentarios?: string;
}
export interface UpdatePaginaData {
    titulo?: string;
    contenido?: string;
    descripcion?: string;
    comentarios?: string;
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
//# sourceMappingURL=interfaces.d.ts.map