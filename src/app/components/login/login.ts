import { Component, OnInit } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [], // Add any Angular modules you need here
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {

  constructor(private auth: Auth, private router: Router) { }

  ngOnInit(): void {
    // You can optionally add logic here to check if the user is already authenticated
    // and redirect them if so.
  }

  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      // After successful login, redirect to the dashboard
      this.router.navigate(['/dashboard']);
    } catch (error) {
      console.error('Error signing in:', error);
      alert('Error signing in. Please try again.');
    }
  }

}
