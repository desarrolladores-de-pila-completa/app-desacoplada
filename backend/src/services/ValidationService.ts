import { Result, ok, err, isOk, isErr } from '../value-objects';
import { Email, Password, Username, PageTitle, PageContent, CommentText, PublicacionTitle, PublicacionContent } from '../value-objects';

// Tipos para errores de validación
export interface ValidationError {
  field: string;
  message: string;
}

// DTOs validados
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

export class ValidationService {
  static validateRegister(body: any): Result<RegisterDTO, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    const emailResult = Email.create(body.email);
    if (isErr(emailResult)) {
      errors.push({ field: 'email', message: emailResult.error });
    }

    const passwordResult = Password.create(body.password);
    if (isErr(passwordResult)) {
      errors.push({ field: 'password', message: passwordResult.error });
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok({
      email: emailResult.value!,
      password: passwordResult.value!
    });
  }

  static validateLogin(body: any): Result<LoginDTO, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    const emailResult = Email.create(body.email);
    if (isErr(emailResult)) {
      errors.push({ field: 'email', message: emailResult.error });
    }

    const passwordResult = Password.createForLogin(body.password);
    if (isErr(passwordResult)) {
      errors.push({ field: 'password', message: passwordResult.error });
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok({
      email: emailResult.value!,
      password: passwordResult.value!
    });
  }

  static validateCreatePage(body: any): Result<CreatePageDTO, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    const tituloResult = PageTitle.create(body.titulo);
    if (isErr(tituloResult)) {
      errors.push({ field: 'titulo', message: tituloResult.error });
    }

    const contenidoResult = PageContent.create(body.contenido);
    if (isErr(contenidoResult)) {
      errors.push({ field: 'contenido', message: contenidoResult.error });
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok({
      titulo: tituloResult.value!,
      contenido: contenidoResult.value!,
      descripcion: body.descripcion
    });
  }

  static validateUpdatePage(body: any): Result<UpdatePageDTO, ValidationError[]> {
    const errors: ValidationError[] = [];
    const dto: UpdatePageDTO = {};

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    if (body.titulo !== undefined) {
      const tituloResult = PageTitle.create(body.titulo);
      if (isErr(tituloResult)) {
        errors.push({ field: 'titulo', message: tituloResult.error });
      } else {
        dto.titulo = tituloResult.value;
      }
    }

    if (body.contenido !== undefined) {
      const contenidoResult = PageContent.create(body.contenido);
      if (isErr(contenidoResult)) {
        errors.push({ field: 'contenido', message: contenidoResult.error });
      } else {
        dto.contenido = contenidoResult.value;
      }
    }

    if (body.descripcion !== undefined) {
      dto.descripcion = body.descripcion;
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok(dto);
  }

  static validateCreateComment(body: any, params: any): Result<CreateCommentDTO, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    if (!params || typeof params !== 'object') {
      return err([{ field: 'params', message: 'Parámetros inválidos' }]);
    }

    const comentarioResult = CommentText.create(body.comentario);
    if (isErr(comentarioResult)) {
      errors.push({ field: 'comentario', message: comentarioResult.error });
    }

    const pageId = parseInt(params.id, 10);
    if (isNaN(pageId) || pageId <= 0) {
      errors.push({ field: 'id', message: 'ID de página inválido' });
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok({
      comentario: comentarioResult.value!,
      pageId
    });
  }

  static validateUpdateUsername(body: any): Result<UpdateUsernameDTO, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    const usernameResult = Username.create(body.username);
    if (isErr(usernameResult)) {
      errors.push({ field: 'username', message: usernameResult.error });
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok({
      username: usernameResult.value!
    });
  }

  static validateCreatePublicacion(body: any): Result<CreatePublicacionDTO, ValidationError[]> {
    const errors: ValidationError[] = [];

    if (!body || typeof body !== 'object') {
      return err([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }

    const tituloResult = PublicacionTitle.create(body.titulo);
    if (isErr(tituloResult)) {
      errors.push({ field: 'titulo', message: tituloResult.error });
    }

    const contenidoResult = PublicacionContent.create(body.contenido);
    if (isErr(contenidoResult)) {
      errors.push({ field: 'contenido', message: contenidoResult.error });
    }

    if (errors.length > 0) {
      return err(errors);
    }

    return ok({
      titulo: tituloResult.value!,
      contenido: contenidoResult.value!
    });
  }
}

// Middleware de validación actualizado
export const validateRequest = (validator: (body: any, params?: any) => Result<any, ValidationError[]>) => {
  return (req: any, res: any, next: any) => {
    const result = validator(req.body, req.params);

    if (isErr(result)) {
      return res.status(400).json({
        status: 'error',
        message: 'Datos de entrada inválidos',
        errors: result.error
      });
    }

    // Adjuntar los datos validados a la request
    req.validatedData = result.value;
    next();
  };
};