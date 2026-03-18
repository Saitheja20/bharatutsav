import { Component, OnInit, NgZone, inject } from '@angular/core';
import { Auth, onAuthStateChanged, signOut } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.html',
  styleUrl: './navigation.css'
})
export class NavigationComponent implements OnInit {
  private ngZone = inject(NgZone);
  isAuth = false;
  userName = 'Loading...';
  userPhotoUrl: string | null = null;
  userRole = 'viewer';
  sidebarOpen = false;

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) { }

  ngOnInit(): void {
    this.ngZone.run(() => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          this.isAuth = true;
          this.userName = user.displayName || user.email || 'User';
          this.userPhotoUrl = user.photoURL;
          document.body.classList.add('has-sidebar');

          const userDocRef = doc(this.firestore, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            this.userRole = userDocSnap.data()['role'] || 'viewer';
          } else {
            this.userRole = 'viewer';
          }
        } else {
          this.isAuth = false;
          this.userName = 'Guest';
          this.userPhotoUrl = null;
          this.userRole = 'viewer';
          document.body.classList.remove('has-sidebar');
        }
      });
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }
}
