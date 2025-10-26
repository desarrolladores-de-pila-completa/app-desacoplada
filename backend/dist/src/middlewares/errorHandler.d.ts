import { Request, Response, NextFunction } from "express";
import { AppError } from "../types/interfaces";
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map