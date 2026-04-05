const { Queue, Worker } = require('bullmq');

const QUEUE_NAME = 'downloads';

class QueueService {
  constructor(config, onProcess, onFailed, logger) {
    this.logger = logger;
    this.config = config;

    const connection = config.redis || { host: '127.0.0.1', port: 6379 };

    this.queue = new Queue(QUEUE_NAME, { connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job) => onProcess(job),
      {
        connection,
        concurrency: config.queue?.concurrency || 3,
      }
    );

    this.worker.on('failed', (job, err) => {
      const remaining = (job.opts.attempts || 1) - job.attemptsMade;
      if (remaining > 0) {
        this.logger.download('download_retrying', {
          id: job.data.downloadId,
          attempt: job.attemptsMade,
          maxAttempts: job.opts.attempts,
          error: err.message,
        });
      } else {
        onFailed(job, err);
      }
    });

    this.worker.on('error', (err) => {
      this.logger.error('Queue worker error', { error: err.message });
    });

    this.logger.info('Queue service started', {
      concurrency: config.queue?.concurrency || 3,
      maxRetries: config.queue?.retries || 3,
    });
  }

  async addDownload(downloadData) {
    const job = await this.queue.add('download', downloadData, {
      attempts: this.config.queue?.retries || 3,
      backoff: {
        type: 'exponential',
        delay: this.config.queue?.retryDelay || 5000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
    return job.id;
  }

  async retryJob(jobId) {
    const job = await this.queue.getJob(jobId);
    if (!job) throw new Error('Job not found in queue');
    await job.retry('failed');
    return true;
  }

  async getQueueStatus() {
    const [waiting, active, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);
    return { waiting, active, failed, delayed };
  }

  async getFailedJobs() {
    return this.queue.getFailed();
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}

module.exports = QueueService;
