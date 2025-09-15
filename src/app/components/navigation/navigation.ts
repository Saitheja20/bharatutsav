import { Component, OnInit, NgZone, inject, ChangeDetectorRef } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  isAuth = false;
  userName = 'Loading...';
  userPhotoUrl: string | null = null;
  userRole = 'viewer';
  defaultPhotoUrl = 'images/basics/defaultimage.png';

  constructor(private auth: Auth, private firestore: Firestore, private router: Router) { }

  ngOnInit(): void {
    this.ngZone.run(() => {
      onAuthStateChanged(this.auth, async (user) => {
        if (user) {
          this.isAuth = true;
          this.userName = user.displayName || user.email || 'User';

          // Handle photoURL with processing
          let photoUrl = this.getGooglePhotoUrl(user) || user.photoURL;
          this.userPhotoUrl = photoUrl ? this.processGooglePhotoUrl(photoUrl) : null;

          console.log('Processed photoURL:', this.userPhotoUrl);

          try {
            const userDocRef = doc(this.firestore, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              this.userRole = userDocSnap.data()['role'] || 'viewer';
            } else {
              this.userRole = 'viewer';
            }
          } catch (error) {
            console.error('Error fetching user role:', error);
            this.userRole = 'viewer';
          }
        } else {
          this.isAuth = false;
          this.userName = 'Guest';
          this.userPhotoUrl = null;
          this.userRole = 'viewer';
        }

        this.cdr.detectChanges();
      });
    });
  }

  // Get photoURL from Google provider data
  private getGooglePhotoUrl(user: any): string | null {
    try {
      if (user.providerData && user.providerData.length > 0) {
        const googleProvider = user.providerData.find(
          (provider: any) => provider.providerId === 'google.com'
        );

        if (googleProvider && googleProvider.photoURL) {
          return googleProvider.photoURL;
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting Google photo URL:', error);
      return null;
    }
  }

  // Process Google photo URL for better access
  private processGooglePhotoUrl(photoUrl: string): string {
    if (photoUrl && photoUrl.includes('googleusercontent.com')) {
      // Remove size restrictions and add parameters for better access
      return photoUrl.replace(/=s\d+-c$/, '=s200-c');
    }
    return photoUrl;
  }

  onImageError(event: any) {
    console.log('Image failed to load, using default');
    console.log('Failed URL:', event.target.src);
    event.target.src = this.defaultPhotoUrl;
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
