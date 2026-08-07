"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvents = exports.eventBus = void 0;
class EventBus {
    subscriptions = new Map();
    subscribe(event, handler, once = false) {
        const subs = this.subscriptions.get(event) ?? [];
        subs.push({ handler, once });
        this.subscriptions.set(event, subs);
        return () => this.unsubscribe(event, handler);
    }
    unsubscribe(event, handler) {
        const subs = this.subscriptions.get(event);
        if (!subs)
            return;
        const idx = subs.findIndex((s) => s.handler === handler);
        if (idx !== -1)
            subs.splice(idx, 1);
    }
    async emit(event, payload) {
        const subs = this.subscriptions.get(event);
        if (!subs?.length)
            return;
        const toRemove = [];
        await Promise.all(subs.map(async (sub) => {
            try {
                await sub.handler(payload);
            }
            catch (error) {
                console.error(`Event handler error for ${event}:`, error);
            }
            if (sub.once)
                toRemove.push(sub);
        }));
        toRemove.forEach((sub) => this.unsubscribe(event, sub.handler));
    }
}
exports.eventBus = new EventBus();
exports.DomainEvents = {
    HABIT_LOGGED: 'habit.logged',
    HABIT_STREAK_ADVANCED: 'habit.streak_advanced',
    WATER_GOAL_MET: 'water.goal_met',
    WEIGHT_LOGGED: 'weight.logged',
    SUPPLEMENT_TAKEN: 'supplement.taken',
    WORKOUT_COMPLETED: 'workout.completed',
    SKINCARE_COMPLETED: 'skincare.completed',
    USER_REGISTERED: 'user.registered',
};
//# sourceMappingURL=bus.js.map