import { Request, Response } from "express";
export declare function crearPublicacion(req: any, res: Response): Promise<void>;
export declare function obtenerPublicacion(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerPublicacionesPorUsuario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function obtenerTodasLasPublicaciones(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=publicacionController.d.ts.map