export declare function eliminarUsuario(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function logout(req: Request, res: Response): Promise<void>;
import { Request, Response } from "express";
import { MulterFile } from '../types/interfaces';
interface RequestWithFile extends Request {
    file?: MulterFile;
}
export declare function register(req: RequestWithFile, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export {};
//# sourceMappingURL=authController.d.ts.map