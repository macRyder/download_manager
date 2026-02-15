module.exports = {
  PORT: 5000,
  WS_PORT: 5001,
  BASE_DOWNLOAD_DIR: '/home/hp_server/media',
  DEFAULT_CONNECTIONS: 4,
  ARIA2C_OPTIONS: {
    maxConnections: 4,
    split: 4,
    minSplitSize: '1M',
    continueDownload: true
  }
};
