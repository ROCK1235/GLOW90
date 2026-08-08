import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        name: string;
        password: string;
    }, {
        email: string;
        name: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        name: string;
        password: string;
    };
}, {
    body: {
        email: string;
        name: string;
        password: string;
    };
}>;
export declare const loginSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
        password: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
        password: string;
    }, {
        email: string;
        password: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
        password: string;
    };
}, {
    body: {
        email: string;
        password: string;
    };
}>;
export declare const refreshSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        refreshToken: string;
    }, {
        refreshToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        refreshToken: string;
    };
}, {
    body: {
        refreshToken: string;
    };
}>;
export declare const logoutSchema: z.ZodObject<{
    body: z.ZodObject<{
        refreshToken: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        refreshToken?: string | undefined;
    }, {
        refreshToken?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        refreshToken?: string | undefined;
    };
}, {
    body: {
        refreshToken?: string | undefined;
    };
}>;
export declare const changePasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        currentPassword: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        currentPassword: string;
        newPassword: string;
    }, {
        currentPassword: string;
        newPassword: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        currentPassword: string;
        newPassword: string;
    };
}, {
    body: {
        currentPassword: string;
        newPassword: string;
    };
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        email: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        email: string;
    }, {
        email: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        email: string;
    };
}, {
    body: {
        email: string;
    };
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    body: z.ZodObject<{
        token: z.ZodString;
        newPassword: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        newPassword: string;
        token: string;
    }, {
        newPassword: string;
        token: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        newPassword: string;
        token: string;
    };
}, {
    body: {
        newPassword: string;
        token: string;
    };
}>;
export declare const googleAuthSchema: z.ZodObject<{
    body: z.ZodObject<{
        idToken: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        idToken: string;
    }, {
        idToken: string;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        idToken: string;
    };
}, {
    body: {
        idToken: string;
    };
}>;
export declare const appleAuthSchema: z.ZodObject<{
    body: z.ZodObject<{
        idToken: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        idToken: string;
        name?: string | undefined;
    }, {
        idToken: string;
        name?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        idToken: string;
        name?: string | undefined;
    };
}, {
    body: {
        idToken: string;
        name?: string | undefined;
    };
}>;
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshInput = z.infer<typeof refreshSchema>['body'];
export type LogoutInput = z.infer<typeof logoutSchema>['body'];
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>['body'];
export type AppleAuthInput = z.infer<typeof appleAuthSchema>['body'];
//# sourceMappingURL=authSchema.d.ts.map