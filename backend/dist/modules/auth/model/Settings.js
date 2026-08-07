"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const SettingsSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    theme: { type: String, enum: ['system', 'light', 'dark'], required: true, default: 'system' },
    notifications: {
        habits: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
        water: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
        supplements: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
        workouts: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
        weight: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
        skincare: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
        general: { enabled: { type: Boolean, default: true }, quietHours: { start: String, end: String } },
    },
    privacy: {
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'private' },
        showProgressPhotos: { type: Boolean, default: false },
        showWeight: { type: Boolean, default: false },
    },
    dashboardLayout: [
        {
            key: { type: String, required: true },
            order: { type: Number, required: true },
            enabled: { type: Boolean, default: true },
            overrides: { type: mongoose_1.Schema.Types.Mixed, default: {} },
        },
    ],
    weekStartsOn: { type: Number, min: 0, max: 6, default: 0 },
    hydration: {
        mode: { type: String, enum: ['fixed', 'by_weight'], default: 'by_weight' },
        fixedMl: { type: Number, default: 2500 },
        mlPerKg: { type: Number, default: 35 },
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true });
exports.SettingsModel = mongoose_1.default.model('Settings', SettingsSchema);
//# sourceMappingURL=Settings.js.map