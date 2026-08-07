import { Document, Types } from 'mongoose';
export interface IBaseDocument extends Document {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}
export interface IUserScopedDocument extends IBaseDocument {
    userId: Types.ObjectId;
}
export interface ILogDocument extends IUserScopedDocument {
    localDate: string;
    loggedAt: Date;
    tzOffsetMinutes: number;
    source: 'manual' | 'reminder' | 'import' | 'wearable';
    clientLogId: string;
}
export interface PaginatedResult<T> {
    items: T[];
    cursor?: string;
    hasMore: boolean;
}
export interface DashboardCard {
    key: string;
    type: 'ring' | 'stat' | 'chart' | 'list' | 'streak' | 'cta';
    title: string;
    dataSource: string;
    deepLink?: string;
    [key: string]: unknown;
}
export interface DashboardResponse {
    date: string;
    greeting: {
        name: string;
        streakDays: number;
    };
    cards: DashboardCard[];
}
//# sourceMappingURL=types.d.ts.map