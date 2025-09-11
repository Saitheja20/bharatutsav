// import { Injectable, inject } from '@angular/core';
// import {
//   Firestore,
//   collection,
//   doc,
//   addDoc,
//   getDocs,
//   getDoc,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   orderBy,
//   serverTimestamp,
//   collectionGroup
// } from '@angular/fire/firestore';
// import { Auth } from '@angular/fire/auth';
// import { Organization, OrganizationMember, OrganizationTransaction } from '../interfaces/organization.interface';

// @Injectable({
//   providedIn: 'root'
// })
// export class OrganizationService {
//   private firestore = inject(Firestore);
//   private auth = inject(Auth);

//   // Organization CRUD
//   async createOrganization(orgData: Partial<Organization>): Promise<string> {
//     const userId = this.auth.currentUser?.uid;
//     if (!userId) throw new Error('Not authenticated');

//     const newOrg = {
//       ...orgData,
//       createdBy: userId,
//       createdByName: this.auth.currentUser?.displayName || this.auth.currentUser?.email || '',
//       createdAt: serverTimestamp(),
//       updatedAt: serverTimestamp()
//     };

//     const docRef = await addDoc(collection(this.firestore, 'organizations'), newOrg);

//     // Add creator as admin member
//     await this.addMemberToOrganization(docRef.id, {
//       userId: userId,
//       email: this.auth.currentUser?.email || '',
//       displayName: this.auth.currentUser?.displayName || '',
//       role: 'admin'
//     });

//     return docRef.id;
//   }

//   async getUserOrganizations(): Promise<Organization[]> {
//     const userId = this.auth.currentUser?.uid;
//     if (!userId) return [];

//     // Get organizations where user is a member
//     const memberQuery = query(
//       collectionGroup(this.firestore, 'members'),
//       where('userId', '==', userId)
//     );

//     const memberSnapshot = await getDocs(memberQuery);
//     const orgIds = memberSnapshot.docs.map(doc => doc.ref.parent.parent?.id).filter(Boolean);

//     if (orgIds.length === 0) return [];

//     // Get organization details
//     const organizations: Organization[] = [];
//     for (const orgId of orgIds) {
//       const orgDoc = await getDoc(doc(this.firestore, 'organizations', orgId!));
//       if (orgDoc.exists()) {
//         organizations.push({ id: orgDoc.id, ...orgDoc.data() } as Organization);
//       }
//     }

//     return organizations;
//   }

//   async getOrganization(orgId: string): Promise<Organization | null> {
//     const orgDoc = await getDoc(doc(this.firestore, 'organizations', orgId));
//     if (orgDoc.exists()) {
//       return { id: orgDoc.id, ...orgDoc.data() } as Organization;
//     }
//     return null;
//   }

//   // Member Management
//   async addMemberToOrganization(orgId: string, memberData: Partial<OrganizationMember>): Promise<void> {
//     const userId = this.auth.currentUser?.uid;
//     if (!userId) throw new Error('Not authenticated');

//     const newMember = {
//       ...memberData,
//       joinedAt: serverTimestamp(),
//       invitedBy: userId
//     };

//     await addDoc(collection(this.firestore, `organizations/${orgId}/members`), newMember);
//   }

//   async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
//     const membersQuery = query(
//       collection(this.firestore, `organizations/${orgId}/members`),
//       orderBy('joinedAt', 'desc')
//     );

//     const snapshot = await getDocs(membersQuery);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrganizationMember));
//   }

//   async removeMemberFromOrganization(orgId: string, memberId: string): Promise<void> {
//     await deleteDoc(doc(this.firestore, `organizations/${orgId}/members`, memberId));
//   }

//   async updateMemberRole(orgId: string, memberId: string, role: string): Promise<void> {
//     await updateDoc(doc(this.firestore, `organizations/${orgId}/members`, memberId), {
//       role: role,
//       updatedAt: serverTimestamp()
//     });
//   }

//   // Transaction Management
//   async createOrganizationTransaction(orgId: string, transactionData: Partial<OrganizationTransaction>): Promise<void> {
//     const userId = this.auth.currentUser?.uid;
//     if (!userId) throw new Error('Not authenticated');

