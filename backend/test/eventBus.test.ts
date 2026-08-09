import { describe, it, expect, vi } from 'vitest';
import { eventBus, DomainEvents } from '../src/events/bus.js';

describe('EventBus Module', () => {
  it('registers subscriber and triggers handler when event is emitted', async () => {
    const handler = vi.fn();
    const unsub = eventBus.subscribe('test.event', handler);

    await eventBus.emit('test.event', { foo: 'bar' });

    expect(handler).toHaveBeenCalledWith({ foo: 'bar' });
    unsub();
  });

  it('unsubscribes handler cleanly', async () => {
    const handler = vi.fn();
    const unsub = eventBus.subscribe('test.unsub', handler);

    unsub();
    await eventBus.emit('test.unsub', { foo: 'bar' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('handles "once" subscriptions and removes listener after single emit', async () => {
    const handler = vi.fn();
    eventBus.subscribe('test.once', handler, true);

    await eventBus.emit('test.once', { count: 1 });
    await eventBus.emit('test.once', { count: 2 });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ count: 1 });
  });

  it('isolates errors in handlers so other subscribers continue executing', async () => {
    const faultyHandler = vi.fn().mockRejectedValue(new Error('Handler crashed'));
    const goodHandler = vi.fn();

    const unsub1 = eventBus.subscribe('test.error_isolation', faultyHandler);
    const unsub2 = eventBus.subscribe('test.error_isolation', goodHandler);

    await expect(eventBus.emit('test.error_isolation', {})).resolves.not.toThrow();

    expect(faultyHandler).toHaveBeenCalled();
    expect(goodHandler).toHaveBeenCalled();

    unsub1();
    unsub2();
  });
});
