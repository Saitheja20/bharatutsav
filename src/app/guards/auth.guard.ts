import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  private auth = inject(Auth);
  private router = inject(Router);

  canActivate(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('✅ Auth Guard: User authenticated');
          observer.next(true);
          observer.complete();
        } else {
          console.log('❌ Auth Guard: User not authenticated, redirecting');
          this.router.navigate(['/login']);
          observer.next(false);
          observer.complete();
        }
        unsubscribe(); // Clean up listener
      });
    });
  }
}
