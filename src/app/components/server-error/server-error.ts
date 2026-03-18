import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="error-page d-flex flex-column align-items-center justify-content-center min-vh-100 text-center p-4">
      <div class="error-code text-muted fw-bold">500</div>
      <h1 class="mt-2 mb-3">Internal Server Error</h1>
      <p class="text-muted mb-4">
        Something went wrong on our end. Please try again later.
      </p>
      <div class="d-flex gap-3">
        <button class="btn btn-outline-secondary btn-lg" (click)="reload()">
          <i class="fas fa-redo me-2"></i>Retry
        </button>
        <a routerLink="/dashboard" class="btn btn-primary btn-lg">
          <i class="fas fa-home me-2"></i>Back to Dashboard
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .error-page {
        background-color: #f8f9fa;
      }
      .error-code {
        font-size: 8rem;
        line-height: 1;
        color: #dee2e6;
      }
    `,
  ],
})
export class ServerErrorComponent {
  reload(): void {
    window.location.reload();
  }
}
