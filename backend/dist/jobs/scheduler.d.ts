export interface ScheduledJob {
    name: string;
    intervalMs: number;
    handler: () => Promise<void>;
    timer?: NodeJS.Timeout;
}
export declare function registerJob(job: ScheduledJob): void;
export declare function startJobs(): void;
export declare function stopJobs(): void;
export declare function getJobs(): ScheduledJob[];
//# sourceMappingURL=scheduler.d.ts.map