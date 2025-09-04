import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  members: string[]; // Array of user IDs
  memberRoles: { [userId: string]: string }; // Map of user roles
}

export interface OrganizationMember {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: 'admin' | 'editor' | 'viewer';
  joinedAt: Timestamp | FieldValue;
  invitedBy: string;
}

export interface OrganizationTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  note: string;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | FieldValue;
   imageUrl?: string;
}
