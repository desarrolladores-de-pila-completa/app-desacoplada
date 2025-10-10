import { Result } from '../value-objects';
import { Email, Password, Username, PageTitle, PageContent, CommentText } from '../value-objects';
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
export declare function validateRegister(body: any): Result<RegisterDTO, ValidationError[]>;
export declare function validateLogin(body: any): Result<LoginDTO, ValidationError[]>;
export declare function validateCreatePage(body: any): Result<CreatePageDTO, ValidationError[]>;
export declare function validateUpdatePage(body: any): Result<UpdatePageDTO, ValidationError[]>;
export declare function validateCreateComment(body: any, params: any): Result<CreateCommentDTO, ValidationError[]>;
export declare function validateUpdateUsername(body: any): Result<UpdateUsernameDTO, ValidationError[]>;
export declare const validateRequest: (validator: (body: any, params?: any) => Result<any, ValidationError[]>) => (req: any, res: any, next: any) => any;
//# sourceMappingURL=schemas.d.ts.map