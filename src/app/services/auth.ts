// auth.service.ts
import { Injectable, NgZone, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSource = new BehaviorSubject<User | null>(null);
  user$: Observable<User | null> = this.userSource.asObservable();

  private userRoleSource = new BehaviorSubject<string>('viewer');
  userRole$: Observable<string> = this.userRoleSource.asObservable();

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Only run authentication in browser environment
    if (isPlatformBrowser(this.platformId)) {
      this.initializeAuth();
    }
  }

  // private initializeAuth() {
  //   onAuthStateChanged(this.auth, async (user) => {
  //     this.ngZone.run(async () => {
  //       this.userSource.next(user);
  //       if (user) {
  //         const userDocRef = doc(this.firestore, 'users', user.uid);
  //         const userDocSnap = await getDoc(userDocRef);

  //         if (userDocSnap.exists()) {
  //           const role = userDocSnap.data()['role'] || 'viewer';
  //           this.userRoleSource.next(role);
  //         } else {
  //           await setDoc(userDocRef, {
  //             email: user.email,
  //             displayName: user.displayName,
  //             role: 'viewer',
  //             createdAt: new Date()
  //           });
  //           this.userRoleSource.next('viewer');
  //         }
  //         this.router.navigate(['/dashboard']);
  //       } else {
  //         this.userRoleSource.next('viewer');
  //       }
  //     });
  //   });
  // }

  // async signInWithGoogle(): Promise<void> {
  //   // Only run in browser environment
  //   if (!isPlatformBrowser(this.platformId)) {
  //     console.warn('Authentication not supported in server environment');
  //     return;
  //   }

  //   console.log("Google sign-in initiated");
  //   try {
  //     const provider = new GoogleAuthProvider();
  //     provider.setCustomParameters({
  //       prompt: 'select_account'
  //     });

  //     const result = await signInWithPopup(this.auth, provider);
  //     console.log('Google sign-in successful:', result.user);
  //   } catch (error: unknown) {
  //     this.handleAuthError(error);
  //     throw error;
  //   }
  // }

  async signInWithGoogle(): Promise<void> {
  console.log("Google sign-in initiated");
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });

    const result = await signInWithPopup(this.auth, provider);
    console.log('Google sign-in successful:', result.user);

    // Add immediate navigation as fallback
    setTimeout(() => {
      console.log('Fallback navigation to dashboard');
      this.ngZone.run(() => {
        this.router.navigate(['/dashboard']);
      });
    }, 2000);

  } catch (error: unknown) {
    this.handleAuthError(error);
    throw error;
  }
}

  private handleAuthError(error: unknown): void {
    if (error instanceof Error) {
      const firebaseError = error as any;
      console.error('Firebase Auth Error Code:', firebaseError.code);
      console.error('Firebase Auth Error Message:', firebaseError.message);

      // Use console.warn instead of alert for SSR compatibility
      if (isPlatformBrowser(this.platformId)) {
        switch (firebaseError.code) {
          case 'auth/popup-blocked':
            alert('Popup was blocked. Please allow popups for this site and try again.');
            break;
          case 'auth/popup-closed-by-user':
            console.log('User cancelled sign-in');
            break;
          default:
            alert('Google sign-in failed. Please try again.');
        }
      } else {
        console.warn('Authentication error (server-side):', firebaseError.message);
      }
    }
  }

  async signOut(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      await signOut(this.auth);
      this.ngZone.run(() => {
        this.router.navigate(['/login']);
      });
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  // auth.service.ts
private async initializeAuth() {
  onAuthStateChanged(this.auth, async (user) => {
    this.ngZone.run(async () => {
      this.userSource.next(user);
      if (user) {
        try {
          const userDocRef = doc(this.firestore, 'users', user.uid);

          // Add timeout and better error handling
          const userDocSnap = await Promise.race([
            getDoc(userDocRef),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout')), 5000)
            )
          ]) as any;

          if (userDocSnap.exists()) {
            const role = userDocSnap.data()['role'] || 'viewer';
            this.userRoleSource.next(role);
            console.log('User role loaded:', role);
          } else {
            // Create user document
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              role: 'viewer',
              createdAt: new Date()
            });
            this.userRoleSource.next('viewer');
            console.log('New user document created');
          }

          // Navigate to dashboard after successful user setup
          console.log('Navigating to dashboard...');
          this.router.navigate(['/dashboard']);

        } catch (error) {
          console.error('Firestore error:', error);
          // Still allow navigation even if Firestore fails
          this.userRoleSource.next('viewer');
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.userRoleSource.next('viewer');
        console.log('User signed out');
      }
    });
  });
}

}
