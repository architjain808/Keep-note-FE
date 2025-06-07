import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  
  handleError(error: any): void {
    // Log the error
    this.logError(error);
    
    // In development, re-throw the error to see it in console
    if (!environment.production) {
      throw error;
    }
  }

  private logError(error: any): void {
    const errorInfo = {
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (environment.enableDebugMode) {
      console.error('Global Error Handler:', errorInfo);
      console.error('Original error:', error);
    } else {
      console.error('Application Error:', errorInfo.message);
    }

    // Here you could send error to external logging service
    // this.sendToLoggingService(errorInfo);
  }

  private sendToLoggingService(errorInfo: any): void {
    // Implementation for sending errors to external service
    // Example: Sentry, LogRocket, etc.
    try {
      // fetch('/api/log-error', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // });
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError);
    }
  }
}
