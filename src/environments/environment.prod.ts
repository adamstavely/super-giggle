export const environment = {
  production: true,
  apiUrl: '/api',
  elasticsearch: {
    endpoint: process.env['ELASTICSEARCH_ENDPOINT'] || 'https://elasticsearch.example.com',
    apiKey: process.env['ELASTICSEARCH_API_KEY'],
    username: process.env['ELASTICSEARCH_USERNAME'],
    password: process.env['ELASTICSEARCH_PASSWORD'],
    index: process.env['ELASTICSEARCH_INDEX'] || 'intranet-search-logs',
    batchSize: 100,
    flushInterval: 3000
  },
  appVersion: '1.0.0',
  buildDate: new Date().toISOString(),
  serviceName: 'intranet-search',
  logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error'
};
