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
 private authStateResolved = false; // Track if auth state is resolved

  // Subscriptions for cleanup
  // private subscriptions: Subscription[] = [];
  // ADD THIS LINE - Declare the missing property
  private authStateSubscription?: Subscription;

  // Subscriptions for cleanup
  private subscriptions: Subscription[] = [];

  // State
  currentUser: User | null = null;
  organizations: Organization[] = []; // Keep as array, subscribe to fill it
  selectedOrg: Organization | null = null;
  selectedOrgMembers: OrganizationMember[] = [];
  selectedOrgTransactions: OrganizationTransaction[] = []; // Keep as array
  userRole: string = 'viewer';
  // ✅ NEW: Join requests
  pendingJoinRequests: any[] = [];
  isLoadingJoinRequests = false;
  // Loading states
  isAuthLoading = true;
  isLoadingOrgs = true;
  isCreatingOrg = false;
  isLoadingMembers = false;
  isLoadingTransactions = false;
  isAddingMember = false;
  isAddingTransaction = false;


  joinOrgForm = {
    organizationCode: ''
  };



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
    // Use runInInjectionContext to avoid injection context warnings
    this.authStateSubscription = new Subscription();

    this.ngZone.run(() => {
      const unsubscribe = onAuthStateChanged(this.auth, async (user: User | null) => {
        this.isAuthLoading = false;

        if (!user) {
          this.router.navigate(['/login']);
          return;
        }

        console.log('✅ User authenticated:', user.uid);
        this.currentUser = user;
        this.subscribeToOrganizations();
      });

      // Store unsubscribe function
      this.authStateSubscription?.add(unsubscribe);
    });
  }

    ngOnDestroy(): void {
    this.authStateSubscription?.unsubscribe();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  // FIXED: Subscribe to real-time organization updates
  // subscribeToOrganizations(): void {
  //   this.isLoadingOrgs = true;

  //   // Subscribe to real-time updates and convert Observable to array
  //   const orgSub = this.organizationService.getUserOrganizations().subscribe({
  //     next: (organizations) => {
  //       console.log('Organizations received:', organizations);
  //       this.organizations = organizations; // Now this works - Observable data goes to array property
  //       this.isLoadingOrgs = false;

  //       // Auto-select first org if none selected
  //       if (this.organizations.length > 0 && !this.selectedOrg) {
  //         this.selectOrganization(this.organizations[0]);
  //       }
  //     },
  //     error: (error) => {
  //       console.error('Error loading organizations:', error);
  //       this.isLoadingOrgs = false;
  //     }
  //   });

  //   this.subscriptions.push(orgSub);
  // }


// subscribeToOrganizations(): void {
//   this.isLoadingOrgs = true;
//   console.log('🔄 Starting organization subscription...');

//   const orgSub = this.organizationService.getUserOrganizations().subscribe({
//     next: (organizations) => {
//       console.log('✅ Organizations received in component:', organizations);
//       console.log('👤 Current user ID:', this.currentUser?.uid);

//       this.organizations = organizations;
//       this.isLoadingOrgs = false;

//       if (this.organizations.length > 0 && !this.selectedOrg) {
//         console.log('🎯 Auto-selecting first organization:', this.organizations[0]);
//         this.selectOrganization(this.organizations[0]);
//       } else if (this.organizations.length === 0) {
//         console.warn('⚠️ No organizations found - check Firestore data');
//       }
//     },
//     error: (error) => {
//       console.error('❌ Error loading organizations:', error);
//       this.isLoadingOrgs = false;
//     }
//   });

//   this.subscriptions.push(orgSub);
// }


subscribeToOrganizations(): void {
  this.isLoadingOrgs = true;
  console.log('🔄 Starting organization subscription...');
  console.log('👤 Current user ID:', this.currentUser?.uid);

  // ✅ Add validation
  if (!this.currentUser?.uid) {
    console.error('❌ No authenticated user found');
    this.isLoadingOrgs = false;
    return;
  }

  const orgSub = this.organizationService.getUserOrganizations().subscribe({
    next: (organizations) => {
      console.log('✅ Organizations received:', organizations.length, 'items');
      console.log('📊 Organization data:', organizations);

      this.organizations = organizations;
      this.isLoadingOrgs = false;

      if (this.organizations.length > 0 && !this.selectedOrg) {
        console.log('🎯 Auto-selecting first organization:', this.organizations[0].name);
        this.selectOrganization(this.organizations[0]);
      } else if (this.organizations.length === 0) {
        console.warn('⚠️ No organizations found');
        console.log('🔍 Possible causes:');
        console.log('  1. Missing Firestore composite index');
        console.log('  2. User not in any organization members array');
        console.log('  3. Firestore security rules blocking access');
      }
    },

    error: (error) => {
      console.error('❌ Error loading organizations:', error);
      console.error('📝 Error details:', {
        code: error.code,
        message: error.message,
        userId: this.currentUser?.uid
      });

      this.isLoadingOrgs = false;

      // ✅ Specific error handling
      if (error.code === 'failed-precondition') {
        console.error('🔥 FIRESTORE INDEX REQUIRED!');
        console.error('📋 Click this link to create index:',
          'https://console.firebase.google.com/project/festival-ledger/firestore/indexes');
        alert('Database index required! Check console for link to create index.');
      } else if (error.code === 'permission-denied') {
        console.error('🔒 Permission denied - check Firestore security rules');
        alert('Permission denied. Check Firestore security rules.');
      }
    },

    complete: () => {
      console.log('✅ Organization subscription completed');
    }
  });

  this.subscriptions.push(orgSub);
}


  // subscribeToOrganizations(): void {
  //   // Only subscribe if auth state is resolved
  //   if (!this.authStateResolved) {
  //     console.log('⏳ Waiting for auth state to resolve...');
  //     return;
  //   }

  //   this.isLoadingOrgs = true;
  //   console.log('🔄 Starting organization subscription...');

  //   const orgSub = this.organizationService.getUserOrganizations().subscribe({
  //     next: (organizations) => {
  //       console.log('✅ Organizations received:', organizations.length);
  //       this.organizations = organizations;
  //       this.isLoadingOrgs = false;

  //       if (this.organizations.length > 0 && !this.selectedOrg) {
  //         this.selectOrganization(this.organizations[0]);
  //       }
  //     },
  //     error: (error) => {
  //       console.error('❌ Error loading organizations:', error);
  //       this.isLoadingOrgs = false;
  //     }
  //   });

  //   this.subscriptions.push(orgSub);
  // }
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

  // async selectOrganization(org: Organization): Promise<void> {
  //   this.selectedOrg = org;
  //   this.userRole = await this.organizationService.getUserRoleInOrganization(org.id) || 'viewer';
  //   await Promise.all([
  //     this.loadMembers(),
  //     this.loadTransactions()
  //   ]);
  // }
// Add this method to your component
async copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    alert('Organization code copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
  }
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

    // ✅ NEW: Join organization form

  // ✅ NEW: Join organization method
  // async joinOrganization(): Promise<void> {
  //   if (!this.joinOrgForm.organizationCode.trim()) {
  //     alert('Please enter organization code');
  //     return;
  //   }

  //   try {
  //     const message = await this.organizationService.requestToJoinOrganization(
  //       this.joinOrgForm.organizationCode
  //     );

  //     this.joinOrgForm.organizationCode = '';
  //     alert(message);
  //   } catch (error: any) {
  //     console.error('Error joining organization:', error);
  //     alert(error.message || 'Failed to join organization');
  //   }
  // }

  // // ✅ NEW: Load pending join requests (for admins)
  // async loadPendingJoinRequests(): Promise<void> {
  //   if (!this.selectedOrg || this.userRole !== 'admin') return;

  //   this.isLoadingJoinRequests = true;
  //   try {
  //     this.pendingJoinRequests = await this.organizationService.getPendingJoinRequests(
  //       this.selectedOrg.id
  //     );
  //   } catch (error) {
  //     console.error('Error loading join requests:', error);
  //   } finally {
  //     this.isLoadingJoinRequests = false;
  //   }
  // }

  // // ✅ NEW: Approve join request
  // async approveJoinRequest(userId: string): Promise<void> {
  //   if (!this.selectedOrg) return;

  //   try {
  //     const message = await this.organizationService.approveJoinRequest(
  //       this.selectedOrg.id,
  //       userId
  //     );

  //     alert(message);
  //     await this.loadPendingJoinRequests();
  //     await this.loadMembers(); // Refresh members list
  //   } catch (error: any) {
  //     console.error('Error approving request:', error);
  //     alert(error.message || 'Failed to approve request');
  //   }
  // }

  // // ✅ NEW: Reject join request
  // async rejectJoinRequest(userId: string): Promise<void> {
  //   if (!this.selectedOrg) return;

  //   if (confirm('Are you sure you want to reject this join request?')) {
  //     try {
  //       const message = await this.organizationService.rejectJoinRequest(
  //         this.selectedOrg.id,
  //         userId
  //       );

  //       alert(message);
  //       await this.loadPendingJoinRequests();
  //     } catch (error: any) {
  //       console.error('Error rejecting request:', error);
  //       alert(error.message || 'Failed to reject request');
  //     }
  //   }
  // }

  // // ✅ UPDATE: Load join requests when selecting organization
  // async selectOrganization(org: Organization): Promise<void> {
  //   this.selectedOrg = org;
  //   this.userRole = await this.organizationService.getUserRoleInOrganization(org.id) || 'viewer';
  //   await Promise.all([
  //     this.loadMembers(),
  //     this.loadTransactions(),
  //     this.loadPendingJoinRequests() // ✅ NEW
  //   ]);
  // }


// ✅ ADD these methods to your OrganizationsComponent

// Track function for *ngFor performance
trackByUserId(index: number, request: any): string {
  return request?.userId || index;
}

// ✅ ADD: Join organization method
async joinOrganization(): Promise<void> {
  if (!this.joinOrgForm.organizationCode.trim()) {
    alert('Please enter organization code');
    return;
  }

  try {
    const message = await this.organizationService.requestToJoinOrganization(
      this.joinOrgForm.organizationCode
    );

    this.joinOrgForm.organizationCode = '';
    alert(message);
  } catch (error: any) {
    console.error('Error joining organization:', error);
    alert(error.message || 'Failed to join organization');
  }
}

// ✅ ADD: Load pending join requests
async loadPendingJoinRequests(): Promise<void> {
  if (!this.selectedOrg || this.userRole !== 'admin') return;

  this.isLoadingJoinRequests = true;
  try {
    this.pendingJoinRequests = await this.organizationService.getPendingJoinRequests(
      this.selectedOrg.id
    );
  } catch (error) {
    console.error('Error loading join requests:', error);
    this.pendingJoinRequests = []; // Reset to empty array on error
  } finally {
    this.isLoadingJoinRequests = false;
  }
}

// ✅ ADD: Approve join request
async approveJoinRequest(userId: string): Promise<void> {
  if (!this.selectedOrg || !userId) return;

  try {
    const message = await this.organizationService.approveJoinRequest(
      this.selectedOrg.id,
      userId
    );

    alert(message);
    await this.loadPendingJoinRequests();
    await this.loadMembers(); // Refresh members list
  } catch (error: any) {
    console.error('Error approving request:', error);
    alert(error.message || 'Failed to approve request');
  }
}

// ✅ ADD: Reject join request
async rejectJoinRequest(userId: string): Promise<void> {
  if (!this.selectedOrg || !userId) return;

  if (confirm('Are you sure you want to reject this join request?')) {
    try {
      const message = await this.organizationService.rejectJoinRequest(
        this.selectedOrg.id,
        userId
      );

      alert(message);
      await this.loadPendingJoinRequests();
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      alert(error.message || 'Failed to reject request');
    }
  }
}

// ✅ UPDATE: Load join requests when selecting organization
async selectOrganization(org: Organization): Promise<void> {
  this.selectedOrg = org;
  this.userRole = await this.organizationService.getUserRoleInOrganization(org.id) || 'viewer';
  await Promise.all([
    this.loadMembers(),
    this.loadTransactions(),
    this.loadPendingJoinRequests() // ✅ ADD THIS
  ]);
}

async updateMemberRole(member: OrganizationMember): Promise<void> {
  if (this.userRole !== 'admin') {
    alert('Only admins can change member roles.');
    return;
  }

  if (!this.selectedOrg) {
    alert('No organization selected.');
    return;
  }

  try {
    // Call your service to update role
    await this.organizationService.updateMemberRole(this.selectedOrg.id, member.userId, member.role);
    alert(`Role updated to ${member.role} for ${member.displayName || member.email}`);
    // Optionally reload members list to sync with backend state
    await this.loadMembers();
  } catch (error) {
    console.error('Error updating member role:', error);
    alert('Failed to update member role.');
  }
}

}
