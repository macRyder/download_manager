module.exports = {
  PORT: 5000,
  BASE_DOWNLOAD_DIR: '/home/hp_server/media',
  DEFAULT_CONNECTIONS: 4,
  ARIA2C_OPTIONS: {
    maxConnections: 4,
    split: 4,
    minSplitSize: '1M',
    continueDownload: true
  },
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  queue: {
    concurrency: 3,     // max simultaneous downloads
    retries: 3,          // retry failed downloads up to 3 times
    retryDelay: 5000,    // initial backoff 5s (exponential: 5s, 10s, 20s)
  },
};
