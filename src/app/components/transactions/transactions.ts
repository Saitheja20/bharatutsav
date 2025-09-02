import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, getDoc, serverTimestamp } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Router } from '@angular/router';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css'
})
export class TransactionsComponent implements OnInit {
  userRole = 'viewer';
  allTransactions: any[] = [];
  filteredTransactions: any[] = [];
  isLoadingTransactions = true;
  isAddingTransaction = false;

  newTransaction = {
    type: '',
    amount: 0,
    note: ''
  };
  imageFile: File | null = null;
  imageUrl: string | null = null;

  transactionToDelete: any = null;
  modalImageUrl: string | null = null;

  summaryCredits = 0;
  summaryDebits = 0;
  summaryBalance = 0;
  filterType = '';

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private storage: Storage,
    private router: Router
  ) { }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        this.userRole = userDoc.exists() ? userDoc.data()['role'] || 'viewer' : 'viewer';
        this.loadTransactions();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imageUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imageUrl = null;
  }

  async addTransaction(form: any): Promise<void> {
    if (this.userRole === 'viewer') {
      alert('You do not have permission to add transactions.');
      return;
    }

    this.isAddingTransaction = true;

    try {
      let imageUrl = null;
      if (this.imageFile) {
        const imageRef = ref(this.storage, `transaction-images/${Date.now()}_${this.imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, this.imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const newTransactionData = {
        type: this.newTransaction.type,
        amount: this.newTransaction.amount,
        note: this.newTransaction.note,
        imageUrl,
        createdBy: this.auth.currentUser?.uid,
        createdByName: this.auth.currentUser?.displayName || this.auth.currentUser?.email,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(this.firestore, 'transactions'), newTransactionData);

      form.resetForm();
      this.removeImage();
      this.loadTransactions();
      // showToast('Transaction added successfully!', 'success');
    } catch (error) {
      console.error('Error adding transaction:', error);
      // showToast('Error adding transaction. Please try again.', 'error');
    } finally {
      this.isAddingTransaction = false;
    }
  }

  async loadTransactions(): Promise<void> {
    this.isLoadingTransactions = true;
    try {
      const q = query(collection(this.firestore, 'transactions'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      this.allTransactions = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.filterTransactions();
      this.updateSummary(this.allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // showToast('Error loading transactions.', 'error');
    } finally {
      this.isLoadingTransactions = false;
    }
  }

  filterTransactions(): void {
    if (this.filterType) {
      this.filteredTransactions = this.allTransactions.filter(t => t.type === this.filterType);
    } else {
      this.filteredTransactions = [...this.allTransactions];
    }
    this.updateSummary(this.filteredTransactions);
  }

  updateSummary(transactions: any[]): void {
    this.summaryCredits = transactions.reduce((sum, t) => t.type === 'credit' ? sum + (parseFloat(t.amount) || 0) : sum, 0);
    this.summaryDebits = transactions.reduce((sum, t) => t.type === 'debit' ? sum + (parseFloat(t.amount) || 0) : sum, 0);
    this.summaryBalance = this.summaryCredits - this.summaryDebits;
  }

  showImageModal(imageUrl: string): void {
    this.modalImageUrl = imageUrl;
    // You would use an Angular service or a view child to open the modal here
  }

  confirmDelete(transaction: any): void {
    this.transactionToDelete = transaction;
    // You would use an Angular service or a view child to open the modal here
  }

  async deleteTransaction(): Promise<void> {
    if (!this.transactionToDelete) return;
    try {
      await deleteDoc(doc(this.firestore, 'transactions', this.transactionToDelete.id));
      this.loadTransactions();
      // showToast('Transaction deleted successfully!', 'success');
      // Hide modal here
    } catch (error) {
      console.error('Error deleting transaction:', error);
      // showToast('Error deleting transaction.', 'error');
    }
  }

  async clearAllTransactions(): Promise<void> {
    if (this.userRole !== 'admin') {
      alert('Only administrators can clear all transactions.');
      return;
    }
    if (!confirm('Are you sure you want to delete ALL transactions? This action cannot be undone.')) {
      return;
    }
    try {
      const deletePromises = this.allTransactions.map(transaction =>
        deleteDoc(doc(this.firestore, 'transactions', transaction.id))
      );
      await Promise.all(deletePromises);
      this.loadTransactions();
      // showToast('All transactions cleared successfully!', 'success');
    } catch (error) {
      console.error('Error clearing transactions:', error);
      // showToast('Error clearing transactions.', 'error');
    }
  }
}
