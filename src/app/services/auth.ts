import { Injectable, NgZone } from '@angular/core';
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
    private ngZone: NgZone // To ensure navigation happens within Angular zone
  ) {
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

  async signInWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      this.ngZone.run(() => {
        this.router.navigate(['/dashboard']);
      });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
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
