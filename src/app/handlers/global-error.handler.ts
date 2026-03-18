import { ErrorHandler, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);
  private router = inject(Router);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error('Unhandled application error', message, error);

    // Navigate to 500 page for critical unhandled errors
    if (error instanceof Error && !this.isKnownNonCritical(error)) {
      try {
        this.router.navigate(['/500']);
      } catch {
        // If router navigation itself fails, fall back to a hard redirect
        window.location.href = '/500';
      }
    }
  }

  private isKnownNonCritical(error: Error): boolean {
    // Ignore errors caused by route navigation cancellations
    return error.message.includes('Navigation cancelled');
  }
}
