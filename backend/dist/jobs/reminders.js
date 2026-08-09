"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerReminderJob = registerReminderJob;
exports.registerStreakRepairJob = registerStreakRepairJob;
exports.registerAnalyticsRollupJob = registerAnalyticsRollupJob;
exports.registerAllJobs = registerAllJobs;
const scheduler_js_1 = require("./scheduler.js");
const logger_js_1 = require("../config/logger.js");
function registerReminderJob() {
    (0, scheduler_js_1.registerJob)({
        name: 'reminder-scheduler',
        intervalMs: 15 * 60 * 1000, // Every 15 minutes
        handler: async () => {
            logger_js_1.logger.debug('Running reminder scheduler');
            // TODO: Implement reminder scheduling logic
            // 1. Get current time buckets (15-min intervals)
            // 2. Find users whose timezone matches current bucket
            // 3. Check user reminder settings (habits, supplements, water)
            // 4. Send push notifications via Expo/FCM
            // 5. Record delivery to prevent double-notify on retry
        },
    });
}
function registerStreakRepairJob() {
    (0, scheduler_js_1.registerJob)({
        name: 'streak-repair',
        intervalMs: 24 * 60 * 60 * 1000, // Daily at midnight UTC
        handler: async () => {
            logger_js_1.logger.debug('Running streak repair job');
            // TODO: Recompute streaks for users whose counters may have drifted
        },
    });
}
function registerAnalyticsRollupJob() {
    (0, scheduler_js_1.registerJob)({
        name: 'analytics-rollup',
        intervalMs: 60 * 60 * 1000, // Hourly
        handler: async () => {
            logger_js_1.logger.debug('Running analytics rollup job');
            // TODO: Aggregate raw logs into AnalyticsRollups collection
        },
    });
}
function registerAllJobs() {
    registerReminderJob();
    registerStreakRepairJob();
    registerAnalyticsRollupJob();
}
//# sourceMappingURL=reminders.js.map