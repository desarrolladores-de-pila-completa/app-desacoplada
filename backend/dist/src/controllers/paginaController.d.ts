export declare function obtenerPaginaPorUserId(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerPaginaPorUsername(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerPaginasPublicasPorUsuario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerPaginaPorUsernameYNumero(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function consultarPropietario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function consultarUsuarioPagina(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function actualizarPropietario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function actualizarUsuarioPagina(req: RequestWithValidatedData, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
import { Request, Response } from "express";
interface RequestWithValidatedData extends Request {
    validatedData?: any;
}
export declare function actualizarVisibilidad(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function consultarVisibilidad(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerPagina(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function eliminarUsuarioTotal(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function paginasPublicas(req: Request, res: Response): Promise<void>;
export declare function guardarComentario(req: RequestWithValidatedData, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function eliminarComentario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=paginaController.d.ts.map