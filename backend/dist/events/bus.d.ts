type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;
declare class EventBus {
    private subscriptions;
    subscribe(event: string, handler: EventHandler, once?: boolean): () => void;
    unsubscribe(event: string, handler: EventHandler): void;
    emit<T>(event: string, payload: T): Promise<void>;
}
export declare const eventBus: EventBus;
export declare const DomainEvents: {
    readonly HABIT_LOGGED: "habit.logged";
    readonly HABIT_STREAK_ADVANCED: "habit.streak_advanced";
    readonly WATER_GOAL_MET: "water.goal_met";
    readonly WEIGHT_LOGGED: "weight.logged";
    readonly SUPPLEMENT_TAKEN: "supplement.taken";
    readonly WORKOUT_COMPLETED: "workout.completed";
    readonly SKINCARE_COMPLETED: "skincare.completed";
    readonly USER_REGISTERED: "user.registered";
};
export type DomainEvent = (typeof DomainEvents)[keyof typeof DomainEvents];
export {};
//# sourceMappingURL=bus.d.ts.map