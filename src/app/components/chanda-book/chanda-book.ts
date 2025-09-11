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
import { NavigationComponent } from '../navigation/navigation';
@Component({
  selector: 'app-chanda-book',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, NavigationComponent],
  templateUrl: './chanda-book.html',
  styleUrls: ['./chanda-book.css']
})
export class ChandaBookComponent implements OnInit, OnDestroy {
  private chandaBookService = inject(ChandaBookService);
  private organizationService = inject(OrganizationService);
  private fb = inject(FormBuilder);
  private auth = inject(Auth);
  //private router = inject(Router);

  // Authentication state
  currentUser: User | null = null;
  isAuthLoading = true;
  private authStateSubscription?: () => void;
  private subscriptions: Subscription[] = [];

  // Data state
  organizations: Organization[] = [];
  selectedOrg: Organization | null = null;
  chandaBook: ChandaBook | null = null;
  recentDonations: Donation[] = [];
  donationStats: DonationStats[] = [];

  // Forms
  donationForm: FormGroup;
  chandaBookForm: FormGroup;

  // Loading states
  isLoadingOrgs = false;
  isLoadingChandaBook = false;
  isAddingDonation = false;
  isCreatingChandaBook = false;

  // Modal states
  showReceiptModal = false;
  lastDonation: Donation | null = null;

  // ADD THIS LINE:
selectedDonation: Donation | null = null;

  constructor(private router: Router) {
    console.log('🎯 ChandaBookComponent constructor called');

    this.donationForm = this.fb.group({
      category: ['donation', Validators.required],
      donorName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      address: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      paymentMethod: ['cash', Validators.required],
      notes: ['']
    });

    this.chandaBookForm = this.fb.group({
      targetedAmount: ['', [Validators.required, Validators.min(1000)]],
      organizationLogo: ['']
    });

    console.log('✅ Forms initialized successfully');
  }

  ngOnInit() {
    console.log('🚀 ChandaBookComponent ngOnInit started');

    this.authStateSubscription = onAuthStateChanged(this.auth, async (user: User | null) => {
      console.log('🔐 Auth state changed. User:', user ? user.uid : 'null');

      this.isAuthLoading = false;
      this.currentUser = user;

      if (!user) {
        console.log('❌ No authenticated user, redirecting to login');
        this.router.navigate(['/login']);
        return;
      }

      console.log('✅ User authenticated:', user.email);
      console.log('📱 Loading organizations for user...');
      await this.loadUserOrganizations(user.uid);
    });
  }

  ngOnDestroy() {
    console.log('🛑 ChandaBookComponent destroying...');

    if (this.authStateSubscription) {
      this.authStateSubscription();
      console.log('✅ Auth subscription cleaned up');
    }

    this.subscriptions.forEach(sub => sub.unsubscribe());
    console.log('✅ All subscriptions cleaned up');
  }

  async loadUserOrganizations(userId: string) {
    this.isLoadingOrgs = true;
    console.log('📊 Loading organizations for user:', userId);

    // Add timeout safety
    const timeout = setTimeout(() => {
      console.warn('⏰ Organization loading timeout after 15 seconds');
      this.isLoadingOrgs = false;
    }, 15000);

    try {
      const subscription = this.organizationService.getUserOrganizations(userId).subscribe({
        next: (orgs) => {
          clearTimeout(timeout);
          console.log('✅ Organizations loaded successfully:', orgs.length, 'found');

          this.organizations = orgs;
          this.isLoadingOrgs = false;

          if (orgs.length > 0) {
            console.log('🎯 Organizations available:');
            orgs.forEach((org, index) => {
              console.log(`  ${index + 1}. ${org.name} (ID: ${org.id})`);
            });

            if (!this.selectedOrg) {
              console.log('🔄 Auto-selecting first organization:', orgs[0].name);
              this.selectOrganization(orgs[0]);
            }
          } else {
            console.log('⚠️ No organizations found for user');
          }
        },
        error: (error) => {
          clearTimeout(timeout);
          console.error('❌ Error loading organizations:', error);
          console.error('📋 Error details:', {
            message: error.message,
            code: error.code,
            userId: userId
          });
          this.isLoadingOrgs = false;
        }
      });

      this.subscriptions.push(subscription);
    } catch (error) {
      clearTimeout(timeout);
      console.error('❌ Exception in loadUserOrganizations:', error);
      this.isLoadingOrgs = false;
    }
  }
goHome() {
  this.router.navigate(['/home']);
}
  async selectOrganization(org: Organization) {
    console.log('🎯 Selecting organization:', org.name);
    this.selectedOrg = org;
    await this.loadChandaBook();
  }

