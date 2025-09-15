// Add this interface at the top of your dashboard component or in interfaces file

import { Timestamp , FieldValue} from '@angular/fire/firestore';

export interface TransactionDocument {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: any; // Firestore Timestamp
  category?: string;
  organizationName?: string;
  [key: string]: any; // Allow additional properties
}
