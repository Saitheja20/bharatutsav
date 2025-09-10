import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

import { ChandaBookService } from '../../services/chanda-book.service';
import { OrganizationService } from '../../services/organization.service';
import { ChandaBook, Donation, DonationStats } from '../../interfaces/chanda-book.interface';
import { Organization } from '../../interfaces/organization.interface';

@Component({
  selector: 'app-chanda-book',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="container mt-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-12">
          <h2><i class="fas fa-book me-2"></i>Chanda Book Management</h2>
        </div>
      </div>

      <!-- Auth Loading State -->
      <div class="row" *ngIf="isAuthLoading">
        <div class="col-12">
          <div class="card">
            <div class="card-body text-center py-5">
              <i class="fas fa-spinner fa-spin fa-3x text-primary mb-3"></i>
              <h5>Loading...</h5>
              <p class="text-muted">Checking authentication status...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No User State -->
      <div class="row" *ngIf="!isAuthLoading && !currentUser">
        <div class="col-12">
          <div class="alert alert-warning text-center">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h5>Authentication Required</h5>
            <p>Please log in to access the Chanda Book management.</p>
            <button class="btn btn-primary" (click)="goToLogin()">
              <i class="fas fa-sign-in-alt me-2"></i>Go to Login
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div *ngIf="!isAuthLoading && currentUser">
        <!-- Loading Organizations -->
        <div class="row mb-4" *ngIf="isLoadingOrgs">
          <div class="col-12">
            <div class="card">
              <div class="card-body text-center py-4">
                <i class="fas fa-spinner fa-spin fa-2x text-primary mb-3"></i>
                <h6>Loading Organizations...</h6>
              </div>
            </div>
          </div>
        </div>

        <!-- No Organizations -->
        <div class="row mb-4" *ngIf="!isLoadingOrgs && organizations.length === 0">
          <div class="col-12">
            <div class="alert alert-info text-center">
              <i class="fas fa-building fa-2x mb-3"></i>
              <h5>No Organizations Found</h5>
              <p>You need to be a member of an organization to use Chanda Book.</p>
              <button class="btn btn-primary" routerLink="/organizations">
                <i class="fas fa-plus me-2"></i>Create or Join Organization
              </button>
            </div>
          </div>
        </div>

        <!-- Organization Selection -->
        <div class="row mb-4" *ngIf="!isLoadingOrgs && organizations.length > 0">
          <div class="col-12">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">Select Organization</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3 mb-2" *ngFor="let org of organizations">
                    <div class="card h-100"
                         [class.border-primary]="selectedOrg?.id === org.id"
                         (click)="selectOrganization(org)"
                         style="cursor: pointer;">
                      <div class="card-body text-center">
                        <i class="fas fa-building fa-2x mb-2 text-primary"></i>
                        <h6>{{ org.name }}</h6>
                        <span *ngIf="selectedOrg?.id === org.id"
                              class="badge bg-primary">Selected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Success Message -->
        <div class="row" *ngIf="selectedOrg">
          <div class="col-12">
            <div class="alert alert-success">
              <i class="fas fa-check-circle me-2"></i>
              <strong>{{ selectedOrg.name }}</strong> selected successfully!
              Chanda Book functionality will be available soon.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }
    .fa-spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ChandaBookComponentss implements OnInit, OnDestroy {
  private chandaBookService = inject(ChandaBookService);
  private organizationService = inject(OrganizationService);
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  private router = inject(Router);

  // Authentication state
  currentUser: User | null = null;
  isAuthLoading = true;
  private authStateSubscription?: () => void;
  private subscriptions: Subscription[] = [];

  // State
  organizations: Organization[] = [];
  selectedOrg: Organization | null = null;
  isLoadingOrgs = false;

  ngOnInit() {
    console.log('🔄 ChandaBook component initializing...');

    this.authStateSubscription = onAuthStateChanged(this.auth, async (user: User | null) => {
      console.log('🔐 Auth state changed. User:', user ? user.uid : 'null');

      this.isAuthLoading = false;
      this.currentUser = user;

      if (!user) {
        console.log('❌ No authenticated user');
        return;
      }

      console.log('✅ User authenticated, loading organizations...');
      await this.loadUserOrganizations(user.uid);
    });
  }

  ngOnDestroy() {
    if (this.authStateSubscription) {
      this.authStateSubscription();
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  async loadUserOrganizations(userId: string) {
    this.isLoadingOrgs = true;
    console.log('📊 Loading organizations for user:', userId);

    try {
      const subscription = this.organizationService.getUserOrganizations(userId).subscribe({
        next: (orgs) => {
          console.log('✅ Organizations loaded:', orgs.length);
          this.organizations = orgs;
          this.isLoadingOrgs = false;

          if (orgs.length > 0 && !this.selectedOrg) {
            this.selectOrganization(orgs[0]);
          }
        },
        error: (error) => {
          console.error('❌ Error loading organizations:', error);
          this.isLoadingOrgs = false;
        }
      });

      this.subscriptions.push(subscription);
    } catch (error) {
      console.error('❌ Exception in loadUserOrganizations:', error);
      this.isLoadingOrgs = false;
    }
  }

  selectOrganization(org: Organization) {
    this.selectedOrg = org;
    console.log('🎯 Organization selected:', org.name);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
