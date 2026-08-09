"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerJob = registerJob;
exports.startJobs = startJobs;
exports.stopJobs = stopJobs;
exports.getJobs = getJobs;
const logger_js_1 = require("../config/logger.js");
const jobs = [];
function registerJob(job) {
    jobs.push(job);
    logger_js_1.logger.info({ name: job.name, intervalMs: job.intervalMs }, 'Job registered');
}
function startJobs() {
    jobs.forEach((job) => {
        job.timer = setInterval(async () => {
            try {
                await job.handler();
            }
            catch (error) {
                logger_js_1.logger.error({ error, job: job.name }, 'Job execution failed');
            }
        }, job.intervalMs);
        // Run once on start
        job.handler().catch((error) => logger_js_1.logger.error({ error, job: job.name }, 'Initial job run failed'));
        logger_js_1.logger.info({ name: job.name }, 'Job started');
    });
}
function stopJobs() {
    jobs.forEach((job) => {
        if (job.timer)
            clearInterval(job.timer);
    });
    logger_js_1.logger.info('All jobs stopped');
}
function getJobs() {
    return jobs;
}
//# sourceMappingURL=scheduler.js.map