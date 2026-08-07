"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bus_js_1 = require("./bus.js");
const logger_js_1 = require("../config/logger.js");
async function evaluateCondition(userId, condition) {
    // This is a stub - real implementation would query log collections
    // For now, return not met with 0 progress
    return { met: false, progress: 0 };
}
async function checkAndUnlockAchievements(userId, trigger) {
    // In real implementation, fetch achievements matching trigger and evaluate
    logger_js_1.logger.debug({ userId, trigger }, 'Checking achievements');
}
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.HABIT_LOGGED, async (payload) => {
    if (!payload?.userId)
        return;
    await checkAndUnlockAchievements(payload.userId, bus_js_1.DomainEvents.HABIT_LOGGED);
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.HABIT_STREAK_ADVANCED, async (payload) => {
    if (!payload?.userId)
        return;
    await checkAndUnlockAchievements(payload.userId, bus_js_1.DomainEvents.HABIT_STREAK_ADVANCED);
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WATER_GOAL_MET, async (payload) => {
    if (!payload?.userId)
        return;
    await checkAndUnlockAchievements(payload.userId, bus_js_1.DomainEvents.WATER_GOAL_MET);
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WEIGHT_LOGGED, async (payload) => {
    if (!payload?.userId)
        return;
    await checkAndUnlockAchievements(payload.userId, bus_js_1.DomainEvents.WEIGHT_LOGGED);
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.SUPPLEMENT_TAKEN, async (payload) => {
    if (!payload?.userId)
        return;
    await checkAndUnlockAchievements(payload.userId, bus_js_1.DomainEvents.SUPPLEMENT_TAKEN);
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WORKOUT_COMPLETED, async (payload) => {
    if (!payload?.userId)
        return;
    await checkAndUnlockAchievements(payload.userId, bus_js_1.DomainEvents.WORKOUT_COMPLETED);
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.USER_REGISTERED, async (payload) => {
    if (!payload?.userId)
        return;
    logger_js_1.logger.info({ userId: payload.userId }, 'User registered, checking welcome achievements');
});
logger_js_1.logger.info('Achievement subscribers registered');
//# sourceMappingURL=achievements.js.map