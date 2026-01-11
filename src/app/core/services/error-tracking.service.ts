import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ElasticLoggingService } from './elastic-logging.service';
import { createECSEvent, createECSErrorEvent, ECSEventDocument } from '../models/ecs-event.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorTrackingService {
  constructor(
    private elasticLogging: ElasticLoggingService,
    private router: Router
  ) {}

  /**
   * Log error to Elasticsearch in ECS format
   */
  logError(error: Error | HttpErrorResponse | any, context?: Record<string, any>): void {
    const event = this.createErrorEvent(error, context);
    this.elasticLogging.logEvent(event);
  }

  /**
   * Log unhandled error
   */
  logUnhandledError(error: Error, context?: Record<string, any>): void {
    const event = this.createErrorEvent(error, {
      ...context,
      'app.error.unhandled': true
    });
    this.elasticLogging.logEvent(event);
  }

  /**
   * Log promise rejection
   */
  logPromiseRejection(reason: any, context?: Record<string, any>): void {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    const event = this.createErrorEvent(error, {
      ...context,
      'app.error.promise_rejection': true
    });
    this.elasticLogging.logEvent(event);
  }

  /**
   * Create ECS error event
   */
  private createErrorEvent(
    error: Error | HttpErrorResponse | any,
    additionalContext?: Record<string, any>
  ): ECSEventDocument {
    const currentRoute = this.router.url;
    const baseContext: Record<string, any> = {
      'app.route': currentRoute,
      'app.user_agent': typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...additionalContext
    };

    if (error instanceof HttpErrorResponse) {
      return createECSEvent(
        'http_error',
        'error',
        'error',
        environment.serviceName,
        environment.appVersion,
        environment.production ? 'production' : 'development',
        {
          'event.outcome': 'failure',
          'error.message': error.message,
          'error.type': `HTTP_${error.status}`,
          'error.code': error.status.toString(),
          'http.request.method': error.url ? 'GET' : 'POST', // Approximate
          'http.request.url': error.url || '',
          'http.response.status_code': error.status,
          'log.level': 'error',
          ...baseContext
        }
      );
    }

    if (error instanceof Error) {
      return createECSErrorEvent(
        error,
        environment.serviceName,
        environment.appVersion,
        environment.production ? 'production' : 'development',
        baseContext
      );
    }

    // Fallback for unknown error types
    return createECSEvent(
      'error',
      'error',
      'error',
      environment.serviceName,
      environment.appVersion,
      environment.production ? 'production' : 'development',
      {
        'event.outcome': 'failure',
        'error.message': String(error),
        'error.type': 'UnknownError',
        'log.level': 'error',
        ...baseContext
      }
    );
  }
}
