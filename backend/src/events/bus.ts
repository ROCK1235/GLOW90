type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

interface Subscription {
  handler: EventHandler;
  once?: boolean;
}

class EventBus {
  private subscriptions = new Map<string, Subscription[]>();

  subscribe(event: string, handler: EventHandler, once = false): () => void {
    const subs = this.subscriptions.get(event) ?? [];
    subs.push({ handler, once });
    this.subscriptions.set(event, subs);

    return () => this.unsubscribe(event, handler);
  }

  unsubscribe(event: string, handler: EventHandler): void {
    const subs = this.subscriptions.get(event);
    if (!subs) return;
    const idx = subs.findIndex((s) => s.handler === handler);
    if (idx !== -1) subs.splice(idx, 1);
  }

  async emit<T>(event: string, payload: T): Promise<void> {
    const subs = this.subscriptions.get(event);
    if (!subs?.length) return;

    const toRemove: Subscription[] = [];
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await sub.handler(payload);
        } catch (error) {
          console.error(`Event handler error for ${event}:`, error);
        }
        if (sub.once) toRemove.push(sub);
      })
    );

    toRemove.forEach((sub) => this.unsubscribe(event, sub.handler));
  }
}

export const eventBus = new EventBus();

export const DomainEvents = {
  HABIT_LOGGED: 'habit.logged',
  HABIT_STREAK_ADVANCED: 'habit.streak_advanced',
  WATER_GOAL_MET: 'water.goal_met',
  WEIGHT_LOGGED: 'weight.logged',
  SUPPLEMENT_TAKEN: 'supplement.taken',
  WORKOUT_COMPLETED: 'workout.completed',
  SKINCARE_COMPLETED: 'skincare.completed',
  USER_REGISTERED: 'user.registered',
} as const;

export type DomainEvent = (typeof DomainEvents)[keyof typeof DomainEvents];