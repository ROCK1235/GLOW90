import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerJob, startJobs, stopJobs, getJobs, ScheduledJob } from '../src/jobs/scheduler.js';

describe('Job Scheduler Module', () => {
  beforeEach(() => {
    stopJobs();
  });

  afterEach(() => {
    stopJobs();
  });

  it('registers jobs into queue', () => {
    const initialCount = getJobs().length;
    const testJob: ScheduledJob = {
      name: 'test-job-register',
      intervalMs: 60000,
      handler: vi.fn().mockResolvedValue(undefined),
    };

    registerJob(testJob);

    expect(getJobs().length).toBe(initialCount + 1);
  });

  it('executes job handler initially when startJobs is invoked', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    registerJob({
      name: 'initial-run-job',
      intervalMs: 100000,
      handler,
    });

    startJobs();

    expect(handler).toHaveBeenCalled();
  });

  it('catches and logs errors during initial job execution', async () => {
    const faultyHandler = vi.fn().mockRejectedValue(new Error('Job run error'));
    registerJob({
      name: 'faulty-job',
      intervalMs: 100000,
      handler: faultyHandler,
    });

    expect(() => startJobs()).not.toThrow();
  });
});
