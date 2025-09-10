import { Component, OnInit, NgZone, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, query, orderBy, getDocs, doc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router, RouterModule } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { Transaction } from '../../interfaces/transaction.interface';
import { NavigationComponent } from '../navigation/navigation';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective, NavigationComponent],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class DashboardComponent implements OnInit {
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  isBrowser: boolean = isPlatformBrowser(this.platformId);

  totalCredits = 0;
  totalDebits = 0;
  currentBalance = 0;

  recentTransactions: Transaction[] = [];
  isLoadingTransactions = true;

  pieChartData: ChartData<'pie'> = {
    labels: ['Credits', 'Debits'],
    datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'], borderColor: '#fff', borderWidth: 2 }],
  };
  pieChartType: ChartType = 'pie';

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Credits', backgroundColor: '#28a745', borderColor: '#1e7e34', borderWidth: 1 },
      { data: [], label: 'Debits', backgroundColor: '#dc3545', borderColor: '#c82333', borderWidth: 1 },
    ],
  };
  barChartType: ChartType = 'bar';

  ngOnInit(): void {
    this.ngZone.run(() => {
      onAuthStateChanged(this.auth, async (user: User | null) => {
        if (!user) {
          this.router.navigate(['/login']);
          return;
        }
        await this.loadDashboardData();
      });
    });
  }

  async loadDashboardData(): Promise<void> {
    this.isLoadingTransactions = true;
    this.totalCredits = 0;
    this.totalDebits = 0;
    this.currentBalance = 0;

    try {
      const transactionCollection = collection(this.firestore, 'transactions');
      const q = query(transactionCollection, orderBy('createdAt', 'desc'));
      const qSnapshot = await getDocs(q);

      const transactions: Transaction[] = [];
      const dailySums: { [date: string]: { credits: number; debits: number } } = {};

      qSnapshot.forEach((doc) => {
        const data = doc.data();

        // Using bracket notation ensures safety because data is a PropertyMap
        const transaction: Transaction = {
          id: doc.id,
          amount: Number(data['amount']) || 0,
          type: data['type'],
          note: data['note'],
          imageUrl: data['imageUrl'] || undefined,
          createdBy: data['createdBy'],
          createdAt: data['createdAt'],
          createdByName: data['createdName'],
          members: data['members'] || [],
        };

        transactions.push(transaction);

        if (transaction.type === 'credit') {
          this.totalCredits += transaction.amount;
        } else {
          this.totalDebits += transaction.amount;
        }

        // Safely get Date object from timestamp or fallback
        const date = this.toDate(transaction.createdAt).toLocaleDateString();

        if (!dailySums[date]) {
          dailySums[date] = { credits: 0, debits: 0 };
        }
        if (transaction.type === 'credit') {
          dailySums[date].credits += transaction.amount;
        } else {
          dailySums[date].debits += transaction.amount;
        }
      });

      this.currentBalance = this.totalCredits - this.totalDebits;
      this.recentTransactions = transactions.slice(0, 5);

      // Update chart data immutably
      const last7Days = Object.keys(dailySums).slice(-7);
      this.pieChartData = {
        labels: ['Credits', 'Debits'],
        datasets: [{ data: [this.totalCredits, this.totalDebits], backgroundColor: ['#28a745', '#dc3545'], borderColor: '#fff', borderWidth: 2 }],
      };
      this.barChartData = {
        labels: last7Days,
        datasets: [
          {
            label: 'Credits',
            data: last7Days.map((d) => dailySums[d]?.credits || 0),
            backgroundColor: '#28a745',
            borderColor: '#1e7e34',
            borderWidth: 1,
          },
          {
            label: 'Debits',
            data: last7Days.map((d) => dailySums[d]?.debits || 0),
            backgroundColor: '#dc3545',
            borderColor: '#c82333',
            borderWidth: 1,
          },
        ],
      };

      if (this.isBrowser) {
        this.cdr.detectChanges();
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoadingTransactions = false;
    }
  }

  toDate(timestamp: Timestamp | any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date(); // Fallback if timestamp missing
  }
}
