import { Request, Response, NextFunction } from 'express';
export declare function getGeneralRateLimiter(): import("express-rate-limit").RateLimitRequestHandler;
export declare function getAuthRateLimiter(): import("express-rate-limit").RateLimitRequestHandler;
export declare const generalRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=rateLimit.d.ts.map