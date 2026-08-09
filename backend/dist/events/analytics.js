"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bus_js_1 = require("./bus.js");
const logger_js_1 = require("../config/logger.js");
async function updateAnalyticsRollup(payload) {
    // This is a stub - real implementation would upsert into AnalyticsRollups collection
    logger_js_1.logger.debug({ payload }, 'Updating analytics rollup');
}
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.HABIT_LOGGED, async (payload) => {
    if (!payload?.userId)
        return;
    await updateAnalyticsRollup({
        userId: payload.userId,
        module: 'habits',
        metrics: { completions: 1 },
        period: 'day',
        periodKey: new Date().toISOString().split('T')[0],
    });
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WATER_GOAL_MET, async (payload) => {
    if (!payload?.userId)
        return;
    await updateAnalyticsRollup({
        userId: payload.userId,
        module: 'water',
        metrics: { goalMet: 1 },
        period: 'day',
        periodKey: new Date().toISOString().split('T')[0],
    });
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WEIGHT_LOGGED, async (payload) => {
    if (!payload?.userId)
        return;
    await updateAnalyticsRollup({
        userId: payload.userId,
        module: 'weight',
        metrics: { weightKg: payload.weightKg ?? 0, logs: 1 },
        period: 'day',
        periodKey: new Date().toISOString().split('T')[0],
    });
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.SUPPLEMENT_TAKEN, async (payload) => {
    if (!payload?.userId)
        return;
    await updateAnalyticsRollup({
        userId: payload.userId,
        module: 'supplements',
        metrics: { taken: 1 },
        period: 'day',
        periodKey: new Date().toISOString().split('T')[0],
    });
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WORKOUT_COMPLETED, async (payload) => {
    if (!payload?.userId)
        return;
    await updateAnalyticsRollup({
        userId: payload.userId,
        module: 'workouts',
        metrics: { volumeKg: payload.volumeKg ?? 0, sessions: 1 },
        period: 'day',
        periodKey: new Date().toISOString().split('T')[0],
    });
});
logger_js_1.logger.info('Analytics subscribers registered');
//# sourceMappingURL=analytics.js.map