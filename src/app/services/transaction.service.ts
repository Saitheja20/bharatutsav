import { Injectable } from '@angular/core';
import { Firestore, collection, query, where, or, getDocs, orderBy, addDoc, doc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Transaction } from '../interfaces/transaction.interface';
import { deleteDoc } from '@angular/fire/firestore';
import { serverTimestamp } from '@angular/fire/firestore';
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  constructor(private firestore: Firestore, private auth: Auth) {}

  async getUserTransactions(): Promise<Transaction[]> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return [];

    const transactionsRef = collection(this.firestore, 'transactions');
    const userQuery = query(
      transactionsRef,
      or(
        where('createdBy', '==', userId),
        where('members', 'array-contains', userId)
      ),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(userQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
  }

  async createTransaction(transaction: Partial<Transaction>) {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const newTransaction = {
      ...transaction,
      createdBy: userId,
      members: [userId],
     createdAt: serverTimestamp(), 
    };

    return await addDoc(collection(this.firestore, 'transactions'), newTransaction);
  }

  // Add other transaction-related methods (delete, update, inviteMember) here

    // Fetch user document for role or other info
  async firestoreGetUserDoc(uid: string) {
    const userDocRef = doc(this.firestore, 'users', uid);
    return await getDoc(userDocRef);
  }

  // Delete a transaction by ID
  async deleteTransaction(transactionId: string): Promise<void> {
    const transactionDocRef = doc(this.firestore, 'transactions', transactionId);
    await deleteDoc(transactionDocRef);
  }

  // Clear all transactions (only for admin)
  async clearAllTransactions(): Promise<void> {
    const transactionsRef = collection(this.firestore, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }

}
