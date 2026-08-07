"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRepository = exports.AuthRepository = void 0;
const index_js_1 = require("../../users/model/index.js");
const RefreshToken_js_1 = require("../model/RefreshToken.js");
class AuthRepository {
    async createUser(userData) {
        return index_js_1.UserModel.create(userData);
    }
    async findUserByEmail(email) {
        return index_js_1.UserModel.findOne({ email: email.toLowerCase() }).exec();
    }
    async findUserById(userId) {
        return index_js_1.UserModel.findById(userId).exec();
    }
    async updateUser(userId, update) {
        return index_js_1.UserModel.findByIdAndUpdate(userId, update, { new: true }).exec();
    }
    async deleteUser(userId) {
        await index_js_1.UserModel.findByIdAndUpdate(userId, { status: 'deleted' }).exec();
    }
    async createSettings(userId) {
        return index_js_1.UserSettingsModel.create({ userId });
    }
    async findSettingsByUserId(userId) {
        return index_js_1.UserSettingsModel.findOne({ userId }).exec();
    }
    async updateSettings(userId, update) {
        return index_js_1.UserSettingsModel.findOneAndUpdate({ userId }, update, { new: true, upsert: true }).exec();
    }
    async createRefreshToken(tokenData) {
        return RefreshToken_js_1.RefreshTokenModel.create(tokenData);
    }
    async findRefreshTokenByHash(tokenHash) {
        return RefreshToken_js_1.RefreshTokenModel.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } }).exec();
    }
    async revokeRefreshToken(tokenHash, replacedBy) {
        await RefreshToken_js_1.RefreshTokenModel.findOneAndUpdate({ tokenHash }, { revokedAt: new Date(), replacedBy }).exec();
    }
    async revokeTokenFamily(userId, family) {
        await RefreshToken_js_1.RefreshTokenModel.updateMany({ userId, family, revokedAt: null }, { revokedAt: new Date() }).exec();
    }
    async revokeAllUserTokens(userId) {
        await RefreshToken_js_1.RefreshTokenModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() }).exec();
    }
    async findValidRefreshTokens(userId) {
        return RefreshToken_js_1.RefreshTokenModel.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).exec();
    }
}
exports.AuthRepository = AuthRepository;
exports.authRepository = new AuthRepository();
//# sourceMappingURL=authRepository.js.map