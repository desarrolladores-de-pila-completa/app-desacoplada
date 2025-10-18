import { Request, Response } from "express";
/**
 * @swagger
 * /api/pagina/user/{user_id}:
 *   get:
 *     summary: Obtener página por user_id
 *     tags: [Pagina]
 */
/**
 * @swagger
 * /api/pagina/user/{user_id}:
 *   get:
 *     summary: Obtener página por user_id
 *     tags: [Pagina]
 */
export declare function obtenerPaginaPorUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/{username}:
 *   get:
 *     summary: Obtener información de página por username con soporte para diferentes acciones
 *     tags: [Pagina]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [info, publicaciones, galeria, comentarios, lista]
 *         description: Tipo de acción a realizar
 *       - in: query
 *         name: publicacionId
 *         schema:
 *           type: integer
 *         description: ID específico de publicación (para action=publicacion)
 *       - in: query
 *         name: pageNumber
 *         schema:
 *           type: integer
 *         description: Número de página específico (para action=lista)
 */
export declare function paginaUnificadaPorUsername(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
export declare function obtenerPaginaPorUsername(req: Request, res: Response): Promise<void | Response<any, Record<string, any>>>;
/**
 * @swagger
 * /api/pagina/publicas/{username}:
 *   get:
 *     summary: Obtener páginas públicas de un usuario
 *     tags: [Pagina]
 */
export declare function obtenerPaginasPublicasPorUsuario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/username/{username}/numero/{pageNumber}:
 *   get:
 *     summary: Obtener página por username y número de página
 *     tags: [Pagina]
 */
export declare function obtenerPaginaPorUsernameYNumero(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/propietario/{id}:
 *   get:
 *     summary: Consultar propietario de página
 *     tags: [Pagina]
 */
export declare function consultarPropietario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/usuario/{id}:
 *   get:
 *     summary: Consultar usuario de página
 *     tags: [Pagina]
 */
export declare function consultarUsuarioPagina(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/actualizar-propietario/{id}:
 *   put:
 *     summary: Actualizar propietario de página
 *     tags: [Pagina]
 */
export declare function actualizarPropietario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/actualizar-usuario/{id}:
 *   put:
 *     summary: Actualizar usuario de página
 *     tags: [Pagina]
 */
export declare function actualizarUsuarioPagina(req: RequestWithValidatedData, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
interface RequestWithValidatedData extends Request {
    validatedData?: any;
}
/**
 * @swagger
 * /api/pagina/actualizar-visibilidad/{id}:
 *   put:
 *     summary: Actualizar visibilidad de página
 *     tags: [Pagina]
 */
export declare function actualizarVisibilidad(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/consultar-visibilidad/{id}:
 *   get:
 *     summary: Consultar visibilidad de página
 *     tags: [Pagina]
 */
export declare function consultarVisibilidad(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerPagina(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/eliminar-usuario/{id}:
 *   delete:
 *     summary: Eliminar usuario y todos sus datos
 *     tags: [Pagina]
 */
export declare function eliminarUsuarioTotal(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/publicas:
 *   get:
 *     summary: Obtener páginas públicas
 *     tags: [Pagina]
 */
export declare function paginasPublicas(req: Request, res: Response): Promise<void>;
/**
 * @swagger
 * /api/pagina/comentario:
 *   post:
 *     summary: Guardar comentario en la página
 *     tags: [Pagina]
 */
export declare function guardarComentario(req: RequestWithValidatedData, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * @swagger
 * /api/pagina/comentario/{id}/{commentId}:
 *   delete:
 *     summary: Eliminar comentario de la página
 *     tags: [Pagina]
 */
export declare function eliminarComentario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=paginaController.d.ts.map