//     const newTransaction = {
//       ...transactionData,
//       createdBy: userId,
//       createdByName: this.auth.currentUser?.displayName || this.auth.currentUser?.email || '',
//       createdAt: serverTimestamp()
//     };

//     await addDoc(collection(this.firestore, `organizations/${orgId}/transactions`), newTransaction);
//   }

//   async getOrganizationTransactions(orgId: string): Promise<OrganizationTransaction[]> {
//     const transactionsQuery = query(
//       collection(this.firestore, `organizations/${orgId}/transactions`),
//       orderBy('createdAt', 'desc')
//     );

//     const snapshot = await getDocs(transactionsQuery);
//     return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as OrganizationTransaction));
//   }

//   async deleteOrganizationTransaction(orgId: string, transactionId: string): Promise<void> {
//     await deleteDoc(doc(this.firestore, `organizations/${orgId}/transactions`, transactionId));
//   }

//   // Check if user has permission in organization
//   async getUserRoleInOrganization(orgId: string): Promise<string | null> {
//     const userId = this.auth.currentUser?.uid;
//     if (!userId) return null;

//     const memberQuery = query(
//       collection(this.firestore, `organizations/${orgId}/members`),
//       where('userId', '==', userId)
//     );

//     const snapshot = await getDocs(memberQuery);
//     if (snapshot.empty) return null;

//     return snapshot.docs[0].data()['role'] || 'viewer';
//   }
// }




import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  collectionData
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { Organization, OrganizationMember, OrganizationTransaction } from '../interfaces/organization.interface';

