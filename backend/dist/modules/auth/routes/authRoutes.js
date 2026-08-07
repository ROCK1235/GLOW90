"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controller/authController.js");
const auth_js_1 = require("../../../middleware/auth.js");
const rateLimit_js_1 = require("../../../middleware/rateLimit.js");
const validate_js_1 = require("../../../middleware/validate.js");
const authSchema_js_1 = require("../schema/authSchema.js");
const router = (0, express_1.Router)();
router.post('/register', rateLimit_js_1.authRateLimiter, (0, validate_js_1.validate)(authSchema_js_1.registerSchema), authController_js_1.authController.register.bind(authController_js_1.authController));
router.post('/login', rateLimit_js_1.authRateLimiter, (0, validate_js_1.validate)(authSchema_js_1.loginSchema), authController_js_1.authController.login.bind(authController_js_1.authController));
router.post('/refresh', rateLimit_js_1.authRateLimiter, (0, validate_js_1.validate)(authSchema_js_1.refreshSchema), authController_js_1.authController.refresh.bind(authController_js_1.authController));
router.post('/logout', (0, validate_js_1.validate)(authSchema_js_1.logoutSchema), authController_js_1.authController.logout.bind(authController_js_1.authController));
router.get('/me', auth_js_1.authMiddleware, authController_js_1.authController.me.bind(authController_js_1.authController));
router.patch('/password', auth_js_1.authMiddleware, (0, validate_js_1.validate)(authSchema_js_1.changePasswordSchema), authController_js_1.authController.changePassword.bind(authController_js_1.authController));
router.post('/forgot-password', rateLimit_js_1.authRateLimiter, (0, validate_js_1.validate)(authSchema_js_1.forgotPasswordSchema), authController_js_1.authController.forgotPassword.bind(authController_js_1.authController));
router.post('/reset-password', rateLimit_js_1.authRateLimiter, (0, validate_js_1.validate)(authSchema_js_1.resetPasswordSchema), authController_js_1.authController.resetPassword.bind(authController_js_1.authController));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map