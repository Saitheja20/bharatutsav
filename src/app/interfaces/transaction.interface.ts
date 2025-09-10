import { Timestamp , FieldValue} from '@angular/fire/firestore';

export interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  note: string;
  imageUrl?: string | null;
  createdBy: string;        // UID of the user who created the transaction
  createdByName: string;    // Name of creator
  createdAt: Timestamp | FieldValue;     // Timestamp of creation

  members: string[];        // Array of UIDs invited to access the transaction
  organizationId?: string;  // Optional organization ID
}
