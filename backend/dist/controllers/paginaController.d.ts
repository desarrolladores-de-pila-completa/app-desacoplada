import { Request, Response } from "express";
export declare function crearPagina(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function verPagina(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function paginasPorAutor(req: Request, res: Response): Promise<void>;
export declare function paginasPublicas(req: Request, res: Response): Promise<void>;
//# sourceMappingURL=paginaController.d.ts.map