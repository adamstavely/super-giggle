import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { ErrorService } from '../services/error.service';
import { ErrorTrackingService } from '../services/error-tracking.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorTracking?: ErrorTrackingService;

  constructor(
    private injector: Injector,
    private errorService: ErrorService
  ) {}

  handleError(error: any): void {
    const router = this.injector.get(Router);
    const errorInfo = this.errorService.getErrorInfo(error);

    // Get current route for context
    const currentRoute = router.url;

    // Log error with full context
    console.error('Global Error Handler:', {
      error: errorInfo,
      route: currentRoute,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      stack: error?.stack
    });

    // Get error tracking service (lazy injection to avoid circular dependencies)
    if (!this.errorTracking) {
      try {
        this.errorTracking = this.injector.get(ErrorTrackingService);
      } catch (e) {
        console.warn('ErrorTrackingService not available');
      }
    }

    // Log to Elasticsearch via error tracking service
    if (this.errorTracking) {
      this.errorTracking.logUnhandledError(
        error instanceof Error ? error : new Error(String(error)),
        {
          'app.route': currentRoute,
          'app.error.handler': 'global'
        }
      );
    }
  }
}
