import { Timestamp, FieldValue } from 'firebase/firestore';
import { UserRole } from './user.interface';

export interface Member {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  role: UserRole;
  joinedAt: Timestamp | FieldValue | Date;
  invitedBy?: string;
  organizations?: string[];
}

export interface MemberInvite {
  email: string;
  role: UserRole;
  invitedBy: string;
  invitedAt: Timestamp | FieldValue | Date;
  status: 'pending' | 'accepted' | 'rejected';
}
