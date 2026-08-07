import { IUser, IUserSettings } from '../../users/model/index.js';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export interface RegisterData {
    email: string;
    password: string;
    name: string;
    userAgent?: string;
    ip?: string;
}
export interface LoginData {
    email: string;
    password: string;
    userAgent?: string;
    ip?: string;
}
declare class AuthService {
    private generateTokenFamily;
    hashRefreshToken(token: string): string;
    register(data: RegisterData): Promise<{
        user: IUser;
        settings: IUserSettings;
        tokens: TokenPair;
    }>;
    login(data: LoginData): Promise<{
        user: IUser;
        settings: IUserSettings;
        tokens: TokenPair;
    }>;
    refreshTokens(refreshToken: string, userAgent?: string, ip?: string): Promise<TokenPair>;
    logout(refreshToken: string): Promise<void>;
    private generateTokenPair;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    forgotPassword(email: string): Promise<string | null>;
    resetPassword(token: string, newPassword: string): Promise<void>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=authService.d.ts.map