import { Component, OnInit, NgZone,  inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, addDoc,collection, query, getDocs, setDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { NavigationComponent } from '../navigation/navigation';

@Component({
  selector: 'app-members',
  standalone: true,
  imports: [CommonModule, FormsModule, NavigationComponent],
  templateUrl: './members.html',
  styleUrl: './members.css'
})
export class MembersComponent implements OnInit {

// private auth = inject(Auth);
  private ngZone = inject(NgZone);

  userRole = 'viewer';
  currentUserId: string | null = null;
  isLoadingMembers = true;
  isAddingMember = false;
  isUpdatingRole = false;
  isRemovingMember = false;
  bootstrap: any;
  allMembers: any[] = [];
  filteredMembers: any[] = [];

  // FIX: Declare the filterRole property here
  filterRole = '';

  newMember = {
    email: '',
    role: ''
  };

  memberToUpdate: any = null;
  newRole = '';

  memberToRemove: any = null;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router
  ) { }

  ngOnInit(): void {

 this.ngZone.run(() => {
      onAuthStateChanged(this.auth, user => {
        // Your auth state handling logic here

           onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.currentUserId = user.uid;
        const userDoc = await getDoc(doc(this.firestore, 'users', user.uid));
        this.userRole = userDoc.exists() ? userDoc.data()['role'] || 'viewer' : 'viewer';

        if (this.userRole === 'admin') {
          this.loadMembers();
        } else {
          this.isLoadingMembers = false;
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
      });
    });



  }
async inviteUser(email: string, role: 'admin' | 'member' | 'editor' = 'member') {
  if (this.userRole !== 'admin') {
    alert('Only admins can invite users');
    return;
  }

  try {
    const invitation = {
      email: email,
      role: role,
      invitedBy: this.currentUserId,
      invitedAt: new Date(),
      status: 'pending'
    };

    await addDoc(collection(this.firestore, 'invitations'), invitation);

    // You can optionally send an invitation email here or notify in the UI
    alert(`${email} has been invited as ${role}`);

    this.loadMembers(); // Refresh member/invitation list if needed
  } catch (error) {
    console.error('Error sending invitation:', error);
    alert('Failed to invite user. Please try again.');
  }
}

  async addMember(): Promise<void> {
    this.isAddingMember = true;
    try {
      const existingMember = this.allMembers.find(member => member.email === this.newMember.email);
      if (existingMember) {
        alert('User is already a member!');
        return;
      }

      const memberId = this.newMember.email.replace(/[^a-zA-Z0-9]/g, '_');

      await setDoc(doc(this.firestore, 'users', memberId), {
        email: this.newMember.email,
        role: this.newMember.role,
        status: 'invited',
        invitedBy: this.currentUserId,
        invitedAt: serverTimestamp(),
        displayName: this.newMember.email.split('@')[0]
      });

      this.newMember.email = '';
      this.newMember.role = '';
      this.loadMembers();
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      this.isAddingMember = false;
    }
  }

  async loadMembers(): Promise<void> {
    this.isLoadingMembers = true;
    try {
      const q = query(collection(this.firestore, 'users'));
      const querySnapshot = await getDocs(q);

      this.allMembers = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      this.filterMembers();
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      this.isLoadingMembers = false;
    }
  }

  filterMembers(): void {
    // The error was here, trying to use this.filterRole before it was defined.
    if (this.filterRole) {
      this.filteredMembers = this.allMembers.filter(member => member.role === this.filterRole);
    } else {
      this.filteredMembers = [...this.allMembers];
    }
  }

  showChangeRoleModal(member: any): void {
    this.memberToUpdate = member;
    this.newRole = member.role;
    // Open the Bootstrap modal by ID
    const modalElement = document.getElementById('changeRoleModal');
    if (modalElement) {
      // Use the global bootstrap from window
      const bootstrapModal = (window as any).bootstrap?.Modal;
      if (bootstrapModal) {
        const modal = new bootstrapModal(modalElement);
        modal.show();
      } else {
        console.error('Bootstrap Modal is not available on window.');
      }
    }
  }

  async updateMemberRole(): Promise<void> {
    if (!this.memberToUpdate) return;
    this.isUpdatingRole = true;
    try {
      await updateDoc(doc(this.firestore, 'users', this.memberToUpdate.id), {
        role: this.newRole,
        updatedAt: serverTimestamp(),
        updatedBy: this.currentUserId
      });
      this.loadMembers();
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      this.isUpdatingRole = false;
    }
  }

  showRemoveMemberModal(member: any): void {
    this.memberToRemove = member;

    const modalElement = document.getElementById('removeMemberModal');
    if (modalElement) {
      const bootstrapModal = (window as any).bootstrap?.Modal;
      if (bootstrapModal) {
        const modal = new bootstrapModal(modalElement);
        modal.show();
      } else {
        console.error('Bootstrap Modal is not available on window.');
      }
    }
  }

  async removeMember(): Promise<void> {
    if (!this.memberToRemove) return;
    this.isRemovingMember = true;
    try {
      await deleteDoc(doc(this.firestore, 'users', this.memberToRemove.id));
      this.loadMembers();
    } catch (error) {
      console.error('Error removing member:', error);
    } finally {
      this.isRemovingMember = false;
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'bg-danger';
      case 'editor': return 'bg-warning';
      case 'viewer': return 'bg-success';
      default: return 'bg-secondary';
    }
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'admin': return 'fa-crown';
      case 'editor': return 'fa-edit';
      case 'viewer': return 'fa-eye';
      default: return 'fa-user';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-success';
      case 'invited': return 'bg-warning';
      default: return 'bg-secondary';
    }
  }
}
