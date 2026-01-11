export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  elasticsearch: {
    endpoint: 'http://localhost:9200',
    apiKey: undefined,
    username: undefined,
    password: undefined,
    index: 'intranet-search-logs',
    batchSize: 50,
    flushInterval: 5000
  },
  appVersion: '1.0.0',
  buildDate: new Date().toISOString(),
  serviceName: 'intranet-search',
  logLevel: 'debug' as 'debug' | 'info' | 'warn' | 'error'
};
