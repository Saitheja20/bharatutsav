import { Injectable, inject } from '@angular/core';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  private userSubject = new BehaviorSubject<User | null>(null);
  private authLoadingSubject = new BehaviorSubject<boolean>(true);

  public user$ = this.userSubject.asObservable();
  public authLoading$ = this.authLoadingSubject.asObservable();

  constructor() {
    onAuthStateChanged(this.auth, (user) => {
      this.userSubject.next(user);
      this.authLoadingSubject.next(false);
    });
  }

  get currentUser(): User | null {
    return this.userSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  redirectToLogin(): void {
    this.router.navigate(['/login']);
  }
}
