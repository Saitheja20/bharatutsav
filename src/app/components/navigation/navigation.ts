import { Component, OnInit,NgZone, inject } from '@angular/core';
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

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) { }

  ngOnInit(): void {

    this.ngZone.run(() => {
      onAuthStateChanged(this.auth, user => {
           // Your auth state handling logic here
 onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        this.isAuth = true;
        this.userName = user.displayName || user.email || 'User';
        this.userPhotoUrl = user.photoURL;

        // Fetch user role from Firestore
        const userDocRef = doc(this.firestore, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          this.userRole = userDocSnap.data()['role'] || 'viewer';
        } else {
          console.warn('User document not found. Defaulting to viewer role.');
          this.userRole = 'viewer';
        }
      } else {
        this.isAuth = false;
        this.userName = 'Guest';
        this.userPhotoUrl = null;
        this.userRole = 'viewer';
      }
    });

      });
    });


    // Listen for authentication state changes

  }

  async signOut() {
    try {
      await signOut(this.auth);
      this.router.navigate(['/login']); // Redirect to login page after sign out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

}
