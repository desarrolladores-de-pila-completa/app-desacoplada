import { Request, Response } from "express";
import { MulterFile } from '../types/interfaces';
interface RequestWithFile extends Request {
    file?: MulterFile;
    validatedData?: any;
}
export declare function register(req: RequestWithFile, res: Response): Promise<void>;
export declare function login(req: RequestWithFile, res: Response): Promise<void>;
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function me(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function eliminarUsuario(req: Request, res: Response): Promise<void>;
export {};
//# sourceMappingURL=authController.d.ts.map