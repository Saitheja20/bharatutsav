import { Timestamp, FieldValue } from 'firebase/firestore';

export interface Organization {
  id: string;
  name: string;
  description?: string;
  organizationCode: string; // ✅ NEW: Unique join code
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
  members: string[];
  memberRoles: { [userId: string]: string };
  joinRequests?: { [userId: string]: JoinRequest }; // ✅ NEW
}
export interface JoinRequest {
  status: 'pending';
  requestedAt: Timestamp | FieldValue;
  userEmail: string;
  userDisplayName: string;
  userId: string;
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
