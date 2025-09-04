import { Component, OnInit, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Timestamp } from 'firebase/firestore';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { OrganizationService } from '../../services/organization.service';
import { Organization, OrganizationMember, OrganizationTransaction } from '../../interfaces/organization.interface';
import { NavigationComponent } from '../navigation/navigation';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BaseChartDirective, NavigationComponent],
  templateUrl: './organization.html',
  styleUrls: ['./organization.css']
})
export class OrganizationsComponent implements OnInit {
  private auth = inject(Auth);
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private organizationService = inject(OrganizationService);

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // State
  currentUser: User | null = null;
  organizations: Organization[] = []; // Keep as array, subscribe to fill it
  selectedOrg: Organization | null = null;
  selectedOrgMembers: OrganizationMember[] = [];
  selectedOrgTransactions: OrganizationTransaction[] = []; // Keep as array
  userRole: string = 'viewer';

  // Loading states
  isAuthLoading = true;
  isLoadingOrgs = true;
  isCreatingOrg = false;
  isLoadingMembers = false;
  isLoadingTransactions = false;
  isAddingMember = false;
  isAddingTransaction = false;

  // Forms
  newOrg = {
    name: '',
    description: ''
  };

  newMember = {
    email: '',
    displayName: '',
    role: 'viewer'
  };

  newTransaction = {
    type: 'credit',
    amount: 0,
    note: ''
  };

