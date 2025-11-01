import { Result } from '../value-objects';
import { Email, Password, Username, PageTitle, PageContent, CommentText, PublicacionTitle, PublicacionContent } from '../value-objects';
export interface ValidationError {
    field: string;
    message: string;
}
export interface RegisterDTO {
    email: Email;
    password: Password;
}
export interface LoginDTO {
    email: Email;
    password: Password;
}
export interface CreatePageDTO {
    titulo: PageTitle;
    contenido: PageContent;
    descripcion?: string;
}
export interface UpdatePageDTO {
    titulo?: PageTitle;
    contenido?: PageContent;
    descripcion?: string;
}
export interface CreateCommentDTO {
    comentario: CommentText;
    pageId: number;
}
export interface UpdateUsernameDTO {
    username: Username;
}
export interface CreatePublicacionDTO {
    titulo: PublicacionTitle;
    contenido: PublicacionContent;
}
export declare class ValidationService {
    static validateRegister(body: any): Result<RegisterDTO, ValidationError[]>;
    static validateLogin(body: any): Result<LoginDTO, ValidationError[]>;
    static validateCreatePage(body: any): Result<CreatePageDTO, ValidationError[]>;
    static validateUpdatePage(body: any): Result<UpdatePageDTO, ValidationError[]>;
    static validateCreateComment(body: any, params: any): Result<CreateCommentDTO, ValidationError[]>;
    static validateUpdateUsername(body: any): Result<UpdateUsernameDTO, ValidationError[]>;
    static validateCreatePublicacion(body: any): Result<CreatePublicacionDTO, ValidationError[]>;
}
export declare const validateRequest: (validator: (body: any, params?: any) => Result<any, ValidationError[]>) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=ValidationService.d.ts.map