@Injectable({
  providedIn: 'root'
})
export class OrganizationService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
// Generate unique organization code
  private generateOrganizationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Create organization - returns the document ID
  // async createOrganization(orgData: Partial<Organization>): Promise<string> {
  //   const userId = this.auth.currentUser?.uid;
  //   if (!userId) throw new Error('Not authenticated');

  //   const newOrg = {
  //     ...orgData,
  //     createdBy: userId,
  //     createdByName: this.auth.currentUser?.displayName || this.auth.currentUser?.email || '',
  //     createdAt: serverTimestamp(),
  //     updatedAt: serverTimestamp(),
  //     members: [userId], // Add creator as member
  //     memberRoles: {
  //       [userId]: 'admin' // Creator is admin
  //     }
  //   };

  //   const docRef = await addDoc(collection(this.firestore, 'organizations'), newOrg);
  //   return docRef.id;
  // }

  // Updated createOrganization method
  async createOrganization(orgData: Partial<Organization>): Promise<{id: string, code: string}> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const organizationCode = this.generateOrganizationCode();

    const newOrg = {
      ...orgData,
      organizationCode: organizationCode, // ✅ Unique join code
      createdBy: userId,
      createdByName: this.auth.currentUser?.displayName || this.auth.currentUser?.email || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      members: [userId],
      memberRoles: {
        [userId]: 'admin'
      },
      joinRequests: {} // ✅ Track pending join requests
    };

    const docRef = await addDoc(collection(this.firestore, 'organizations'), newOrg);
    return { id: docRef.id, code: organizationCode };
  }

  // ✅ NEW: Request to join organization
  async requestToJoinOrganization(organizationCode: string): Promise<string> {
    const userId = this.auth.currentUser?.uid;
    const userEmail = this.auth.currentUser?.email;
    const userDisplayName = this.auth.currentUser?.displayName;

    if (!userId || !userEmail) throw new Error('Not authenticated');

    // Find organization by code
    const orgQuery = query(
      collection(this.firestore, 'organizations'),
      where('organizationCode', '==', organizationCode.toUpperCase())
    );

    const orgSnapshot = await getDocs(orgQuery);

    if (orgSnapshot.empty) {
      throw new Error('Invalid organization code');
    }

    const orgDoc = orgSnapshot.docs[0];
    const orgData = orgDoc.data();

    // Check if already a member
    if (orgData['members'] && orgData['members'].includes(userId)) {
      throw new Error('You are already a member of this organization');
    }

    // Check if request already exists
    const joinRequests = orgData['joinRequests'] || {};
    if (joinRequests[userId]) {
      throw new Error('Your join request is already pending');
    }

    // Add join request
    const newJoinRequests = {
      ...joinRequests,
      [userId]: {
        status: 'pending',
        requestedAt: serverTimestamp(),
        userEmail: userEmail,
        userDisplayName: userDisplayName || userEmail,
        userId: userId
      }
    };

    await updateDoc(orgDoc.ref, {
      joinRequests: newJoinRequests
    });

    return 'Join request sent successfully! Wait for admin approval.';
  }

  // ✅ NEW: Get pending join requests (admin only)
  async getPendingJoinRequests(orgId: string): Promise<any[]> {
    const orgDoc = await getDoc(doc(this.firestore, 'organizations', orgId));

    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();
    const joinRequests = orgData['joinRequests'] || {};

    // Convert object to array
    return Object.entries(joinRequests).map(([userId, request]) => ({
      userId,
      ...request as any
    }));
  }

  // ✅ NEW: Approve join request (admin only)
  async approveJoinRequest(orgId: string, userId: string): Promise<string> {
    const currentUserId = this.auth.currentUser?.uid;
    if (!currentUserId) throw new Error('Not authenticated');

    const orgRef = doc(this.firestore, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();

    // Check if current user is admin
    const userRole = orgData['memberRoles']?.[currentUserId];
    if (userRole !== 'admin') {
      throw new Error('Only admins can approve join requests');
    }

    const joinRequests = orgData['joinRequests'] || {};
    const request = joinRequests[userId];

    if (!request) {
      throw new Error('Join request not found');
    }

    // Add user to members
    const currentMembers = orgData['members'] || [];
    const updatedMembers = [...currentMembers, userId];

    // Add user role
    const currentRoles = orgData['memberRoles'] || {};
    const updatedRoles = {
      ...currentRoles,
      [userId]: 'viewer' // Default role for new members
    };

    // Remove from join requests
    const updatedJoinRequests = { ...joinRequests };
    delete updatedJoinRequests[userId];

    await updateDoc(orgRef, {
      members: updatedMembers,
      memberRoles: updatedRoles,
      joinRequests: updatedJoinRequests
    });

    return 'User approved and added to organization!';
  }

  // ✅ NEW: Reject join request (admin only)
  async rejectJoinRequest(orgId: string, userId: string, reason?: string): Promise<string> {
    const currentUserId = this.auth.currentUser?.uid;
    if (!currentUserId) throw new Error('Not authenticated');

    const orgRef = doc(this.firestore, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();

    // Check if current user is admin
    const userRole = orgData['memberRoles']?.[currentUserId];
    if (userRole !== 'admin') {
      throw new Error('Only admins can reject join requests');
    }

    const joinRequests = orgData['joinRequests'] || {};

    if (!joinRequests[userId]) {
      throw new Error('Join request not found');
    }

    // Remove from join requests
    const updatedJoinRequests = { ...joinRequests };
    delete updatedJoinRequests[userId];

    await updateDoc(orgRef, {
      joinRequests: updatedJoinRequests
    });

    return 'Join request rejected';
  }

  // Get user organizations with REAL-TIME updates
  // getUserOrganizations(): Observable<Organization[]> {
  //   const userId = this.auth.currentUser?.uid;
  //   if (!userId) {
  //     return of([]); // Return empty array if no user
  //   }

  //   // Query organizations where user is in members array
  //   const orgsQuery = query(
  //     collection(this.firestore, 'organizations'),
  //     where('members', 'array-contains', userId),
  //     orderBy('createdAt', 'desc')
  //   );

  //   // Return real-time observable - this will auto-update when data changes
  //   return collectionData(orgsQuery, { idField: 'id' }) as Observable<Organization[]>;
  // }
// getUserOrganizations(): Observable<Organization[]> {
//   const userId = this.auth.currentUser?.uid;
//   console.log('🔍 Querying organizations for user ID:', userId); // Debug log

//   if (!userId) {
//     console.warn('❌ No user ID found');
//     return of([]);
//   }

//   const orgsQuery = query(
//     collection(this.firestore, 'organizations'),
//     where('members', 'array-contains', userId),
//     orderBy('createdAt', 'desc')
//   );

//   const observable = collectionData(orgsQuery, { idField: 'id' }) as Observable<Organization[]>;

//   // Debug: Log what data is received
//   observable.subscribe(data => {
//     console.log('📊 Organizations query result:', data);
//     console.log('📊 Number of organizations found:', data.length);
//   });

//   return observable;
// }
// getUserOrganizations(): Observable<Organization[]> {
//     const userId = this.auth.currentUser?.uid;
//     console.log('🔍 Querying organizations for user ID:', userId);

//     if (!userId) {
//       console.warn('❌ No user ID found');
//       return of([]);
//     }

//     try {
//       const orgsQuery = query(
//         collection(this.firestore, 'organizations'),
//         where('members', 'array-contains', userId),
//         orderBy('createdAt', 'desc')
//       );

//       const observable = collectionData(orgsQuery, { idField: 'id' }) as Observable<Organization[]>;

//       // Debug subscription
//       observable.subscribe({
//         next: (data) => console.log('📊 Organizations found:', data.length),
//         error: (err) => console.error('❌ Query error:', err)
//       });

//       return observable;
//     } catch (error) {
//       console.error('❌ Error creating query:', error);
//       return of([]);
//     }
//   }

// getUserOrganizations(): Observable<Organization[]> {
//   const userId = this.auth.currentUser?.uid;
//   console.log('🔍 Service: Querying organizations for user ID:', userId);

//   if (!userId) {
//     console.warn('❌ Service: No user ID found');
//     return of([]);
//   }

//   try {
//     const orgsQuery = query(
//       collection(this.firestore, 'organizations'),
//       where('members', 'array-contains', userId),
//       orderBy('createdAt', 'desc')
//     );

//     console.log('📋 Service: Query created successfully');

//     const observable = collectionData(orgsQuery, { idField: 'id' }) as Observable<Organization[]>;

//     // ✅ Enhanced debugging
//     observable.subscribe({
//       next: (data) => {
//         console.log('📊 Service: Query returned', data.length, 'organizations');
//         console.log('📄 Service: Raw data:', data);
//       },
//       error: (err) => {
//         console.error('❌ Service: Query error:', err);
//         console.error('🔍 Service: Error details:', {
//           code: err.code,
//           message: err.message,
//           query: 'organizations where members array-contains ' + userId + ' orderBy createdAt desc'
//         });
//       }
//     });

//     return observable;
//   } catch (error) {
//     console.error('❌ Service: Error creating query:', error);
//     return of([]);
//   }
// }
// ✅ UPDATED: Accept userId parameter to avoid timing issues
getUserOrganizations(userId?: string): Observable<Organization[]> {
  const userIdToUse = userId || this.auth.currentUser?.uid;

  console.log('🔍 Service: Querying organizations for user ID:', userIdToUse);

  if (!userIdToUse) {
    console.warn('❌ Service: No user ID found');
    return of([]);
  }

  try {
    const orgsQuery = query(
      collection(this.firestore, 'organizations'),
      where('members', 'array-contains', userIdToUse),
      orderBy('createdAt', 'desc')
    );

    console.log('📋 Service: Query created successfully');

    return collectionData(orgsQuery, { idField: 'id' }) as Observable<Organization[]>;
  } catch (error) {
    console.error('❌ Service: Error creating query:', error);
    return of([]);
  }
}

  // Get user's role in organization
  async getUserRoleInOrganization(orgId: string): Promise<string | null> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) return null;

    try {
      const orgDoc = await getDoc(doc(this.firestore, 'organizations', orgId));
      if (orgDoc.exists()) {
        const data = orgDoc.data();
        return data['memberRoles']?.[userId] || 'viewer';
      }
    } catch (error) {
      console.error('Error getting user role:', error);
    }
    return null;
  }

  // Get organization members
  async getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    try {
      const orgDoc = await getDoc(doc(this.firestore, 'organizations', orgId));
      if (orgDoc.exists()) {
        const data = orgDoc.data();
        const members = data['members'] || [];
        const memberRoles = data['memberRoles'] || {};

        // Convert to OrganizationMember format
        return members.map((userId: string) => ({
          id: userId,
          userId: userId,
          email: userId, // You might want to fetch actual email from users collection
          displayName: userId,
          role: memberRoles[userId] || 'viewer',
          joinedAt: data['createdAt']
        }));
      }
    } catch (error) {
      console.error('Error getting members:', error);
    }
    return [];
  }
