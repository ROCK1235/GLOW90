import { logger } from '../config/logger.js';

export interface ScheduledJob {
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  timer?: NodeJS.Timeout;
}

const jobs: ScheduledJob[] = [];

export function registerJob(job: ScheduledJob): void {
  jobs.push(job);
  logger.info({ name: job.name, intervalMs: job.intervalMs }, 'Job registered');
}

export function startJobs(): void {
  jobs.forEach((job) => {
    job.timer = setInterval(async () => {
      try {
        await job.handler();
      } catch (error) {
        logger.error({ error, job: job.name }, 'Job execution failed');
      }
    }, job.intervalMs);
    // Run once on start
    job.handler().catch((error) => logger.error({ error, job: job.name }, 'Initial job run failed'));
    logger.info({ name: job.name }, 'Job started');
  });
}

export function stopJobs(): void {
  jobs.forEach((job) => {
    if (job.timer) clearInterval(job.timer);
  });
  logger.info('All jobs stopped');
}

export function getJobs(): ScheduledJob[] {
  return jobs;
}