import { Component, OnInit, } from '@angular/core';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, query, orderBy, getDocs, doc, getDoc, Timestamp } from '@angular/fire/firestore';
import { Router, RouterModule } from '@angular/router';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { AuthService } from '../../services/auth';
import { DataService } from '../../services/data';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, Inject } from '@angular/core';
import { NavigationComponent } from '../navigation/navigation';
// import { Transaction } from '../interfaces/transaction.ts'; // Import the new interface
// From src/app/components/dashboard/

// From src/app/components/dashboard/
import { Transaction } from '../../interfaces/transaction.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective, NavigationComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  totalCredits = 0;
  totalDebits = 0;
  currentBalance = 0;

  // Use the new interface for strong typing
  recentTransactions: Transaction[] = [];
  isLoadingTransactions = true;

  pieChartData: ChartData<'pie'> = {
    labels: ['Credits', 'Debits'],
    datasets: [{ data: [0, 0], backgroundColor: ['#28a745', '#dc3545'], borderColor: '#fff', borderWidth: 2 }]
  };
  pieChartType: ChartType = 'pie';

  barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Credits', backgroundColor: '#28a745', borderColor: '#1e7e34', borderWidth: 1 },
      { data: [], label: 'Debits', backgroundColor: '#dc3545', borderColor: '#c82333', borderWidth: 1 }
    ]
  };
  barChartType: ChartType = 'bar';
isBrowser: boolean = false;
  constructor(
      private authService: AuthService,
    private dataService: DataService,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {  this.isBrowser = isPlatformBrowser(this.platformId); }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (!user) {
        this.router.navigate(['/login']);
      } else {
        this.loadDashboardData();
      }
    });
  }

  // async loadDashboardData() {
  //   this.isLoadingTransactions = true;
  //   this.totalCredits = 0;
  //   this.totalDebits = 0;
  //   this.currentBalance = 0;

  //   try {
  //     const q = query(collection(this.firestore, 'transactions'), orderBy('createdAt', 'desc'));
  //     const querySnapshot = await getDocs(q);

  //     const allTransactions: Transaction[] = []; // Type the array
  //     const dailyData: { [key: string]: { credits: number, debits: number } } = {};

  //     querySnapshot.forEach((doc) => {
  //       // Cast the data to the Transaction interface
  //       const transaction = { id: doc.id, ...doc.data() as Transaction };
  //       allTransactions.push(transaction);

  //       const amount = transaction.amount || 0;
  //       if (transaction.type === 'credit') {
  //         this.totalCredits += amount;
  //       } else {
  //         this.totalDebits += amount;
  //       }

  //       const timestamp = transaction.createdAt?.toDate() || new Date();
  //       const date = new Date(timestamp).toLocaleDateString();

  //       if (!dailyData[date]) {
  //         dailyData[date] = { credits: 0, debits: 0 };
  //       }
  //       if (transaction.type === 'credit') {
  //         dailyData[date].credits += amount;
  //       } else {
  //         dailyData[date].debits += amount;
  //       }
  //     });

  //     this.currentBalance = this.totalCredits - this.totalDebits;
  //     this.recentTransactions = allTransactions.slice(0, 5);
  //     this.updateCharts(dailyData);

  //   } catch (error) {
  //     console.error('Error loading dashboard data:', error);
  //   } finally {
  //     this.isLoadingTransactions = false;
  //   }
  // }

  // ... (rest of the file remains the same)

// async loadDashboardData() {
//   this.isLoadingTransactions = true;
//   this.totalCredits = 0;
//   this.totalDebits = 0;
//   this.currentBalance = 0;

//   try {
//     const q = query(collection(this.firestore, 'transactions'), orderBy('createdAt', 'desc'));
//     const querySnapshot = await getDocs(q);

//     const allTransactions: Transaction[] = [];
//     const dailyData: { [key: string]: { credits: number, debits: number } } = {};

//     querySnapshot.forEach((doc) => {
//       // FIX: Get the data first, add the id, then type cast.
//       const transactionData = doc.data() as Transaction;
//       const transaction: Transaction = {
//         id: doc.id,
//         ...transactionData,
//       };
//       allTransactions.push(transaction);

//       const amount = transaction.amount || 0;
//       if (transaction.type === 'credit') {
//         this.totalCredits += amount;
//       } else {
//         this.totalDebits += amount;
//       }

//       const timestamp = transaction.createdAt?.toDate() || new Date();
//       const date = new Date(timestamp).toLocaleDateString();

//       if (!dailyData[date]) {
//         dailyData[date] = { credits: 0, debits: 0 };
//       }
//       if (transaction.type === 'credit') {
//         dailyData[date].credits += amount;
//       } else {
//         dailyData[date].debits += amount;
//       }
//     });

//     this.currentBalance = this.totalCredits - this.totalDebits;
//     this.recentTransactions = allTransactions.slice(0, 5);
//     this.updateCharts(dailyData);

//   } catch (error) {
//     console.error('Error loading dashboard data:', error);
//   } finally {
//     this.isLoadingTransactions = false;
//   }
// }

// ... (rest of the file remains the same)



  // ... (rest of the file remains the same)

async loadDashboardData() {
  this.isLoadingTransactions = true;
  this.totalCredits = 0;
  this.totalDebits = 0;
  this.currentBalance = 0;

  try {
    const q = query(collection(this.firestore, 'transactions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const allTransactions: Transaction[] = [];
    const dailyData: { [key: string]: { credits: number, debits: number } } = {};

    querySnapshot.forEach((doc) => {
      const data = doc.data(); // Get the raw data from the document

      // Explicitly create the transaction object with all properties
      const transaction: Transaction = {
        id: doc.id, // Get the ID from the document object
        amount: data['amount'] || 0,
        type: data['type'],
        note: data['note'],
        imageUrl: data['imageUrl'] || undefined,
        createdBy: data['createdBy'],
        createdByName: data['createdByName'],
        createdAt: data['createdAt']
      };

      allTransactions.push(transaction);

      const amount = transaction.amount || 0;
      if (transaction.type === 'credit') {
        this.totalCredits += amount;
      } else {
        this.totalDebits += amount;
      }

      const timestamp = transaction.createdAt?.toDate() || new Date();
      const date = new Date(timestamp).toLocaleDateString();

      if (!dailyData[date]) {
        dailyData[date] = { credits: 0, debits: 0 };
      }
      if (transaction.type === 'credit') {
        dailyData[date].credits += amount;
      } else {
        dailyData[date].debits += amount;
      }
    });

    this.currentBalance = this.totalCredits - this.totalDebits;
    this.recentTransactions = allTransactions.slice(0, 5);
    this.updateCharts(dailyData);
  } catch (error) {
    console.error('Error loading dashboard data:', error);
  } finally {
    this.isLoadingTransactions = false;
  }
}

// ... (rest of the file remains the same)
  updateCharts(dailyData: { [key: string]: { credits: number, debits: number } }) {
    this.pieChartData.datasets[0].data = [this.totalCredits, this.totalDebits];

    const dates = Object.keys(dailyData).slice(-7);
    const creditData = dates.map(date => dailyData[date]?.credits || 0);
    const debitData = dates.map(date => dailyData[date]?.debits || 0);

    this.barChartData.labels = dates;
    this.barChartData.datasets[0].data = creditData;
    this.barChartData.datasets[1].data = debitData;
  }
}
