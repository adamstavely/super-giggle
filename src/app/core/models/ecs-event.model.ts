/**
 * Elastic Common Schema (ECS) Event Models
 * Reference: https://www.elastic.co/guide/en/ecs/current/index.html
 */

export interface ECSBase {
  '@timestamp': string; // ISO 8601 format
  'ecs.version': string; // ECS schema version
  'service.name': string;
  'service.version': string;
  'service.environment': string;
  'host.name'?: string;
  'host.os.name'?: string;
  'user.id'?: string;
  'user.name'?: string;
  'user.email'?: string;
}

export interface ECSEvent {
  'event.action': string;
  'event.category': string[];
  'event.type': string[];
  'event.outcome'?: 'success' | 'failure' | 'unknown';
  'event.duration'?: number; // nanoseconds
  'event.id'?: string;
  'event.dataset'?: string;
}

export interface ECSError {
  'error.message'?: string;
  'error.type'?: string;
  'error.stack_trace'?: string;
  'error.code'?: string;
}

export interface ECSHTTP {
  'http.request.method'?: string;
  'http.request.url'?: string;
  'http.request.body.bytes'?: number;
  'http.response.status_code'?: number;
  'http.response.body.bytes'?: number;
  'http.response.mime_type'?: string;
}

export interface ECSLog {
  'log.level'?: 'debug' | 'info' | 'warn' | 'error';
  'log.logger'?: string;
}

export interface ECSApplication {
  'app.search.query'?: string;
  'app.search.result_count'?: number;
  'app.search.page'?: number;
  'app.search.filters'?: Record<string, any>;
  'app.route'?: string;
  'app.user_agent'?: string;
  [key: string]: any; // Allow custom app fields
}

/**
 * Complete ECS Event
 */
export interface ECSEventDocument extends ECSBase, ECSEvent, Partial<ECSError>, Partial<ECSHTTP>, Partial<ECSLog>, Partial<ECSApplication> {}

/**
 * Helper function to create ECS-compliant event
 */
export function createECSEvent(
  action: string,
  category: string | string[],
  type: string | string[],
  serviceName: string,
  serviceVersion: string,
  environment: string,
  additionalFields?: Partial<ECSEventDocument>
): ECSEventDocument {
  const categories = Array.isArray(category) ? category : [category];
  const types = Array.isArray(type) ? type : [type];

  return {
    '@timestamp': new Date().toISOString(),
    'ecs.version': '8.0.0',
    'service.name': serviceName,
    'service.version': serviceVersion,
    'service.environment': environment,
    'event.action': action,
    'event.category': categories,
    'event.type': types,
    'host.name': typeof window !== 'undefined' ? window.location.hostname : undefined,
    'app.user_agent': typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    ...additionalFields
  };
}

/**
 * Create ECS error event
 */
export function createECSErrorEvent(
  error: Error,
  serviceName: string,
  serviceVersion: string,
  environment: string,
  additionalFields?: Partial<ECSEventDocument>
): ECSEventDocument {
  return createECSEvent(
    'error',
    'error',
    'error',
    serviceName,
    serviceVersion,
    environment,
    {
      'event.outcome': 'failure',
      'error.message': error.message,
      'error.type': error.name,
      'error.stack_trace': error.stack,
      'log.level': 'error',
      ...additionalFields
    }
  );
}

/**
 * Create ECS HTTP event
 */
export function createECSHTTPEvent(
  method: string,
  url: string,
  statusCode: number,
  serviceName: string,
  serviceVersion: string,
  environment: string,
  additionalFields?: Partial<ECSEventDocument>
): ECSEventDocument {
  return createECSEvent(
    'http_request',
    'web',
    'access',
    serviceName,
    serviceVersion,
    environment,
    {
      'event.outcome': statusCode >= 200 && statusCode < 400 ? 'success' : 'failure',
      'http.request.method': method,
      'http.request.url': url,
      'http.response.status_code': statusCode,
      ...additionalFields
    }
  );
}