  async loadChandaBook() {
    if (!this.selectedOrg) {
      console.error('❌ Cannot load ChandaBook: No organization selected');
      return;
    }

    console.log('📚 Loading ChandaBook for organization:', this.selectedOrg.name);
    this.isLoadingChandaBook = true;

    try {
      this.chandaBook = await this.chandaBookService.getChandaBookByOrganization(this.selectedOrg.id);

      if (this.chandaBook) {
        console.log('✅ ChandaBook loaded successfully');
        console.log('📊 Target: ₹', this.chandaBook.targetedAmount.toLocaleString());
        console.log('💰 Collected: ₹', this.chandaBook.totalCollected.toLocaleString());

        // Load related data
        await Promise.all([
          this.loadRecentDonations(),
          this.loadDonationStats()
        ]);
      } else {
        console.log('⚠️ No ChandaBook found for this organization');
      }
    } catch (error) {
      console.error('❌ Error loading ChandaBook:', error);
    } finally {
      this.isLoadingChandaBook = false;
    }
  }

  async createChandaBook() {
    if (!this.selectedOrg) {
      console.error('❌ Cannot create ChandaBook: No organization selected');
      return;
    }

    if (!this.chandaBookForm.valid) {
      console.error('❌ Cannot create ChandaBook: Form is invalid');
      return;
    }

    console.log('➕ Creating ChandaBook for:', this.selectedOrg.name);
    this.isCreatingChandaBook = true;

    try {
      const formData = this.chandaBookForm.value;
      console.log('📝 Form data:', formData);

      const chandaBookId = await this.chandaBookService.createChandaBook(
        this.selectedOrg.id,
        this.selectedOrg.name,
        formData.targetedAmount,
        formData.organizationLogo
      );

      console.log('✅ ChandaBook created with ID:', chandaBookId);
      this.chandaBookForm.reset();
      await this.loadChandaBook();
      alert('ChandaBook created successfully!');
    } catch (error) {
      console.error('❌ Error creating ChandaBook:', error);
      alert('Failed to create ChandaBook');
    } finally {
      this.isCreatingChandaBook = false;
    }
  }

  async addDonation() {
    if (!this.donationForm.valid) {
      console.error('❌ Cannot add donation: Form is invalid');
      console.log('📋 Form errors:', this.donationForm.errors);
      return;
    }

    if (!this.chandaBook) {
      console.error('❌ Cannot add donation: No ChandaBook selected');
      return;
    }

    console.log('💰 Adding new donation...');
    this.isAddingDonation = true;

    try {
      const formData = this.donationForm.value;
      console.log('📝 Donation data:', formData);

      const donationData = {
        ...formData,
        chandaBookId: this.chandaBook.id,
        organizationId: this.selectedOrg!.id,
        amount: parseFloat(formData.amount)
      };

      const result = await this.chandaBookService.addDonation(donationData);
      console.log('✅ Donation added successfully with receipt:', result.receiptNumber);

      // Create donation object for receipt
      this.lastDonation = {
        ...donationData,
        id: result.id,
        receiptNumber: result.receiptNumber,
        receivedBy: this.currentUser!.uid,
        receivedByName: this.currentUser!.displayName || this.currentUser!.email || '',
        createdAt: new Date()
      } as Donation;

      this.selectedDonation = this.lastDonation;

      // Reset form
      this.donationForm.reset({
        category: 'donation',
        paymentMethod: 'cash'
      });

      // Show receipt modal
      this.showReceiptModal = true;

      // Refresh data
      await this.loadChandaBook();
    } catch (error) {
      console.error('❌ Error adding donation:', error);
      alert('Failed to add donation');
    } finally {
      this.isAddingDonation = false;
    }
  }

