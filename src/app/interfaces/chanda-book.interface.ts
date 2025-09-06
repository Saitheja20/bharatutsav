import { Timestamp, FieldValue } from 'firebase/firestore';

export interface ChandaBook {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationLogo?: string;
  targetedAmount: number;
  totalCollected: number;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  createdBy: string;
  isActive: boolean;
}

export interface Donation {
  id: string;
  chandaBookId: string;
  organizationId: string;
  category: 'sponsor' | 'donation' | 'other';
  donorName: string;
  phoneNumber: string;
  address: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer';
  notes?: string;
  receivedBy: string;
  receivedByName: string;
  createdAt: Timestamp | FieldValue | Date;
  receiptNumber: string;
}

export interface DonationStats {
  userId: string;
  userDisplayName: string;
  totalAmount: number;
  donationCount: number;
  organizationId: string;
}
