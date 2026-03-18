import { Timestamp, FieldValue } from 'firebase/firestore';

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface User {
  id: string;
  uid: string;
  username?: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizations?: string[];
  invitedBy?: string | null;
  createdAt: Timestamp | FieldValue | Date;
  updatedAt?: Timestamp | FieldValue | Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: string;
  notifications?: boolean;
}