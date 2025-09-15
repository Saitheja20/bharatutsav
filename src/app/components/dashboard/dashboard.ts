import { Component, OnInit, NgZone, ChangeDetectorRef, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, query, orderBy, getDocs } from '@angular/fire/firestore';
import { Router, RouterModule } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
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
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pieChart') pieChart?: BaseChartDirective;
  @ViewChild('barChart') barChart?: BaseChartDirective;

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
  isChartsLoaded = false;

  // Pie Chart Configuration
  pieChartData: ChartData = {
    labels: ['Credits', 'Debits'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#28a745', '#dc3545'],
      borderColor: ['#ffffff', '#ffffff'],
      borderWidth: 2
    }],
  };

  // Bar Chart Configuration
  barChartData: ChartData = {
    labels: [],
    datasets: [
      {
        label: 'Credits',
        data: [],
        backgroundColor: '#28a745',
        borderColor: '#1e7e34',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Debits',
        data: [],
        backgroundColor: '#dc3545',
        borderColor: '#c82333',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Chart options
  pieChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            return `${label}: ₹${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  barChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '₹' + Number(value).toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `${context.dataset.label}: ₹${Number(context.parsed.y).toLocaleString()}`;
          }
        }
      }
    }
  };

  ngOnInit(): void {
    if (this.isBrowser) {
      this.ngZone.run(() => {
        onAuthStateChanged(this.auth, async (user: User | null) => {
          if (!user) {
            this.router.navigate(['/login']);
            return;
          }
          // Only load dashboard data - no photoURL handling needed here
          await this.loadDashboardData();
        });
      });
    }
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        this.updateCharts();
      }, 100);
    }
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

      // Update chart data
      this.updateChartData(dailySums);

      if (this.isBrowser) {
        this.cdr.detectChanges();
        setTimeout(() => {
          this.updateCharts();
        }, 100);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoadingTransactions = false;
      this.isChartsLoaded = true;
    }
  }

  private updateChartData(dailySums: { [date: string]: { credits: number; debits: number } }): void {
    // Update pie chart data
    this.pieChartData = {
      labels: ['Credits', 'Debits'],
      datasets: [{
        data: [this.totalCredits, this.totalDebits],
        backgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2
      }],
    };

    // Update bar chart data (last 7 days)
    const sortedDates = Object.keys(dailySums).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const last7Days = sortedDates.slice(-7);

    this.barChartData = {
      labels: last7Days.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Credits',
          data: last7Days.map((date) => dailySums[date]?.credits || 0),
          backgroundColor: '#28a745',
          borderColor: '#1e7e34',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Debits',
          data: last7Days.map((date) => dailySums[date]?.debits || 0),
          backgroundColor: '#dc3545',
          borderColor: '#c82333',
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };
  }

  private updateCharts(): void {
    if (this.pieChart) {
      this.pieChart.update();
    }
    if (this.barChart) {
      this.barChart.update();
    }
  }

  toDate(timestamp: Timestamp | any): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    return new Date();
  }
}
