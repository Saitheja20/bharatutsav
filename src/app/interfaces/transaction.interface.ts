import { Timestamp } from '@angular/fire/firestore';

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  note: string;
  imageUrl?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp; // This type does not include null or undefined
}