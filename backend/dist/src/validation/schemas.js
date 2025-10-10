"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
exports.validateRegister = validateRegister;
exports.validateLogin = validateLogin;
exports.validateCreatePage = validateCreatePage;
exports.validateUpdatePage = validateUpdatePage;
exports.validateCreateComment = validateCreateComment;
exports.validateUpdateUsername = validateUpdateUsername;
const value_objects_1 = require("../value-objects");
const value_objects_2 = require("../value-objects");
// Funciones de validación usando Value Objects
function validateRegister(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return (0, value_objects_1.err)([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }
    const emailResult = value_objects_2.Email.create(body.email);
    if ((0, value_objects_1.isErr)(emailResult)) {
        errors.push({ field: 'email', message: emailResult.error });
    }
    const passwordResult = value_objects_2.Password.create(body.password);
    if ((0, value_objects_1.isErr)(passwordResult)) {
        errors.push({ field: 'password', message: passwordResult.error });
    }
    if (errors.length > 0) {
        return (0, value_objects_1.err)(errors);
    }
    return (0, value_objects_1.ok)({
        email: emailResult.value,
        password: passwordResult.value
    });
}
function validateLogin(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return (0, value_objects_1.err)([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }
    const emailResult = value_objects_2.Email.create(body.email);
    if ((0, value_objects_1.isErr)(emailResult)) {
        errors.push({ field: 'email', message: emailResult.error });
    }
    const passwordResult = value_objects_2.Password.createForLogin(body.password);
    if ((0, value_objects_1.isErr)(passwordResult)) {
        errors.push({ field: 'password', message: passwordResult.error });
    }
    if (errors.length > 0) {
        return (0, value_objects_1.err)(errors);
    }
    return (0, value_objects_1.ok)({
        email: emailResult.value,
        password: passwordResult.value
    });
}
function validateCreatePage(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return (0, value_objects_1.err)([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }
    const tituloResult = value_objects_2.PageTitle.create(body.titulo);
    if ((0, value_objects_1.isErr)(tituloResult)) {
        errors.push({ field: 'titulo', message: tituloResult.error });
    }
    const contenidoResult = value_objects_2.PageContent.create(body.contenido);
    if ((0, value_objects_1.isErr)(contenidoResult)) {
        errors.push({ field: 'contenido', message: contenidoResult.error });
    }
    if (errors.length > 0) {
        return (0, value_objects_1.err)(errors);
    }
    return (0, value_objects_1.ok)({
        titulo: tituloResult.value,
        contenido: contenidoResult.value,
        descripcion: body.descripcion
    });
}
function validateUpdatePage(body) {
    const errors = [];
    const dto = {};
    if (!body || typeof body !== 'object') {
        return (0, value_objects_1.err)([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }
    if (body.titulo !== undefined) {
        const tituloResult = value_objects_2.PageTitle.create(body.titulo);
        if ((0, value_objects_1.isErr)(tituloResult)) {
            errors.push({ field: 'titulo', message: tituloResult.error });
        }
        else {
            dto.titulo = tituloResult.value;
        }
    }
    if (body.contenido !== undefined) {
        const contenidoResult = value_objects_2.PageContent.create(body.contenido);
        if ((0, value_objects_1.isErr)(contenidoResult)) {
            errors.push({ field: 'contenido', message: contenidoResult.error });
        }
        else {
            dto.contenido = contenidoResult.value;
        }
    }
    if (body.descripcion !== undefined) {
        dto.descripcion = body.descripcion;
    }
    if (errors.length > 0) {
        return (0, value_objects_1.err)(errors);
    }
    return (0, value_objects_1.ok)(dto);
}
function validateCreateComment(body, params) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return (0, value_objects_1.err)([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }
    if (!params || typeof params !== 'object') {
        return (0, value_objects_1.err)([{ field: 'params', message: 'Parámetros inválidos' }]);
    }
    const comentarioResult = value_objects_2.CommentText.create(body.comentario);
    if ((0, value_objects_1.isErr)(comentarioResult)) {
        errors.push({ field: 'comentario', message: comentarioResult.error });
    }
    const pageId = parseInt(params.id, 10);
    if (isNaN(pageId) || pageId <= 0) {
        errors.push({ field: 'id', message: 'ID de página inválido' });
    }
    if (errors.length > 0) {
        return (0, value_objects_1.err)(errors);
    }
    return (0, value_objects_1.ok)({
        comentario: comentarioResult.value,
        pageId
    });
}
function validateUpdateUsername(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return (0, value_objects_1.err)([{ field: 'body', message: 'Cuerpo de la solicitud inválido' }]);
    }
    const usernameResult = value_objects_2.Username.create(body.username);
    if ((0, value_objects_1.isErr)(usernameResult)) {
        errors.push({ field: 'username', message: usernameResult.error });
    }
    if (errors.length > 0) {
        return (0, value_objects_1.err)(errors);
    }
    return (0, value_objects_1.ok)({
        username: usernameResult.value
    });
}
// Middleware de validación actualizado
const validateRequest = (validator) => {
    return (req, res, next) => {
        const result = validator(req.body, req.params);
        if ((0, value_objects_1.isErr)(result)) {
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
exports.validateRequest = validateRequest;
//# sourceMappingURL=schemas.js.map