import { IUserOwnedDocument } from './user-owned.interface.js';
export interface ILogDocument extends IUserOwnedDocument {
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
//# sourceMappingURL=document.interface.d.ts.map