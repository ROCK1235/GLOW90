import { IUser, IUserSettings } from '../../users/model/index.js';
import { IRefreshToken } from '../model/RefreshToken.js';
import { UpdateQuery } from 'mongoose';
export declare class AuthRepository {
    createUser(userData: Partial<IUser>): Promise<IUser>;
    findUserByEmail(email: string): Promise<IUser | null>;
    findUserByProvider(provider: 'google' | 'apple', providerId: string): Promise<IUser | null>;
    addProviderToUser(userId: string, provider: 'google' | 'apple', providerId: string): Promise<IUser | null>;
    findUserById(userId: string): Promise<IUser | null>;
    updateUser(userId: string, update: UpdateQuery<IUser>): Promise<IUser | null>;
    deleteUser(userId: string): Promise<void>;
    createSettings(userId: string): Promise<IUserSettings>;
    findSettingsByUserId(userId: string): Promise<IUserSettings | null>;
    updateSettings(userId: string, update: UpdateQuery<IUserSettings>): Promise<IUserSettings | null>;
    createRefreshToken(tokenData: Partial<IRefreshToken>): Promise<IRefreshToken>;
    findRefreshTokenByHash(tokenHash: string): Promise<IRefreshToken | null>;
    revokeRefreshToken(tokenHash: string, replacedBy: string): Promise<void>;
    revokeTokenFamily(userId: string, family: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
    findValidRefreshTokens(userId: string): Promise<IRefreshToken[]>;
}
export declare const authRepository: AuthRepository;
//# sourceMappingURL=authRepository.d.ts.map