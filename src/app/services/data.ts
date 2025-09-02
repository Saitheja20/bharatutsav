import { Injectable } from '@angular/core';
import { Firestore, collection, query, orderBy, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, getDoc, setDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth
  ) { }

  // --- Transactions Management ---

  async getTransactions(): Promise<any[]> {
    const q = query(collection(this.firestore, 'transactions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addTransaction(transactionData: any, imageFile: File | null): Promise<void> {
    let imageUrl = null;
    if (imageFile) {
      const imageRef = ref(this.storage, `transaction-images/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(snapshot.ref);
    }

    const currentUser = this.auth.currentUser;
    await addDoc(collection(this.firestore, 'transactions'), {
      ...transactionData,
      imageUrl,
      createdBy: currentUser?.uid,
      createdByName: currentUser?.displayName || currentUser?.email,
      createdAt: serverTimestamp()
    });
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'transactions', transactionId));
  }

  async clearAllTransactions(transactions: any[]): Promise<void> {
    const deletePromises = transactions.map(transaction =>
      deleteDoc(doc(this.firestore, 'transactions', transaction.id))
    );
    await Promise.all(deletePromises);
  }

  // --- Members Management ---

  async getMembers(): Promise<any[]> {
    const q = query(collection(this.firestore, 'users'), orderBy('displayName'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async addMember(memberEmail: string, role: string): Promise<void> {
    const memberId = memberEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const currentUser = this.auth.currentUser;

    await setDoc(doc(this.firestore, 'users', memberId), {
      email: memberEmail,
      role: role,
      status: 'invited',
      invitedBy: currentUser?.uid,
      invitedAt: serverTimestamp(),
      displayName: memberEmail.split('@')[0]
    });
  }

  async updateMemberRole(userId: string, newRole: string): Promise<void> {
    const currentUser = this.auth.currentUser;
    await updateDoc(doc(this.firestore, 'users', userId), {
      role: newRole,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.uid
    });
  }

  async removeMember(userId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'users', userId));
  }
}
