import { z } from 'zod';
export declare const ObjectIdSchema: z.ZodString;
export declare const LocalDateSchema: z.ZodString;
export declare const FrequencySchema: z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
    type: z.ZodLiteral<"daily">;
}, "strip", z.ZodTypeAny, {
    type: "daily";
}, {
    type: "daily";
}>, z.ZodObject<{
    type: z.ZodLiteral<"weekdays">;
    days: z.ZodArray<z.ZodNumber, "many">;
}, "strip", z.ZodTypeAny, {
    type: "weekdays";
    days: number[];
}, {
    type: "weekdays";
    days: number[];
}>, z.ZodObject<{
    type: z.ZodLiteral<"times_per_week">;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    type: "times_per_week";
    count: number;
}, {
    type: "times_per_week";
    count: number;
}>, z.ZodObject<{
    type: z.ZodLiteral<"every_n_days">;
    n: z.ZodNumber;
    anchorDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "every_n_days";
    n: number;
    anchorDate?: string | undefined;
}, {
    type: "every_n_days";
    n: number;
    anchorDate?: string | undefined;
}>]>;
export type Frequency = z.infer<typeof FrequencySchema>;
export declare const PaginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export type Pagination = z.infer<typeof PaginationSchema>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    meta: z.ZodOptional<z.ZodObject<{
        cursor: z.ZodOptional<z.ZodString>;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        hasMore: boolean;
        cursor?: string | undefined;
    }, {
        hasMore: boolean;
        cursor?: string | undefined;
    }>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    meta: z.ZodOptional<z.ZodObject<{
        cursor: z.ZodOptional<z.ZodString>;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        hasMore: boolean;
        cursor?: string | undefined;
    }, {
        hasMore: boolean;
        cursor?: string | undefined;
    }>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    meta: z.ZodOptional<z.ZodObject<{
        cursor: z.ZodOptional<z.ZodString>;
        hasMore: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        hasMore: boolean;
        cursor?: string | undefined;
    }, {
        hasMore: boolean;
        cursor?: string | undefined;
    }>>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const ErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodArray<z.ZodUnknown, "many">>;
    }, "strip", z.ZodTypeAny, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }, {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    };
}, {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown[] | undefined;
    };
}>;
export type ApiError = z.infer<typeof ErrorResponseSchema>['error'];
//# sourceMappingURL=schemas.d.ts.map