// async updateMemberRole(orgId: string, userId: string, newRole: 'admin' | 'editor' | 'viewer'): Promise<void> {
//   const orgRef = doc(this.firestore, 'organizations', orgId);
//   const memberPath = `members/${userId}`;
  
//   // Assuming members are stored as a subcollection or inside an array/map:
//   // You need to update the role field for the member in Firestore here - e.g.:
  
//   // Example if members are stored as a subcollection:
//   const memberDocRef = doc(this.firestore, `organizations/${orgId}/members/${userId}`);
//   await updateDoc(memberDocRef, { role: newRole });
  
//   // Or if members are stored as an array in org document, modify accordingly.
// }
async updateMemberRole(orgId: string, userId: string, newRole: string): Promise<void> {
  const orgDocRef = doc(this.firestore, `organizations/${orgId}`);
  // Update single field in memberRoles map
  const fieldPath = `memberRoles.${userId}`;
  await updateDoc(orgDocRef, {
    [fieldPath]: newRole
  });
}

  // Add member to organization
  async addMemberToOrganization(orgId: string, memberData: any): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    try {
      const orgRef = doc(this.firestore, 'organizations', orgId);
      const orgDoc = await getDoc(orgRef);

      if (orgDoc.exists()) {
        const data = orgDoc.data();
        const currentMembers = data['members'] || [];
        const currentRoles = data['memberRoles'] || {};

        // Use email as member ID for now (you should resolve to actual Firebase UID)
        const memberId = memberData.email.replace(/[^a-zA-Z0-9]/g, '_');

        await updateDoc(orgRef, {
          members: [...currentMembers, memberId],
          memberRoles: {
            ...currentRoles,
            [memberId]: memberData.role
          }
        });
      }
    } catch (error) {
      console.error('Error adding member:', error);
      throw error;
    }
  }

  // Remove member from organization
  async removeMemberFromOrganization(orgId: string, memberId: string): Promise<void> {
    try {
      const orgRef = doc(this.firestore, 'organizations', orgId);
      const orgDoc = await getDoc(orgRef);

      if (orgDoc.exists()) {
        const data = orgDoc.data();
        const currentMembers = data['members'] || [];
        const currentRoles = data['memberRoles'] || {};

        // Remove from members array and roles
        const updatedMembers = currentMembers.filter((id: string) => id !== memberId);
        delete currentRoles[memberId];

        await updateDoc(orgRef, {
          members: updatedMembers,
          memberRoles: currentRoles
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  // Transaction methods
  async createOrganizationTransaction(orgId: string, transactionData: Partial<OrganizationTransaction>): Promise<void> {
    const userId = this.auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const newTransaction = {
      ...transactionData,
      createdBy: userId,
      createdByName: this.auth.currentUser?.displayName || this.auth.currentUser?.email || '',
      createdAt: serverTimestamp()
    };

    await addDoc(collection(this.firestore, `organizations/${orgId}/transactions`), newTransaction);
  }

  getOrganizationTransactions(orgId: string): Observable<OrganizationTransaction[]> {
    const transactionsQuery = query(
      collection(this.firestore, `organizations/${orgId}/transactions`),
      orderBy('createdAt', 'desc')
    );

    return collectionData(transactionsQuery, { idField: 'id' }) as Observable<OrganizationTransaction[]>;
  }

  async deleteOrganizationTransaction(orgId: string, transactionId: string): Promise<void> {
    await deleteDoc(doc(this.firestore, `organizations/${orgId}/transactions`, transactionId));
  }
}