  // Charts
  pieChartData: ChartData<'pie'> = {
    labels: ['Credits', 'Debits'],
    datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'] }]
  };
  pieChartType: ChartType = 'pie';

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Credits', backgroundColor: '#28a745' },
      { data: [], label: 'Debits', backgroundColor: '#dc3545' }
    ]
  };
  barChartType: ChartType = 'bar';

  // Summary
  totalCredits = 0;
  totalDebits = 0;
  currentBalance = 0;

  ngOnInit(): void {
    this.ngZone.run(() => {
      onAuthStateChanged(this.auth, async (user: User | null) => {
        this.isAuthLoading = false;

        if (!user) {
          this.router.navigate(['/login']);
          return;
        }

        this.currentUser = user;
        this.subscribeToOrganizations();
      });
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // FIXED: Subscribe to real-time organization updates
  subscribeToOrganizations(): void {
    this.isLoadingOrgs = true;

    // Subscribe to real-time updates and convert Observable to array
    const orgSub = this.organizationService.getUserOrganizations().subscribe({
      next: (organizations) => {
        console.log('Organizations received:', organizations);
        this.organizations = organizations; // Now this works - Observable data goes to array property
        this.isLoadingOrgs = false;

        // Auto-select first org if none selected
        if (this.organizations.length > 0 && !this.selectedOrg) {
          this.selectOrganization(this.organizations[0]);
        }
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
        this.isLoadingOrgs = false;
      }
    });

    this.subscriptions.push(orgSub);
  }

  async createOrganization(): Promise<void> {
    if (!this.newOrg.name.trim()) {
      alert('Organization name is required');
      return;
    }

    this.isCreatingOrg = true;
    try {
      const orgId = await this.organizationService.createOrganization({
        name: this.newOrg.name,
        description: this.newOrg.description
      });

      console.log('Organization created with ID:', orgId);
      this.newOrg = { name: '', description: '' };
      alert('Organization created successfully!');

      // Real-time subscription will automatically update the list
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    } finally {
      this.isCreatingOrg = false;
    }
  }

  async selectOrganization(org: Organization): Promise<void> {
    this.selectedOrg = org;
    this.userRole = await this.organizationService.getUserRoleInOrganization(org.id) || 'viewer';
    await Promise.all([
      this.loadMembers(),
      this.loadTransactions()
    ]);
  }

  async loadMembers(): Promise<void> {
    if (!this.selectedOrg) return;

    this.isLoadingMembers = true;
    try {
      this.selectedOrgMembers = await this.organizationService.getOrganizationMembers(this.selectedOrg.id);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      this.isLoadingMembers = false;
    }
  }

  // FIXED: Properly handle Observable to array conversion
  async loadTransactions(): Promise<void> {
    if (!this.selectedOrg) return;

    this.isLoadingTransactions = true;
    try {
      // Convert Observable to Promise, get first emission, then assign to array
      this.selectedOrgTransactions = await this.organizationService
        .getOrganizationTransactions(this.selectedOrg.id)
        .pipe(take(1))
        .toPromise() || [];

      this.updateFinancialSummary();
    } catch (error) {
      console.error('Error loading transactions:', error);
      this.selectedOrgTransactions = [];
    } finally {
      this.isLoadingTransactions = false;
    }
  }

  // ALTERNATIVE: Use subscription for real-time transaction updates
  subscribeToTransactions(): void {
    if (!this.selectedOrg) return;

    this.isLoadingTransactions = true;

    const transactionSub = this.organizationService
      .getOrganizationTransactions(this.selectedOrg.id)
      .subscribe({
        next: (transactions) => {
          this.selectedOrgTransactions = transactions;
          this.isLoadingTransactions = false;
          this.updateFinancialSummary();
        },
        error: (error) => {
          console.error('Error loading transactions:', error);
          this.isLoadingTransactions = false;
        }
      });

    this.subscriptions.push(transactionSub);
  }

  async addMember(): Promise<void> {
    if (!this.selectedOrg || !this.newMember.email.trim()) {
      alert('Email is required');
      return;
    }

    if (this.userRole !== 'admin') {
      alert('Only admins can add members');
      return;
    }

    this.isAddingMember = true;
    try {
      await this.organizationService.addMemberToOrganization(this.selectedOrg.id, {
        userId: this.newMember.email,
        email: this.newMember.email,
        displayName: this.newMember.displayName || this.newMember.email,
        role: this.newMember.role as 'admin' | 'editor' | 'viewer'
      });

      this.newMember = { email: '', displayName: '', role: 'viewer' };
      await this.loadMembers();
      alert('Member added successfully!');
    } catch (error) {
      console.error('Error adding member:', error);
      alert('Failed to add member');
    } finally {
      this.isAddingMember = false;
    }
  }

  async addTransaction(): Promise<void> {
    if (!this.selectedOrg || !this.newTransaction.note.trim() || this.newTransaction.amount <= 0) {
      alert('Please fill all required fields');
      return;
    }

    if (this.userRole === 'viewer') {
      alert('You do not have permission to add transactions');
      return;
    }

    this.isAddingTransaction = true;
    try {
      await this.organizationService.createOrganizationTransaction(this.selectedOrg.id, {
        type: this.newTransaction.type as 'credit' | 'debit',
        amount: this.newTransaction.amount,
        note: this.newTransaction.note
      });

      this.newTransaction = { type: 'credit', amount: 0, note: '' };

      // Reload transactions to see the new one
      await this.loadTransactions();
      alert('Transaction added successfully!');
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to add transaction');
    } finally {
      this.isAddingTransaction = false;
    }
  }

  updateFinancialSummary(): void {
    this.totalCredits = this.selectedOrgTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    this.totalDebits = this.selectedOrgTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    this.currentBalance = this.totalCredits - this.totalDebits;

    // Update charts
    this.pieChartData = {
      labels: ['Credits', 'Debits'],
      datasets: [{
        data: [this.totalCredits, this.totalDebits],
        backgroundColor: ['#28a745', '#dc3545']
      }]
    };

    // Create daily data for bar chart (last 7 days)
    const dailyData = this.getDailyTransactionData();
    this.barChartData = {
      labels: dailyData.dates,
      datasets: [
        {
          label: 'Credits',
          data: dailyData.credits,
          backgroundColor: '#28a745'
        },
        {
          label: 'Debits',
          data: dailyData.debits,
          backgroundColor: '#dc3545'
        }
      ]
    };
  }

  getDailyTransactionData() {
    const last7Days = [];
    const credits = [];
    const debits = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toLocaleDateString();
      last7Days.push(dateString);

      const dayCredits = this.selectedOrgTransactions
        .filter(t => t.type === 'credit' && this.toDate(t.createdAt).toLocaleDateString() === dateString)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayDebits = this.selectedOrgTransactions
        .filter(t => t.type === 'debit' && this.toDate(t.createdAt).toLocaleDateString() === dateString)
        .reduce((sum, t) => sum + t.amount, 0);

      credits.push(dayCredits);
      debits.push(dayDebits);
    }

    return { dates: last7Days, credits, debits };
  }

  toDate(timestamp: Timestamp | any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date();
  }

  async removeMember(member: OrganizationMember): Promise<void> {
    if (this.userRole !== 'admin') {
      alert('Only admins can remove members');
      return;
    }

    if (confirm(`Are you sure you want to remove ${member.displayName}?`)) {
      try {
        await this.organizationService.removeMemberFromOrganization(this.selectedOrg!.id, member.id);
        await this.loadMembers();
        alert('Member removed successfully!');
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member');
      }
    }
  }

  async deleteTransaction(transaction: OrganizationTransaction): Promise<void> {
    if (this.userRole === 'viewer') {
      alert('You do not have permission to delete transactions');
      return;
    }

    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await this.organizationService.deleteOrganizationTransaction(this.selectedOrg!.id, transaction.id);
        await this.loadTransactions(); // Reload to refresh the list
        alert('Transaction deleted successfully!');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  }
}
