import { Request, Response, NextFunction } from 'express';
export interface AuthPayload {
    userId: string;
    tokenVersion: number;
    iat: number;
    exp: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthPayload;
        }
    }
}
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
export declare function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map