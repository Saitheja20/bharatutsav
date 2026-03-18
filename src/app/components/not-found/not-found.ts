import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="error-page d-flex flex-column align-items-center justify-content-center min-vh-100 text-center p-4">
      <div class="error-code text-muted fw-bold">404</div>
      <h1 class="mt-2 mb-3">Page Not Found</h1>
      <p class="text-muted mb-4">
        The page you are looking for does not exist or has been moved.
      </p>
      <a routerLink="/dashboard" class="btn btn-primary btn-lg">
        <i class="fas fa-home me-2"></i>Back to Dashboard
      </a>
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
export class NotFoundComponent {}
