"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bus_js_1 = require("./bus.js");
const logger_js_1 = require("../config/logger.js");
async function scheduleNotification(payload) {
    // This is a stub - real implementation would:
    // 1. Fetch user's notification settings
    // 2. Check quiet hours
    // 3. Create notification document
    // 4. Schedule push via Expo/FCM
    logger_js_1.logger.debug({ payload }, 'Scheduling notification');
}
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.HABIT_LOGGED, async (payload) => {
    if (!payload?.userId)
        return;
    const { userId, habitId, streak } = payload;
    if (streak && streak > 1 && streak % 7 === 0) {
        await scheduleNotification({
            userId,
            templateKey: 'habit_streak_milestone',
            payload: { habitId, streak },
            deepLink: `glowtrack://habits/${habitId}`,
        });
    }
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WATER_GOAL_MET, async (payload) => {
    if (!payload?.userId)
        return;
    await scheduleNotification({
        userId: payload.userId,
        templateKey: 'water_goal_met',
        payload: {},
        deepLink: 'glowtrack://water',
    });
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.WEIGHT_LOGGED, async (payload) => {
    if (!payload?.userId)
        return;
    await scheduleNotification({
        userId: payload.userId,
        templateKey: 'weight_logged',
        payload: {},
        deepLink: 'glowtrack://weight',
    });
});
bus_js_1.eventBus.subscribe(bus_js_1.DomainEvents.USER_REGISTERED, async (payload) => {
    if (!payload?.userId)
        return;
    await scheduleNotification({
        userId: payload.userId,
        templateKey: 'welcome',
        payload: {},
        deepLink: 'glowtrack://onboarding',
    });
});
logger_js_1.logger.info('Notification subscribers registered');
//# sourceMappingURL=notifications.js.map