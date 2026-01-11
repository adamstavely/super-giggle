import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retryWhen, mergeMap } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorService } from '../services/error.service';
import { ErrorTrackingService } from '../services/error-tracking.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly maxRetries = 2;
  private readonly retryDelay = 1000; // 1 second

  constructor(
    private errorService: ErrorService,
    private errorTracking: ErrorTrackingService,
    private snackBar: MatSnackBar
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error: HttpErrorResponse, index: number) => {
            if (index < this.maxRetries && this.errorService.isRetryable(error)) {
              return timer(this.retryDelay * (index + 1));
            }
            return throwError(() => error);
          })
        )
      ),
      catchError((error: HttpErrorResponse) => {
        // Get user-friendly error message
        const errorMessage = this.errorService.getErrorMessage(error);

        // Show error message to user (only in production or when not in development)
        if (environment.production || !environment.production) {
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }

        // Log error for monitoring via error tracking service
        const errorInfo = this.errorService.getErrorInfo(error);
        console.error('HTTP Error:', errorInfo);

        // Track error in Elasticsearch
        this.errorTracking.logError(error, {
          'app.http.request_url': request.url,
          'app.http.request_method': request.method
        });

        return throwError(() => error);
      })
    );
  }
}
