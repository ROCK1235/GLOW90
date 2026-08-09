import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly details?: unknown | undefined;
    constructor(code: string, message: string, statusCode?: number, details?: unknown | undefined);
}
export declare function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void;
export declare function notFoundHandler(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map