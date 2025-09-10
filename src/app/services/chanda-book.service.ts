import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  collectionData
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { ChandaBook, Donation, DonationStats } from '../interfaces/chanda-book.interface';

@Injectable({
  providedIn: 'root'
})
export class ChandaBookService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  constructor() {
    console.log('🔧 ChandaBookService initialized');
  }

  // Generate unique receipt number
  private generateReceiptNumber(): string {
    const prefix = 'RCT';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const receiptNum = `${prefix}${timestamp}${random}`;
    console.log('📄 Generated receipt number:', receiptNum);
    return receiptNum;
  }

  // Create Chanda Book for organization
  async createChandaBook(orgId: string, orgName: string, targetAmount: number, orgLogo?: string): Promise<string> {
    console.log('➕ Creating ChandaBook for org:', orgName);

    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      console.error('❌ Cannot create ChandaBook: User not authenticated');
      throw new Error('Not authenticated');
    }

    const chandaBook = {
      organizationId: orgId,
      organizationName: orgName,
      organizationLogo: orgLogo || '',
      targetedAmount: targetAmount,
      totalCollected: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      isActive: true
    };

    try {
      const docRef = await addDoc(collection(this.firestore, 'chandaBooks'), chandaBook);
      console.log('✅ ChandaBook created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating ChandaBook:', error);
      throw error;
    }
  }

  // Get Chanda Book by organization
  async getChandaBookByOrganization(orgId: string): Promise<ChandaBook | null> {
    console.log('🔍 Fetching ChandaBook for organization:', orgId);

    try {
      const chandaQuery = query(
        collection(this.firestore, 'chandaBooks'),
        where('organizationId', '==', orgId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(chandaQuery);

      if (snapshot.empty) {
        console.log('⚠️ No ChandaBook found for organization:', orgId);
        return null;
      }

      const doc = snapshot.docs[0];
      const chandaBook = { id: doc.id, ...doc.data() } as ChandaBook;
      console.log('✅ ChandaBook found:', chandaBook.organizationName);
      return chandaBook;
    } catch (error) {
      console.error('❌ Error fetching ChandaBook:', error);
      throw error;
    }
  }

  // Add donation
  async addDonation(donation: Partial<Donation>): Promise<{id: string, receiptNumber: string}> {
    console.log('💰 Adding donation for:', donation.donorName);

    const userId = this.auth.currentUser?.uid;
    const userName = this.auth.currentUser?.displayName || this.auth.currentUser?.email || 'Unknown User';

    if (!userId) {
      console.error('❌ Cannot add donation: User not authenticated');
      throw new Error('Not authenticated');
    }

    const receiptNumber = this.generateReceiptNumber();

    const newDonation = {
      ...donation,
      receivedBy: userId,
      receivedByName: userName,
      createdAt: serverTimestamp(),
      receiptNumber: receiptNumber
    };

    try {
      const docRef = await addDoc(collection(this.firestore, 'donations'), newDonation);
      console.log('✅ Donation added with ID:', docRef.id);

      // Update total collected in Chanda Book
      if (donation.chandaBookId && donation.amount) {
        await this.updateTotalCollected(donation.chandaBookId, donation.amount);
      }

      return { id: docRef.id, receiptNumber };
    } catch (error) {
      console.error('❌ Error adding donation:', error);
      throw error;
    }
  }

  // Update total collected amount
  private async updateTotalCollected(chandaBookId: string, amount: number): Promise<void> {
    console.log('📊 Updating total collected for ChandaBook:', chandaBookId, 'Amount:', amount);

    try {
      const chandaBookRef = doc(this.firestore, 'chandaBooks', chandaBookId);
      const chandaBookDoc = await getDoc(chandaBookRef);

      if (chandaBookDoc.exists()) {
        const currentTotal = chandaBookDoc.data()['totalCollected'] || 0;
        const newTotal = currentTotal + amount;

        await updateDoc(chandaBookRef, {
          totalCollected: newTotal,
          updatedAt: serverTimestamp()
        });

        console.log('✅ Total updated from ₹', currentTotal, 'to ₹', newTotal);
      } else {
        console.error('❌ ChandaBook not found for total update');
      }
    } catch (error) {
      console.error('❌ Error updating total collected:', error);
    }
  }

  // Get recent donations
  getRecentDonations(chandaBookId: string): Observable<Donation[]> {
    console.log('📋 Subscribing to recent donations for ChandaBook:', chandaBookId);

    try {
      const donationsQuery = query(
        collection(this.firestore, 'donations'),
        where('chandaBookId', '==', chandaBookId),
        orderBy('createdAt', 'desc')
      );

      return collectionData(donationsQuery, { idField: 'id' }) as Observable<Donation[]>;
    } catch (error) {
      console.error('❌ Error setting up donations subscription:', error);
      return of([]);
    }
  }

  // Get donation stats for leaderboard
  async getDonationStats(chandaBookId: string): Promise<DonationStats[]> {
    console.log('🏆 Calculating donation stats for ChandaBook:', chandaBookId);

    try {
      const donationsQuery = query(
        collection(this.firestore, 'donations'),
        where('chandaBookId', '==', chandaBookId)
      );

      const snapshot = await getDocs(donationsQuery);
      const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));

      console.log('📊 Processing', donations.length, 'donations for stats');

      // Group by user
      const statsMap = new Map<string, DonationStats>();

      donations.forEach(donation => {
        const userId = donation.receivedBy;
        if (!statsMap.has(userId)) {
          statsMap.set(userId, {
            userId,
            userDisplayName: donation.receivedByName,
            totalAmount: 0,
            donationCount: 0,
            organizationId: donation.organizationId
          });
        }

        const stats = statsMap.get(userId)!;
        stats.totalAmount += donation.amount;
        stats.donationCount += 1;
      });

      const sortedStats = Array.from(statsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
      console.log('🏅 Generated stats for', sortedStats.length, 'collectors');

      return sortedStats;
    } catch (error) {
      console.error('❌ Error calculating donation stats:', error);
      return [];
    }
  }

  // Generate WhatsApp message
  generateWhatsAppMessage(donation: Donation, chandaBook: ChandaBook): string {
    console.log('📱 Generating WhatsApp message for receipt:', donation.receiptNumber);

    const message = `*🎉 DONATION RECEIPT 🎉*

*${chandaBook.organizationName}*

📋 *Receipt No:* ${donation.receiptNumber}
👤 *Donor:* ${donation.donorName}
📞 *Phone:* ${donation.phoneNumber}
💰 *Amount:* Rs ${donation.amount.toLocaleString()}
📅 *Date:* ${new Date().toLocaleDateString()}
🏷️ *Category:* ${donation.category.toUpperCase()}
💳 *Payment:* ${donation.paymentMethod.toUpperCase()}

*Thank you for your generous contribution!*

_This is an auto-generated receipt_`;

    return encodeURIComponent(message);
  }
}
