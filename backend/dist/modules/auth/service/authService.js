"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const argon2_1 = __importDefault(require("argon2"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = require("crypto");
const env_js_1 = require("../../../config/env.js");
const authRepository_js_1 = require("../repository/authRepository.js");
class AuthService {
    generateTokenFamily() {
        return (0, crypto_1.randomUUID)();
    }
    hashRefreshToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    async register(data) {
        const { email, password, name } = data;
        const existingUser = await authRepository_js_1.authRepository.findUserByEmail(email);
        if (existingUser) {
            throw new Error('EMAIL_EXISTS');
        }
        const passwordHash = await argon2_1.default.hash(password, { type: argon2_1.default.argon2id });
        const family = this.generateTokenFamily();
        const user = await authRepository_js_1.authRepository.createUser({
            email: email.toLowerCase(),
            passwordHash,
            name,
            status: 'active',
        });
        const settings = await authRepository_js_1.authRepository.createSettings(user._id.toString());
        const tokens = await this.generateTokenPair(user._id.toString(), family, data.userAgent, data.ip);
        return { user, settings, tokens };
    }
    async login(data) {
        const { email, password, userAgent, ip } = data;
        const user = await authRepository_js_1.authRepository.findUserByEmail(email);
        if (!user) {
            throw new Error('INVALID_CREDENTIALS');
        }
        if (user.status !== 'active') {
            throw new Error('ACCOUNT_SUSPENDED');
        }
        const valid = await argon2_1.default.verify(user.passwordHash, password);
        if (!valid) {
            throw new Error('INVALID_CREDENTIALS');
        }
        const family = this.generateTokenFamily();
        const tokens = await this.generateTokenPair(user._id.toString(), family, userAgent, ip);
        const settings = await authRepository_js_1.authRepository.findSettingsByUserId(user._id.toString());
        return { user, settings: settings, tokens };
    }
    async refreshTokens(refreshToken, userAgent, ip) {
        const { JWT_REFRESH_SECRET } = (0, env_js_1.getEnv)();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        }
        catch {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
        const storedToken = await authRepository_js_1.authRepository.findRefreshTokenByHash(this.hashRefreshToken(refreshToken));
        if (!storedToken || storedToken.family !== payload.family) {
            throw new Error('INVALID_REFRESH_TOKEN');
        }
        if (storedToken.revokedAt) {
            await authRepository_js_1.authRepository.revokeTokenFamily(payload.userId, payload.family);
            throw new Error('TOKEN_REUSED');
        }
        await authRepository_js_1.authRepository.revokeRefreshToken(storedToken.tokenHash, (0, crypto_1.randomUUID)());
        const tokens = await this.generateTokenPair(payload.userId, payload.family, userAgent, ip);
        return tokens;
    }
    async logout(refreshToken) {
        const { JWT_REFRESH_SECRET } = (0, env_js_1.getEnv)();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(refreshToken, JWT_REFRESH_SECRET);
        }
        catch {
            return;
        }
        await authRepository_js_1.authRepository.revokeTokenFamily(payload.userId, payload.family);
    }
    async generateTokenPair(userId, family, userAgent, ip) {
        const { JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } = (0, env_js_1.getEnv)();
        const accessToken = jsonwebtoken_1.default.sign({ userId, tokenVersion: 1 }, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRY });
        const refreshToken = jsonwebtoken_1.default.sign({ userId, family, tokenVersion: 1 }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY });
        const refreshTokenHash = this.hashRefreshToken(refreshToken);
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        await authRepository_js_1.authRepository.createRefreshToken({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            tokenHash: refreshTokenHash,
            family,
            expiresAt,
            userAgent: userAgent ?? null,
            ip: ip ?? null,
        });
        return { accessToken, refreshToken };
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await authRepository_js_1.authRepository.findUserById(userId);
        if (!user)
            throw new Error('USER_NOT_FOUND');
        const valid = await argon2_1.default.verify(user.passwordHash, currentPassword);
        if (!valid)
            throw new Error('INVALID_CURRENT_PASSWORD');
        const passwordHash = await argon2_1.default.hash(newPassword, { type: argon2_1.default.argon2id });
        await authRepository_js_1.authRepository.updateUser(userId, { passwordHash });
        await authRepository_js_1.authRepository.revokeAllUserTokens(userId);
    }
    async forgotPassword(email) {
        const user = await authRepository_js_1.authRepository.findUserByEmail(email);
        if (!user)
            return null;
        const { JWT_REFRESH_SECRET } = (0, env_js_1.getEnv)();
        const resetToken = jsonwebtoken_1.default.sign({ userId: user._id.toString(), type: 'password_reset' }, JWT_REFRESH_SECRET, {
            expiresIn: '30m',
        });
        return resetToken;
    }
    async resetPassword(token, newPassword) {
        const { JWT_REFRESH_SECRET } = (0, env_js_1.getEnv)();
        let payload;
        try {
            payload = jsonwebtoken_1.default.verify(token, JWT_REFRESH_SECRET);
        }
        catch {
            throw new Error('INVALID_RESET_TOKEN');
        }
        if (payload.type !== 'password_reset') {
            throw new Error('INVALID_RESET_TOKEN');
        }
        const passwordHash = await argon2_1.default.hash(newPassword, { type: argon2_1.default.argon2id });
        await authRepository_js_1.authRepository.updateUser(payload.userId, { passwordHash });
        await authRepository_js_1.authRepository.revokeAllUserTokens(payload.userId);
    }
}
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map