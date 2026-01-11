import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorInfo {
  message: string;
  type: 'http' | 'client' | 'server' | 'unknown';
  statusCode?: number;
  originalError?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  /**
   * Format error message for display to user
   */
  getErrorMessage(error: HttpErrorResponse | Error | any): string {
    if (error instanceof HttpErrorResponse) {
      return this.getHttpErrorMessage(error);
    }
    if (error instanceof Error) {
      return error.message || 'An unexpected error occurred';
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get user-friendly HTTP error message
   */
  private getHttpErrorMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'You are not authorized to perform this action. Please log in.';
      case 403:
        return 'You do not have permission to access this resource.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'The request timed out. Please try again.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'A server error occurred. Please try again later.';
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.';
      case 503:
        return 'Service unavailable. Please try again later.';
      case 504:
        return 'Gateway timeout. Please try again.';
      default:
        return error.error?.message || error.message || 'An error occurred. Please try again.';
    }
  }

  /**
   * Get error information for logging
   */
  getErrorInfo(error: HttpErrorResponse | Error | any): ErrorInfo {
    if (error instanceof HttpErrorResponse) {
      return {
        message: error.message,
        type: error.status >= 500 ? 'server' : error.status >= 400 ? 'client' : 'http',
        statusCode: error.status,
        originalError: error.error
      };
    }
    if (error instanceof Error) {
      return {
        message: error.message,
        type: 'unknown',
        originalError: error
      };
    }
    return {
      message: 'Unknown error',
      type: 'unknown',
      originalError: error
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: HttpErrorResponse | Error | any): boolean {
    if (error instanceof HttpErrorResponse) {
      // Retry on network errors, timeouts, and 5xx errors
      return (
        error.status === 0 ||
        error.status === 408 ||
        error.status === 429 ||
        (error.status >= 500 && error.status < 600)
      );
    }
    return false;
  }
}
