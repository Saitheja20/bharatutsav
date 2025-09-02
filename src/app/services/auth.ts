import { Injectable, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import {  signInWithRedirect, getRedirectResult } from '@angular/fire/auth';

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
    private ngZone: NgZone // To ensure navigation happens within Angular zone
  ) {

    this.handleRedirectResult();

  // Listen for auth state changes
  onAuthStateChanged(this.auth, async (user) => {
    // ... existing code
  });
    // Listen for auth state changes
    onAuthStateChanged(this.auth, async (user) => {
      this.ngZone.run(async () => {
        this.userSource.next(user);
        if (user) {
          const userDocRef = doc(this.firestore, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const role = userDocSnap.data()['role'] || 'viewer';
            this.userRoleSource.next(role);
          } else {
            // New user, create a document with default role
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName,
              role: 'viewer', // Default role for new users
              createdAt: new Date()
            });
            this.userRoleSource.next('viewer');
          }
        } else {
          this.userRoleSource.next('viewer');
        }
      });
    });
  }

  // async signInWithGoogle(): Promise<void> {
  //   console.log("its came to auth service");
  //   try {
  //     const provider = new GoogleAuthProvider();
  //     await signInWithPopup(this.auth, provider);
  //     this.ngZone.run(() => {
  //       this.router.navigate(['/dashboard']);
  //     });
  //   } catch (error) {
  //     console.error('Error signing in with Google:', error);
  //     throw error;
  //   }
  // }

//   async signInWithGoogle(): Promise<void> {
//   console.log("its came to auth service");
//   try {
//     const provider = new GoogleAuthProvider();

//     // Add these popup configurations
//     provider.setCustomParameters({
//       prompt: 'select_account'
//     });

//     // Add popup configuration
//     const result = await signInWithPopup(this.auth, provider);
//     console.log('Google sign-in successful:', result.user);

//     this.ngZone.run(() => {
//       this.router.navigate(['/dashboard']);
//     });
//   } catch (error) {
//     console.error('Error signing in with Google:', error);

//     // More detailed error handling with type guard
//     if (typeof error === 'object' && error !== null && 'code' in error) {
//       const err = error as { code: string };
//       if (err.code === 'auth/popup-blocked') {
//         alert('Popup was blocked. Please allow popups for this site and try again.');
//       } else if (err.code === 'auth/popup-closed-by-user') {
//         console.log('User closed the popup');
//       } else {
//         alert('Google sign-in failed. Please try again.');
//       }
//     } else {
//       alert('Google sign-in failed. Please try again.');
//     }

//     throw error;
//   }
// }


  // auth.service. below working ok ocde of signing with google
// async signInWithGoogle(): Promise<void> {
//   console.log("Google sign-in initiated");
//   try {
//     const provider = new GoogleAuthProvider();

//     // Add custom parameters
//     provider.setCustomParameters({
//       prompt: 'select_account'
//     });

//     const result = await signInWithPopup(this.auth, provider);
//     console.log('Google sign-in successful:', result.user);

//     this.ngZone.run(() => {
//       this.router.navigate(['/dashboard']);
//     });
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

    // Use redirect instead of popup
    await signInWithRedirect(this.auth, provider);
    // Note: Navigation will happen after redirect completes
  } catch (error: unknown) {
    this.handleAuthError(error);
    throw error;
  }
}

// Add this method to handle redirect result
async handleRedirectResult(): Promise<void> {
  try {
    const result = await getRedirectResult(this.auth);
    if (result) {
      console.log('Google sign-in successful:', result.user);
      this.ngZone.run(() => {
        this.router.navigate(['/dashboard']);
      });
    }
  } catch (error) {
    this.handleAuthError(error);
  }
}

private handleAuthError(error: unknown): void {
  if (error instanceof Error) {
    const firebaseError = error as any;
    console.error('Firebase Auth Error Code:', firebaseError.code);
    console.error('Firebase Auth Error Message:', firebaseError.message);

    switch (firebaseError.code) {
      case 'auth/internal-error':
        console.error('Internal error - likely CSP blocking Google APIs');
        alert('Authentication service blocked. Please check browser settings and disable ad blockers.');
        break;
      case 'auth/popup-blocked':
        alert('Popup was blocked. Please allow popups for this site and try again.');
        break;
      case 'auth/popup-closed-by-user':
        console.log('User closed the popup');
        break;
      case 'auth/network-request-failed':
        alert('Network error. Please check your internet connection.');
        break;
      default:
        console.error('Error signing in with Google:', error);
        alert('Google sign-in failed. Please try again.');
    }
  } else {
    console.error('Unknown error:', error);
    alert('An unexpected error occurred.');
  }
}


  async signOut(): Promise<void> {
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
}