  async loadRecentDonations() {
    if (!this.chandaBook) return;

    console.log('📋 Loading recent donations...');

    const subscription = this.chandaBookService.getRecentDonations(this.chandaBook.id).subscribe({
      next: (donations) => {
        console.log('✅ Recent donations loaded:', donations.length, 'found');
        this.recentDonations = donations;
      },
      error: (error) => {
        console.error('❌ Error loading recent donations:', error);
      }
    });

    this.subscriptions.push(subscription);
  }

  async loadDonationStats() {
    if (!this.chandaBook) return;

    console.log('🏆 Loading donation stats...');

    try {
      this.donationStats = await this.chandaBookService.getDonationStats(this.chandaBook.id);
      console.log('✅ Donation stats loaded:', this.donationStats.length, 'collectors');
    } catch (error) {
      console.error('❌ Error loading donation stats:', error);
    }
  }

  // WhatsApp share functionality
  // shareReceiptViaWhatsApp() {
  //   if (!this.lastDonation || !this.chandaBook) {
  //     console.error('❌ Cannot share receipt: Missing data');
  //     return;
  //   }

  //   console.log('📱 Sharing receipt via WhatsApp:', this.lastDonation.receiptNumber);

  //   const message = this.chandaBookService.generateWhatsAppMessage(this.lastDonation, this.chandaBook);
  //   const whatsappUrl = `https://wa.me/?text=${message}`;
  //   window.open(whatsappUrl, '_blank');
  // }

  // // Print receipt
  // printReceipt() {
  //   console.log('🖨️ Printing receipt...');
  //   window.print();
  // }


  // WhatsApp share
shareReceiptViaWhatsApp() {
  if (!this.selectedDonation || !this.chandaBook) {
    console.error('❌ Cannot share receipt: Missing data');
    return;
  }

  console.log('📱 Sharing receipt via WhatsApp:', this.selectedDonation.receiptNumber);

  const message = this.chandaBookService.generateWhatsAppMessage(this.selectedDonation, this.chandaBook);
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
}

// Print receipt
printReceipt() {
  console.log('🖨️ Printing receipt...');
  window.print();
}

  // Utility methods
  getProgressPercentage(): number {
    if (!this.chandaBook || this.chandaBook.targetedAmount === 0) return 0;
    const percentage = Math.min((this.chandaBook.totalCollected / this.chandaBook.targetedAmount) * 100, 100);
    return Math.round(percentage * 10) / 10; // Round to 1 decimal place
  }

  // closeReceiptModal() {
  //   console.log('📄 Closing receipt modal');
  //   this.showReceiptModal = false;
  //   this.lastDonation = null;
  // }

  closeReceiptModal() {
  console.log('📄 Closing receipt modal');
  this.showReceiptModal = false;
  this.lastDonation = null;
  this.selectedDonation = null; // ADD THIS LINE
}

openReceiptModal(donation: Donation) {
  this.selectedDonation = donation;
  this.showReceiptModal = true;
}

  toDate(timestamp: any): Date {
    if (timestamp?.toDate) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    return new Date(timestamp);
  }

  // Track functions for ngFor
  trackByDonationId(index: number, donation: Donation): string {
    return donation.id;
  }

  trackByUserId(index: number, stat: DonationStats): string {
    return stat.userId;
  }

  trackByOrgId(index: number, org: Organization): string {
    return org.id;
  }

  // Form validation helpers
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.donationForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }
}
